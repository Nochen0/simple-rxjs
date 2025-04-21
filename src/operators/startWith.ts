import { operate } from "../../utils/operate.js"
import Observable from "../Observable.js"

export const startWith = <T, V>(value: V) => {
  return (source: Observable<T>) => {
    return new Observable<V | T>((subscriber) => {
      subscriber.next(value)
      const subscription = operate(source, subscriber)

      return () => {
        subscription.unsubscribe()
      }
    })
  }
}
