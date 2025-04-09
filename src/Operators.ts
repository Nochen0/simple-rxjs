import Observable from "./Observable"
import { Entry } from "./types"

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
  return new Observable((subscriber) => {
    let outerCompleted = false
    let innerObservableCount = 0
    let completedInnerObservableCount = 0
    let entries: Entry[] = []
    const subscription = observable.subscribe({
      next(x) {
        innerObservableCount++
        const observableNumber = innerObservableCount
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
            if (
              entries.slice(0, observableNumber - 1).filter((z) => z.done)
                .length ==
              observableNumber - 1
            ) {
              entries
                .slice(
                  0,
                  entries.findIndex((z) => !z.done) != -1
                    ? entries.length
                    : entries.findIndex((z) => !z.done) + 1
                )
                .forEach((z) => {
                  return z.values
                    .filter((c) => !c.consumed)
                    .forEach((c) => subscriber.next(c.value))
                })
              entries = entries.flatMap(
                ({ observableNumber, values, done }, index) => {
                  return values.map(({ value }) => {
                    return {
                      observableNumber,
                      done,
                      values:
                        index < entries.findIndex((z) => !z.done) + 1
                          ? [{ value, consumed: true }]
                          : values,
                    }
                  })
                }
              )
            }
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
            }
          },
        })
      },
      complete() {
        outerCompleted = true
      },
    })

    return () => {
      subscription.unsubscribe()
    }
  })
}

export const limit = (limitBy: number) => (observable: Observable<unknown>) => {
  return new Observable((subscriber) => {
    let count = 0
    const subscription = observable.subscribe({
      next(x) {
        count++
        subscriber.next(x)
      },
      complete() {
        if (count == limitBy) {
          subscriber.complete()
        }
      },
    })

    return () => {
      subscription.unsubscribe()
    }
  })
}
