import Observable from "../Observable.js"
import Subscription from "../Subscription.js"

export const switchAll = <V>() => {
  return (source: Observable<Observable<V>>) => {
    return new Observable<V>((subscriber) => {
      let outerCompleted = false
      let currentSubscription: undefined | Subscription
      const subscription = source.subscribe({
        next(x) {
          currentSubscription?.unsubscribe()
          currentSubscription = x.subscribe({
            next(y) {
              subscriber.next(y)
            },
            complete() {
              currentSubscription?.unsubscribe()
              if (outerCompleted) {
                subscriber.complete()
                subscription.unsubscribe()
                currentSubscription?.unsubscribe()
              }
            },
            error(e) {
              subscriber.error(e)
              currentSubscription?.unsubscribe()
            },
          })
        },
        complete() {
          if (!currentSubscription || currentSubscription?.unsubscribed) {
            subscriber.complete()
            subscription.unsubscribe()
            currentSubscription?.unsubscribe()
            return
          }
          outerCompleted = true
        },
        error(e) {
          subscriber.error(e)
          subscription.unsubscribe()
          currentSubscription?.unsubscribe()
        },
      })

      return () => {
        currentSubscription?.unsubscribe()
        subscription.unsubscribe()
      }
    })
  }
}
