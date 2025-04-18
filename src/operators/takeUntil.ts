import Observable from "../Observable.js"

export const takeUntil = <T>(notifier: Observable<unknown>) => {
  return (limited: Observable<T>) => {
    return new Observable<T>((subscriber) => {
      const notifierSubscription = notifier.subscribe({
        next(x) {
          subscriber.complete()
          limitedSubscription.unsubscribe()
          notifierSubscription.unsubscribe()
        },
        complete() {},
        error(e) {
          subscriber.error(e)
          notifierSubscription.unsubscribe()
        },
      })

      const limitedSubscription = limited.subscribe({
        next(x) {
          subscriber.next(x)
        },
        complete() {
          subscriber.complete()
          limitedSubscription.unsubscribe()
          notifierSubscription.unsubscribe()
        },
        error(e) {
          subscriber.error(e)
          notifierSubscription.unsubscribe()
          limitedSubscription.unsubscribe()
        },
      })

      return () => {
        limitedSubscription.unsubscribe()
        notifierSubscription.unsubscribe()
      }
    })
  }
}
