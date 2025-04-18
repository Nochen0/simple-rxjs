import Observable from "../Observable.js"

export const distinctUntilChanged = <T, V>(
  comparator: (x: T) => V = (x) => x as any as V
) => {
  return (source: Observable<T>) => {
    let previous: undefined | V
    return new Observable<T>((subscriber) => {
      const subscription = source.subscribe({
        next(x) {
          if (!Object.is(previous, comparator(x))) {
            subscriber.next(x)
            previous = comparator(x)
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
