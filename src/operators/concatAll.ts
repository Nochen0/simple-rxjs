import Observable from "../Observable.js"
import Subscription from "../Subscription.js"
import { Entry } from "../types.js"

export const concatAll = <T>(source: Observable<Observable<T>>) => {
  return new Observable<T>((subscriber) => {
    let outerCompleted = false
    let innerSubscriptions: Subscription[] = []
    let entries: Entry[] = []
    const subscription = source.subscribe({
      next(x) {
        const observableNumber = innerSubscriptions.length + 1
        entries.push({
          observableNumber,
          values: [],
          done: false,
        })
        const innerSubscription = x.subscribe({
          next(y) {
            entries[observableNumber - 1].values.push({
              value: y,
              consumed: false,
            })
            entries
              .slice(0, entries.findIndex((z) => !z.done) + 1)
              .forEach((z) => {
                z.values
                  .filter((t) => !t.consumed)
                  .forEach((t) => {
                    subscriber.next(t.value)
                    t.consumed = true
                  })
              })
          },
          complete() {
            entries[observableNumber - 1].done = true
            innerSubscription.unsubscribe()
            if (
              outerCompleted &&
              innerSubscriptions.every((x) => x.unsubscribed)
            ) {
              subscriber.complete()
              subscription.unsubscribe()
              return
            }
            entries
              .slice(0, entries.findIndex((z) => !z.done) + 1)
              .forEach((z) => {
                z.values
                  .filter((t) => !t.consumed)
                  .forEach((t) => {
                    subscriber.next(t.value)
                    t.consumed = true
                  })
              })
          },
          error(e) {
            subscriber.error(e)
            innerSubscription.unsubscribe()
          },
        })
        innerSubscriptions.push(innerSubscription)
      },
      complete() {
        if (innerSubscriptions.every((x) => x.unsubscribed)) {
          subscriber.complete()
          subscription.unsubscribe()
          return
        }
        outerCompleted = true
      },
      error(e) {
        subscriber.error(e)
        subscription.unsubscribe()
        innerSubscriptions.forEach((x) => x.unsubscribe())
      },
    })

    return () => {
      subscription.unsubscribe()
      innerSubscriptions.forEach((x) => x.unsubscribe())
    }
  })
}
