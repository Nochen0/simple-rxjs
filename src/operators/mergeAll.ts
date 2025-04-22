import Observable from "../Observable.js"
import Subscription from "../Subscription.js"

export const mergeAll = <T>() => {
  return (source: Observable<Observable<T>>) => {
    return new Observable<T>((subscriber) => {
      let outerCompleted = false
      let innerSubscriptions: Subscription[] = []
      const subscription = source.subscribe({
        next(x) {
          const innerSubscription = x.subscribe({
            next(y) {
              subscriber.next(y)
            },
            complete() {
              innerSubscription.unsubscribe()
              if (
                outerCompleted &&
                innerSubscriptions.every((x) => x.unsubscribed)
              ) {
                subscriber.complete()
                subscription.unsubscribe()
              }
            },
            error(e) {
              subscriber.error(e)
              innerSubscription.unsubscribe()
            },
          })
          innerSubscriptions.push(innerSubscription)
        },
        complete() {
          if (innerSubscriptions.every((x) => x.unsubscribed)) {
            subscriber.complete()
            subscription.unsubscribe()
            return
          }
          outerCompleted = true
        },
        error(e) {
          subscriber.error(e)
          subscription.unsubscribe()
          innerSubscriptions.forEach((x) => x.unsubscribe())
        },
      })

      return () => {
        subscription.unsubscribe()
        innerSubscriptions.forEach((x) => x.unsubscribe())
      }
    })
  }
}
