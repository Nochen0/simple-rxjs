import Observable from "../Observable"
import Subscription from "../Subscription"

export const merge = (...observables: Observable<any>[]) => {
  return new Observable((subscriber) => {
    let completedCount = 0
    const subscriptions: Subscription[] = []
    observables.forEach((observable) => {
      subscriptions.push(
        observable.subscribe({
          next(x) {
            subscriber.next(x)
          },
          complete() {
            if (++completedCount == observables.length) {
              subscriber.complete()
            }
          },
          error(e) {
            subscriber.error(e)
            subscriptions.forEach((subscription) => subscription.unsubscribe())
          },
        })
      )
    })
  })
}
