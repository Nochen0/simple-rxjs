import { operate } from "../../utils/operate.js"
import Observable from "../Observable.js"
import Subscription from "../Subscription.js"

export const merge = (...observables: Observable<any>[]) => {
  return new Observable((subscriber) => {
    let completedCount = 0
    const subscriptions: Subscription[] = []
    observables.forEach((observable) => {
      subscriptions.push(
        operate(
          observable,
          subscriber,
          undefined,
          () => {
            if (++completedCount == observables.length) {
              subscriber.complete()
            }
          },
          (e) => {
            subscriber.error(e)
            subscriptions
              .slice(0, subscriptions.length - 1)
              .forEach((subscription) => subscription.unsubscribe())
          }
        )
      )
    })

    return () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe())
    }
  })
}
