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

  public subscribe(callbacks: Callbacks<T>) {
    const subscriber = new Subscriber(callbacks)
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
          subscriber.next(f(y))
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
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }

  public takeUntil(this: Observable<T>, notifier: Observable<unknown>) {
    return new Observable<T>((subscriber) => {
      const notifierSubscription = notifier.subscribe({
        next(x) {
          subscriber.complete()
          limitedSubscription.unsubscribe()
          notifierSubscription.unsubscribe()
        },
        complete() {},
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
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }
}
