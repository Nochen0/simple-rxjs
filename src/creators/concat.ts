import { operate } from "../../utils/operate.js"
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
            currentSubscription = operate(
              x,
              subscriber,
              undefined,
              () => {
                if (observables.length == i + 1) subscriber.complete()
                resolve()
              },
              (e) => {
                done = true
                subscriber.error(e)
                resolve()
              }
            )
          })
      )
      .reduce((a, b) => a.then(b), Promise.resolve())
    return () => {
      done = true
      currentSubscription?.unsubscribe()
    }
  })
}
