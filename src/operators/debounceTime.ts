import Observable from "../Observable.js"

export const debounceTime = <T>(millis: number) => {
  return (source: Observable<T>) => {
    return new Observable<T>((subscriber) => {
      let currentTimeoutId: null | number
      const subscription = source.subscribe({
        next(x) {
          if (currentTimeoutId) {
            clearTimeout(currentTimeoutId)
            currentTimeoutId = null
          }
          currentTimeoutId = setTimeout(() => {
            subscriber.next(x)
          }, millis)
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
