import Observable from "./Observable.js"
import { Entry } from "./types.js"

export const map = <T, V>(f: (x: T) => V) => {
  return (observable: Observable<T>) => {
    return new Observable<V>((subscriber) => {
      const subscription = observable.subscribe({
        next(x) {
          subscriber.next(f(x))
        },
        complete() {
          subscriber.complete()
        },
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }
}

export const mergeAll = <T>(
  observable: Observable<Observable<T>>
): Observable<T> => {
  return new Observable((subscriber) => {
    let outerCompleted = false
    let completedInnerObservableCount = 0
    let innerObservableCount = 0
    const subscription = observable.subscribe({
      next(x) {
        innerObservableCount++
        const innerSubscription = x.subscribe({
          next(y) {
            subscriber.next(y)
          },
          complete() {
            innerSubscription.unsubscribe()
            completedInnerObservableCount++
            if (
              outerCompleted &&
              completedInnerObservableCount == innerObservableCount
            ) {
              subscriber.complete()
            }
          },
        })
      },
      complete() {
        if (innerObservableCount == 0) {
          subscriber.complete()
          subscription.unsubscribe()
          return
        }
        outerCompleted = true
      },
    })

    return () => {
      subscription.unsubscribe()
    }
  })
}

export const concatAll = <T>(
  observable: Observable<Observable<T>>
): Observable<T> => {
  return new Observable<T>((subscriber) => {
    let outerCompleted = false
    let innerObservableCount = 0
    let completedInnerObservableCount = 0
    let entries: Entry[] = []
    const subscription = observable.subscribe({
      next(x) {
        const observableNumber = ++innerObservableCount
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
            completedInnerObservableCount++
            entries[observableNumber - 1].done = true
            innerSubscription.unsubscribe()
            if (
              outerCompleted &&
              completedInnerObservableCount == entries.length
            ) {
              subscriber.complete()
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
        })
      },
      complete() {
        if (innerObservableCount == 0) {
          subscriber.complete()
          subscription.unsubscribe()
          return
        }
        outerCompleted = true
      },
    })

    return () => {
      subscription.unsubscribe()
    }
  })
}

export const take = (limitBy: number) => (observable: Observable<unknown>) => {
  return new Observable<unknown>((subscriber) => {
    let count = 0
    const subscription = observable.subscribe({
      next(x) {
        if (count == limitBy) {
          subscription.unsubscribe()
          subscriber.complete()
          return
        }
        count++
        subscriber.next(x)
      },
      complete() {
        subscriber.complete()
        subscription.unsubscribe()
      },
    })

    return () => {
      subscription.unsubscribe()
    }
  })
}

export const takeUntil = <T>(
  limited: Observable<T>,
  notifier: Observable<unknown>
) => {
  return new Observable<T>((subscriber) => {
    const notifierSubscription = notifier.subscribe({
      next(x) {
        subscriber.complete()
        limitedSubscription.unsubscribe()
        notifierSubscription.unsubscribe()
      },
      complete() {},
    })

    const limitedSubscription = limited.subscribe({
      next(x) {
        subscriber.next(x)
      },
      complete() {
        subscriber.complete()
        limitedSubscription.unsubscribe()
        notifierSubscription.unsubscribe()
      },
    })

    return () => {
      limitedSubscription.unsubscribe()
      notifierSubscription.unsubscribe()
    }
  })
}
