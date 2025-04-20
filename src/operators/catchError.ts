import Observable from "../Observable.js"
import { concat } from "../creators/concat.js"

export const catchError = <T, V>(selector: (e: unknown) => Observable<V>) => {
  return (source: Observable<T>) => {
    let err: unknown = null
    const caughtSource = new Observable<T>((subscriber) => {
      const subscription = source.subscribe({
        next(x) {
          subscriber.next(x)
        },
        complete() {
          subscriber.complete()
          subscription.unsubscribe()
        },
        error(e) {
          err = e
          subscriber.complete()
          subscription.unsubscribe()
        },
      })

      return () => {
        subscription.unsubscribe()
      }
    })

    return concat(caughtSource, selector(err))
  }
}
