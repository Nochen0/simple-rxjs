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
            currentSubscription = source.subscribe({
              next(x) {
                subscriber.next(x)
              },
              complete() {
                successfull = true
                subscriber.complete()
                currentSubscription?.unsubscribe()
                resolve()
              },
              error(e) {
                if (i == times) {
                  subscriber.error(e)
                }
                currentSubscription?.unsubscribe()
                resolve()
              },
            })
          })
        }
      })()

      return () => {
        currentSubscription?.unsubscribe()
      }
    })
  }
}
