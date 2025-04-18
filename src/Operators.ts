import Observable from "./Observable.js"
import Subscription from "./Subscription.js"
import { Entry } from "./types.js"

export const map = <T, V>(f: (x: T) => V) => {
  return (source: Observable<T>) => {
    return new Observable<V>((subscriber) => {
      const subscription = source.subscribe({
        next(x) {
          subscriber.next(f(x))
        },
        complete() {
          subscriber.complete()
          subscription.unsubscribe()
        },
        error(e) {
          subscriber.error(e)
        },
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }
}

export const mergeAll = <T>(
  source: Observable<Observable<T>>
): Observable<T> => {
  return new Observable((subscriber) => {
    let outerCompleted = false
    let completedInnerObservableCount = 0
    let innerSubscriptions: Subscription[] = []
    const subscription = source.subscribe({
      next(x) {
        const innerSubscription = x.subscribe({
          next(y) {
            subscriber.next(y)
          },
          complete() {
            innerSubscription.unsubscribe()
            completedInnerObservableCount++
            if (
              outerCompleted &&
              completedInnerObservableCount == innerSubscriptions.length
            ) {
              subscriber.complete()
              subscription.unsubscribe()
            }
          },
          error(e) {
            subscriber.error(e)
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
      },
    })

    return () => {
      subscription.unsubscribe()
      innerSubscriptions.forEach((x) => x.unsubscribe())
    }
  })
}

export const concatAll = <T>(
  source: Observable<Observable<T>>
): Observable<T> => {
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
      },
    })

    return () => {
      subscription.unsubscribe()
      innerSubscriptions.forEach((x) => x.unsubscribe())
    }
  })
}

export const switchAll = <V>(source: Observable<Observable<V>>) => {
  return new Observable<V>((subscriber) => {
    let outerCompleted = false
    let currentSubscription: undefined | Subscription
    const subscription = source.subscribe({
      next(x) {
        currentSubscription?.unsubscribe()
        currentSubscription = x.subscribe({
          next(y) {
            subscriber.next(y)
          },
          complete() {
            currentSubscription?.unsubscribe()
            if (outerCompleted) {
              subscriber.complete()
              subscription.unsubscribe()
              currentSubscription?.unsubscribe()
            }
          },
          error(e) {
            subscriber.error(e)
          },
        })
      },
      complete() {
        if (!currentSubscription || currentSubscription?.unsubscribed) {
          subscriber.complete()
          subscription.unsubscribe()
          currentSubscription?.unsubscribe()
          return
        }
        outerCompleted = true
      },
      error(e) {
        subscriber.error(e)
      },
    })

    return () => {
      currentSubscription?.unsubscribe()
      subscription.unsubscribe()
    }
  })
}

export const take = (limitBy: number) => (source: Observable<unknown>) => {
  return new Observable<unknown>((subscriber) => {
    let count = 0
    const subscription = source.subscribe({
      next(x) {
        count++
        if (count <= limitBy) {
          subscriber.next(x)
          if (count == limitBy) {
            subscriber.complete()
            subscription.unsubscribe()
          }
        }
      },
      complete() {
        subscriber.complete()
        subscription.unsubscribe()
      },
      error(e) {
        subscriber.error(e)
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
      error(e) {
        subscriber.error(e)
      },
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
      error(e) {
        subscriber.error(e)
      },
    })

    return () => {
      limitedSubscription.unsubscribe()
      notifierSubscription.unsubscribe()
    }
  })
}

export const throttleTime = <T>(source: Observable<T>, millis: number) => {
  return new Observable<T>((subscriber) => {
    let previousMillis = 0
    const subscription = source.subscribe({
      next(x) {
        const currentMillis = Date.now()
        if (currentMillis - previousMillis > millis) {
          previousMillis = currentMillis
          subscriber.next(x)
        }
      },
      complete() {
        subscriber.complete()
        subscription.unsubscribe()
      },
      error(e) {
        subscriber.error(e)
      },
    })

    return () => {
      subscription.unsubscribe()
    }
  })
}

export const auditTime = <T>(source: Observable<T>, millis: number) => {
  return new Observable<T>((subscriber) => {
    let previousMillis = 0
    let currentMillis: undefined | number
    let lastEmission: undefined | T
    const subscription = source.subscribe({
      next(x) {
        currentMillis = Date.now()
        lastEmission = x
        if (currentMillis - previousMillis > millis) {
          previousMillis = Date.now()
          setTimeout(() => {
            subscriber.next(lastEmission!)
          }, millis)
        }
      },
      complete() {
        subscriber.complete()
        subscription.unsubscribe()
      },
      error(e) {
        subscriber.error(e)
      },
    })

    return () => {
      subscription.unsubscribe()
    }
  })
}

export const filter = <T>(
  source: Observable<T>,
  predicate: (x: T) => boolean
) => {
  return new Observable<T>((subscriber) => {
    const subscription = source.subscribe({
      next(x) {
        if (predicate(x)) subscriber.next(x)
      },
      complete() {
        subscriber.complete()
        subscription.unsubscribe()
      },
      error(e) {
        subscriber.error(e)
      },
    })

    return () => {
      subscription.unsubscribe()
    }
  })
}

export const of = <T>(xs: T[]) => {
  return new Observable<T>((subscriber) => {
    xs.forEach((x) => subscriber.next(x))
    subscriber.complete()
  })
}

export const distinctUntilChanged = <T, V>(
  source: Observable<T>,
  comparator: (x: T) => V = (x) => x as any as V
) => {
  let previous: undefined | V
  return new Observable<T>((subscriber) => {
    const subscription = source.subscribe({
      next(x) {
        if (!Object.is(previous, comparator(x))) {
          subscriber.next(x)
          previous = comparator(x)
        }
      },
      complete() {
        subscriber.complete()
        subscription.unsubscribe()
      },
      error(e) {
        subscriber.error(e)
      },
    })

    return () => {
      subscription.unsubscribe()
    }
  })
}

export const distinct = <T, V>(
  source: Observable<T>,
  comparator: (x: T) => V = (x) => x as any as V
) => {
  let previousValues: V[] = []
  return new Observable<T>((subscriber) => {
    const subscription = source.subscribe({
      next(x) {
        if (previousValues.find((y) => Object.is(y, comparator(x)))) {
          subscriber.next(x)
          previousValues.push(comparator(x))
        }
      },
      complete() {
        subscriber.complete()
        subscription.unsubscribe()
      },
      error(e) {
        subscriber.error(e)
      },
    })

    return () => {
      subscription.unsubscribe()
    }
  })
}

export const interval = (millis: number) => {
  return new Observable<void>((subscriber) => {
    const intervalId = setInterval(() => {
      subscriber.next()
    }, millis)

    return () => {
      clearInterval(intervalId)
    }
  })
}

export const timeout = (millis: number) => {
  return new Observable<void>((subscriber) => {
    const timeoutId = setTimeout(() => {
      subscriber.next()
      subscriber.complete()
    }, millis)

    return () => {
      clearTimeout(timeoutId)
    }
  })
}

export const concatWith = <T, V>(
  source: Observable<T>,
  observables: Observable<V>[]
) => {
  return new Observable<T | V>((subscriber) => {
    let currentSubscription: undefined | Subscription
    const sourceSubscription = source.subscribe({
      next(x) {
        subscriber.next(x)
      },
      complete() {
        observables
          .map(
            (x, i) => () =>
              new Promise<void>((resolve) => {
                currentSubscription = x.subscribe({
                  next(y) {
                    subscriber.next(y)
                  },
                  complete() {
                    if (observables.length == i + 1) subscriber.complete()
                    currentSubscription!.unsubscribe()
                    resolve()
                  },
                  error(e) {
                    subscriber.error(e)
                  },
                })
              })
          )
          .reduce((a, b) => a.then(b), Promise.resolve())
      },
      error(e) {
        subscriber.error(e)
      },
    })

    return () => {
      currentSubscription?.unsubscribe()
      sourceSubscription.unsubscribe()
    }
  })
}

export const debounceTime = <T>(source: Observable<T>, millis: number) => {
  return new Observable<T>((subscriber) => {
    let currentTimeoutId: null | number
    const subscription = source.subscribe({
      next(x) {
        if (currentTimeoutId) {
          clearTimeout(currentTimeoutId)
          currentTimeoutId = null
        }
        currentTimeoutId = setTimeout(() => {
          subscriber.next(x)
        }, millis)
      },
      complete() {
        subscriber.complete()
      },
      error(e) {
        subscriber.error(e)
      },
    })

    return () => {
      subscription.unsubscribe()
    }
  })
}

export const startWith = <T, V>(source: Observable<T>, value: V) => {
  return new Observable<V | T>((subscriber) => {
    subscriber.next(value)
    const subscription = source.subscribe({
      next(x) {
        subscriber.next(x)
      },
      complete() {
        subscriber.complete()
      },
      error(e) {
        subscriber.error(e)
      },
    })

    return () => {
      subscription.unsubscribe()
    }
  })
}

export const scan = <T, V>(
  source: Observable<T>,
  reducer: (a: V, b: T) => V,
  init: V
) => {
  return new Observable<V>((subscriber) => {
    const subscription = source.subscribe({
      next(x) {
        subscriber.next(reducer(init, x))
      },
      complete() {
        subscriber.complete()
      },
      error(e) {
        subscriber.error(e)
      },
    })

    return () => {
      subscription.unsubscribe()
    }
  })
}
