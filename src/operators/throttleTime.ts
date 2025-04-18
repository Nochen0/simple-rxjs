import Observable from "../Observable.js"

export const throttleTime = <T>(millis: number) => {
  return (source: Observable<T>) => {
    return new Observable<T>((subscriber) => {
      let previousMillis = 0
      const subscription = source.subscribe({
        next(x) {
          const currentMillis = Date.now()
          if (currentMillis - previousMillis > millis) {
            previousMillis = currentMillis
            subscriber.next(x)
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
