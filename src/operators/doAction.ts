import { operate } from "../../utils/operate.js"
import Observable from "../Observable.js"

export const doAction = <T>(effect: (x: T) => void) => {
  return (source: Observable<T>) => {
    return new Observable<T>((subscriber) => {
      const subscription = operate(source, subscriber, (x) => {
        effect(x)
        subscriber.next(x)
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }
}
