import { operate } from "../../utils/operate.js"
import Observable from "../Observable.js"

export const scan = <T, V>(reducer: (a: V, b: T) => V, init: V) => {
  return (source: Observable<T>) => {
    return new Observable((subscriber) => {
      let accumulation = init
      const subscription = operate(source, subscriber, (x) => {
        try {
          accumulation = reducer(accumulation, x)
          subscriber.next(accumulation)
        } catch (e) {
          subscriber.error(e)
          subscription.unsubscribe()
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }
}
