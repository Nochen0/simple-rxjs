import { operate } from "../../utils/operate.js"
import Observable from "../Observable.js"
import Subscription from "../Subscription.js"

export const retry = <T>(times: number) => {
  return (source: Observable<T>) => {
    return new Observable<T>((subscriber) => {
      let currentSubscription: undefined | Subscription
      let successfull = false
      ;(async () => {
        for (let i = 0; i < times + 1; i++) {
          if (successfull) break
          await new Promise<void>((resolve) => {
            currentSubscription = operate(
              source,
              subscriber,
              undefined,
              () => {
                successfull = true
                subscriber.complete()
                resolve()
              },
              (e) => {
                if (i == times) {
                  subscriber.error(e)
                }
                resolve()
              }
            )
          })
        }
      })()

      return () => {
        currentSubscription?.unsubscribe()
      }
    })
  }
}
