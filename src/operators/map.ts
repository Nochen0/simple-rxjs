import Observable from "../Observable.js"

export const map = <T, V>(f: (x: T) => V) => {
  return (source: Observable<T>) => {
    return new Observable<V>((subscriber) => {
      const subscription = source.subscribe({
        next(y) {
          try {
            subscriber.next(f(y))
          } catch (e) {
            subscriber.error(e)
          }
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
}
