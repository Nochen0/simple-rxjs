import Observable from "../Observable.js"

export const filter =
  <T>(predicate: (x: T) => boolean) =>
  (source: Observable<T>) => {
    return new Observable<T>((subscriber) => {
      const subscription = source.subscribe({
        next(x) {
          if (predicate(x)) subscriber.next(x)
        },
        complete() {
          subscriber.complete()
          subscription.unsubscribe()
        },
        error(e) {
          subscriber.error(e)
          subscription.unsubscribe()
        },
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }
