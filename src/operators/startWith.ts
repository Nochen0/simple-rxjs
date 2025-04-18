import Observable from "../Observable.js"

export const startWith = <T, V>(value: V) => {
  return (source: Observable<T>) => {
    return new Observable<V | T>((subscriber) => {
      subscriber.next(value)
      const subscription = source.subscribe({
        next(x) {
          subscriber.next(x)
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
