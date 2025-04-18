import Observable from "../Observable.js"

export const doAction = <T>(effect: (x: T) => void) => {
  return (source: Observable<T>) => {
    return new Observable<T>((subscriber) => {
      const subscription = source.subscribe({
        next(x) {
          effect(x)
          subscriber.next(x)
        },
        complete() {
          subscriber.complete()
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
