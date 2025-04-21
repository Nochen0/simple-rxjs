import { operate } from "../../utils/operate.js"
import Observable from "../Observable.js"

export const filter =
  <T>(predicate: (x: T) => boolean) =>
  (source: Observable<T>) => {
    return new Observable((subscriber) => {
      const subscription = operate(source, subscriber, (x) => {
        if (predicate(x)) subscriber.next(x)
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }
