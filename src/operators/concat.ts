import Observable from "../Observable.js"
import Subscription from "../Subscription.js"

export const concat = <T>(...observables: Observable<any>[]) => {
  return new Observable<T>((subscriber) => {
    let currentSubscription: undefined | Subscription
    let done = false
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
              },
            })
          })
      )
      .reduce((a, b) => a.then(b), Promise.resolve())
    return () => {
      done = true
      currentSubscription?.unsubscribe()
    }
  })
}
