import { operate } from "../../utils/operate.js"
import Observable from "../Observable.js"

export const distinctUntilChanged = <T, V>(
  comparator: (x: T) => V = (x) => x as any as V
) => {
  return (source: Observable<T>) => {
    let previous: undefined | V
    return new Observable<T>((subscriber) => {
      const subscription = operate(source, subscriber, (x) => {
        if (!Object.is(previous, comparator(x))) {
          subscriber.next(x)
          previous = comparator(x)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }
}
