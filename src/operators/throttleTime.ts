import { operate } from "../../utils/operate.js"
import Observable from "../Observable.js"

export const throttleTime = <T>(millis: number) => {
  return (source: Observable<T>) => {
    return new Observable<T>((subscriber) => {
      let previousMillis = 0
      const subscription = operate(source, subscriber, (x) => {
        const currentMillis = Date.now()
        if (currentMillis - previousMillis > millis) {
          previousMillis = currentMillis
          subscriber.next(x)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }
}
