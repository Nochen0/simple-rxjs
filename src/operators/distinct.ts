import Observable from "../Observable.js"

export const distinct = <T, V>(
  comparator: (x: T) => V = (x) => x as any as V
) => {
  return (source: Observable<T>) => {
    let previousValues: V[] = []
    return new Observable<T>((subscriber) => {
      const subscription = source.subscribe({
        next(x) {
          if (previousValues.find((y) => Object.is(y, comparator(x)))) {
            subscriber.next(x)
            previousValues.push(comparator(x))
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
