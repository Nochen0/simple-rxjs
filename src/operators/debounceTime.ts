import { operate } from "../../utils/operate.js"
import Observable from "../Observable.js"

export const debounceTime = <T>(millis: number) => {
  return (source: Observable<T>) => {
    return new Observable<T>((subscriber) => {
      let currentTimeoutId: null | number
      const subscription = operate(source, subscriber, (x) => {
        if (currentTimeoutId) {
          clearTimeout(currentTimeoutId)
          currentTimeoutId = null
        }
        currentTimeoutId = setTimeout(() => {
          subscriber.next(x)
        }, millis)
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }
}
