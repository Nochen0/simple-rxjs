import { operate } from "../../utils/operate.js"
import Observable from "../Observable.js"

export const map = <T, V>(f: (x: T) => V) => {
  return (source: Observable<T>) => {
    return new Observable<V>((subscriber) => {
      const subscription = operate<T, V>(source, subscriber, (y) => {
        try {
          subscriber.next(f(y))
        } catch (e) {
          subscriber.error(e)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }
}
