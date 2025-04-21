import { operate } from "../../utils/operate.js"
import Observable from "../Observable.js"
import { concat } from "../creators/concat.js"

export const catchError = <T, V>(selector: (e: unknown) => Observable<V>) => {
  return (source: Observable<T>) => {
    let err: unknown = null
    const caughtSource = new Observable<T>((subscriber) => {
      const subscription = operate(
        source,
        subscriber,
        undefined,
        undefined,
        (e) => {
          err = e
          subscriber.complete()
        }
      )

      return () => {
        subscription.unsubscribe()
      }
    })

    return concat(caughtSource, selector(err))
  }
}
