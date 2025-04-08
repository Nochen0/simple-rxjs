import Observable from "./Observable"

export const map = <T, V>(f: (x: T) => V) => {
  return (observable: Observable<T>) => {
    return new Observable<V>((subscriber) => {
      observable.subscribe({
        next(x) {
          subscriber.next(f(x))
        },
        complete() {
          subscriber.complete()
        },
      })
    })
  }
}
