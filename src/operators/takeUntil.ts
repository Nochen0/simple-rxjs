import { operate } from "../../utils/operate.js"
import Observable from "../Observable.js"

export const takeUntil = <T>(notifier: Observable<unknown>) => {
  return (limited: Observable<T>) => {
    return new Observable<T>((subscriber) => {
      const notifierSubscription = operate(notifier, subscriber, (x) => {
        subscriber.complete()
        limitedSubscription.unsubscribe()
        notifierSubscription.unsubscribe()
      })

      const limitedSubscription = operate(
        limited,
        subscriber,
        undefined,
        () => {
          subscriber.complete()
          notifierSubscription.unsubscribe()
        },
        (e) => {
          subscriber.error(e)
          notifierSubscription.unsubscribe()
        }
      )

      return () => {
        limitedSubscription.unsubscribe()
        notifierSubscription.unsubscribe()
      }
    })
  }
}
