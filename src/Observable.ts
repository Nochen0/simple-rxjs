import Subscriber from "./Subscriber.js"
import Subscription from "./Subscription.js"
import { Callbacks, Cleanup, Entry } from "./types.js"

type Producer<T> = (subcriber: Subscriber<T>) => Cleanup
type Operator<T> = (observable: Observable<any>) => Observable<T>

export default class Observable<T> {
  private producer: Producer<T>
  constructor(producer: Producer<T>) {
    this.producer = producer
  }

  public static Empty = new Observable<never>((subscriber) => {
    subscriber.complete()
  })

  public static of = <V>(xs: V[]) => {
    return new Observable<V>((subscriber) => {
      xs.forEach((x) => subscriber.next(x))
      subscriber.complete()
    })
  }

  public static interval = (millis: number) => {
    return new Observable<void>((subscriber) => {
      const intervalId = setInterval(() => {
        subscriber.next()
      }, millis)

      return () => {
        clearInterval(intervalId)
      }
    })
  }

  public static timeout = (millis: number) => {
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

  subscribe(callbacks: Callbacks<T>): Subscription
  subscribe(
    next: (x: T) => void,
    complete?: () => void,
    error?: () => void
  ): Subscription
  public subscribe(
    callbacksOrNext: Callbacks<T> | ((x: T) => void),
    complete?: () => void,
    error?: () => void
  ): Subscription {
    let cbs: Callbacks<T> = {} as any
    if (callbacksOrNext instanceof Function) {
      cbs.next = callbacksOrNext
      cbs.complete = complete
      cbs.error = error
    } else {
      cbs = callbacksOrNext
    }
    const subscriber = new Subscriber(cbs)
    const cleanup = this.producer(subscriber)
    return new Subscription(cleanup, subscriber)
  }

  public pipe<V>(this: Observable<T>, operators: Operator<any>[]) {
    return operators.reduce<Observable<V>>((a, b) => b(a), this)
  }

  public map<V>(f: (x: T) => V) {
    return new Observable<V>((subscriber) => {
      const subscription = this.subscribe({
        next(y) {
          try {
            subscriber.next(f(y))
          } catch (e) {
            subscriber.error(e)
          }
        },
        complete() {
          subscriber.complete()
          subscription.unsubscribe()
        },
        error(e) {
          subscriber.error(e)
          subscription.unsubscribe()
        },
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }

  public concatAll<V>(this: Observable<Observable<V>>) {
    return new Observable<V>((subscriber) => {
      let outerCompleted = false
      let innerSubscriptions: Subscription[] = []
      let entries: Entry[] = []
      const subscription = this.subscribe({
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

  public mergeAll<V>(this: Observable<Observable<V>>) {
    return new Observable<V>((subscriber) => {
      let outerCompleted = false
      let innerSubscriptions: Subscription[] = []
      const subscription = this.subscribe({
        next(x) {
          const innerSubscription = x.subscribe({
            next(y) {
              subscriber.next(y)
            },
            complete() {
              innerSubscription.unsubscribe()
              if (
                outerCompleted &&
                innerSubscriptions.every((x) => x.unsubscribed)
              ) {
                subscriber.complete()
                subscription.unsubscribe()
              }
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

  public switchAll<V>(this: Observable<Observable<V>>) {
    return new Observable<V>((subscriber) => {
      let outerCompleted = false
      let currentSubscription: undefined | Subscription
      const subscription = this.subscribe({
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
              currentSubscription?.unsubscribe()
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
          subscription.unsubscribe()
          currentSubscription?.unsubscribe()
        },
      })

      return () => {
        currentSubscription?.unsubscribe()
        subscription.unsubscribe()
      }
    })
  }

  public take(this: Observable<T>, limitBy: number) {
    return new Observable<T>((subscriber) => {
      let count = 0
      const subscription = this.subscribe({
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
          subscription.unsubscribe()
        },
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }

  public takeUntil(this: Observable<T>, notifier: Observable<unknown>) {
    return new Observable<T>((subscriber) => {
      const notifierSubscription = notifier.subscribe({
        next() {
          subscriber.complete()
          limitedSubscription.unsubscribe()
          notifierSubscription.unsubscribe()
        },
        complete() {},
        error(e) {
          subscriber.error(e)
          notifierSubscription.unsubscribe()
          limitedSubscription.unsubscribe()
        },
      })

      const limitedSubscription = this.subscribe({
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
          limitedSubscription.unsubscribe()
        },
      })

      return () => {
        limitedSubscription.unsubscribe()
        notifierSubscription.unsubscribe()
      }
    })
  }

  public throttleTime(this: Observable<T>, millis: number) {
    return new Observable<T>((subscriber) => {
      let previousMillis = 0
      const subscription = this.subscribe({
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
          subscription.unsubscribe()
        },
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }

  public auditTime(this: Observable<T>, millis: number) {
    return new Observable<T>((subscriber) => {
      let previousMillis = 0
      let currentMillis: undefined | number
      let lastEmission: undefined | T
      const subscription = this.subscribe({
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
          subscription.unsubscribe()
        },
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }

  public filter(this: Observable<T>, predicate: (x: T) => boolean) {
    return new Observable<T>((subscriber) => {
      const subscription = this.subscribe({
        next(x) {
          if (predicate(x)) {
            subscriber.next(x)
          }
        },
        complete() {
          subscriber.complete()
          subscription.unsubscribe()
        },
        error(e) {
          subscriber.error(e)
          subscription.unsubscribe()
        },
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }

  public distinctUntilChanged<V>(
    this: Observable<T>,
    comparator: (x: T) => V = (x) => x as any as V
  ) {
    let previous: undefined | V
    return new Observable<T>((subscriber) => {
      const subscription = this.subscribe({
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
          subscription.unsubscribe()
        },
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }

  public distinct<V>(
    this: Observable<T>,
    comparator: (x: T) => V = (x) => x as any as V
  ) {
    let previousValues: V[] = []
    return new Observable<T>((subscriber) => {
      const subscription = this.subscribe({
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
          subscription.unsubscribe()
        },
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }

  public concatWith<V>(this: Observable<T>, ...observables: Observable<V>[]) {
    return new Observable<T | V>((subscriber) => {
      let currentSubscription: undefined | Subscription
      const sourceSubscription = this.subscribe({
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
                      currentSubscription?.unsubscribe()
                      resolve()
                    },
                    error(e) {
                      subscriber.error(e)
                      currentSubscription?.unsubscribe()
                      resolve()
                    },
                  })
                })
            )
            .reduce((a, b) => a.then(b), Promise.resolve())
        },
        error(e) {
          subscriber.error(e)
          sourceSubscription.unsubscribe()
        },
      })

      return () => {
        currentSubscription?.unsubscribe()
        sourceSubscription.unsubscribe()
      }
    })
  }

  public debounceTime(this: Observable<T>, millis: number) {
    return new Observable<T>((subscriber) => {
      let currentTimeoutId: null | number
      const subscription = this.subscribe({
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
          subscription.unsubscribe()
        },
        error(e) {
          subscriber.error(e)
          subscription.unsubscribe()
        },
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }

  public startWith<V>(this: Observable<T>, value: V) {
    return new Observable<V | T>((subscriber) => {
      subscriber.next(value)
      const subscription = this.subscribe({
        next(x) {
          subscriber.next(x)
        },
        complete() {
          subscriber.complete()
          subscription.unsubscribe()
        },
        error(e) {
          subscriber.error(e)
          subscription.unsubscribe()
        },
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }

  public scan<V>(this: Observable<T>, reducer: (a: V, b: T) => V, init: V) {
    return new Observable((subscriber) => {
      let accumulation = init
      const subscription = this.subscribe({
        next(x) {
          try {
            accumulation = reducer(accumulation, x)
            subscriber.next(accumulation)
          } catch (e) {
            subscriber.error(e)
            subscription.unsubscribe()
          }
        },
        complete() {
          subscriber.complete()
          subscription.unsubscribe()
        },
        error(e) {
          subscriber.error(e)
          subscription.unsubscribe()
        },
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }

  public catchError<V>(
    this: Observable<T>,
    selector: (e: unknown) => Observable<V>
  ) {
    let err: unknown = null
    const caughtSource = new Observable<T>((subscriber) => {
      const subscription = this.subscribe({
        next(x) {
          subscriber.next(x)
        },
        complete() {
          subscriber.complete()
          subscription.unsubscribe()
        },
        error(e) {
          err = e
          subscriber.complete()
          subscription.unsubscribe()
        },
      })

      return () => {
        subscription.unsubscribe()
      }
    })

    return caughtSource.concatWith(selector(err))
  }

  public retry(this: Observable<T>, times: number) {
    return new Observable<T>((subscriber) => {
      let currentSubscription: undefined | Subscription
      let successfull = false
      ;(async () => {
        for (let i = 0; i < times + 1; i++) {
          if (successfull) break
          await new Promise<void>((resolve) => {
            currentSubscription = this.subscribe({
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
