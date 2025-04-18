import Observable from "../Observable.js"
import Subscription from "../Subscription.js"

export const concatWith = <T, V>(...observables: Observable<V>[]) => {
  return (source: Observable<T>) => {
    return new Observable<T | V>((subscriber) => {
      let currentSubscription: undefined | Subscription
      let done = false
      const sourceSubscription = source.subscribe({
        next(x) {
          subscriber.next(x)
        },
        complete() {
          observables
            .map(
              (x, i) => () =>
                new Promise<void>((resolve) => {
                  if (done) {
                    resolve()
                    return
                  }
                  currentSubscription = x.subscribe({
                    next(y) {
                      subscriber.next(y)
                    },
                    complete() {
                      if (observables.length == i + 1) subscriber.complete()
                      currentSubscription!.unsubscribe()
                      resolve()
                    },
                    error(e) {
                      subscriber.error(e)
                      currentSubscription?.unsubscribe()
                      resolve()
                    },
                  })
                })
            )
            .reduce((a, b) => a.then(b), Promise.resolve())
        },
        error(e) {
          subscriber.error(e)
          sourceSubscription.unsubscribe()
        },
      })

      return () => {
        done = true
        currentSubscription?.unsubscribe()
        sourceSubscription.unsubscribe()
      }
    })
  }
}
