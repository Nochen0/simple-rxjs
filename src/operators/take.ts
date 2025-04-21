import { operate } from "../../utils/operate.js"
import Observable from "../Observable.js"

export const take = <T>(limitBy: number) => {
  return (source: Observable<T>) => {
    return new Observable<T>((subscriber) => {
      let count = 0
      const subscription = operate(source, subscriber, (x) => {
        count++
        if (count <= limitBy) {
          subscriber.next(x)
          if (count == limitBy) {
            subscriber.complete()
            subscription.unsubscribe()
          }
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }
}
