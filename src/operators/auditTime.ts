import { operate } from "../../utils/operate.js"
import Observable from "../Observable.js"

export const auditTime = <T>(millis: number) => {
  return (source: Observable<T>) => {
    return new Observable<T>((subscriber) => {
      let previousMillis = 0
      let currentMillis: undefined | number
      let lastEmission: undefined | T

      const subscription = operate(source, subscriber, (x) => {
        currentMillis = Date.now()
        lastEmission = x

        if (currentMillis - previousMillis > millis) {
          previousMillis = Date.now()

          setTimeout(() => {
            subscriber.next(lastEmission!)
          }, millis)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }
}
