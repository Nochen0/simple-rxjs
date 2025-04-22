import { operate } from "../../utils/operate.js"
import Observable from "../Observable.js"
import Subscription from "../Subscription.js"

export const catchError = <T, V>(selector: (e: unknown) => Observable<V>) => {
  return (source: Observable<T>) => {
    let selectorSubscription: undefined | Subscription
    return new Observable<T | V>((subscriber) => {
      const subscription = operate(
        source,
        subscriber,
        undefined,
        undefined,
        (e) => {
          selectorSubscription = operate(selector(e), subscriber)
        }
      )

      return () => {
        subscription.unsubscribe()
        selectorSubscription?.unsubscribe()
      }
    })
  }
}
