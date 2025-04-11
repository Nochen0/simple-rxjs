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
      let innerObservableCount = 0
      let completedInnerObservableCount = 0
      let entries: Entry[] = []
      const subscription = this.subscribe({
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

  public mergeAll<V>(this: Observable<Observable<V>>) {
    return new Observable<V>((subscriber) => {
      let outerCompleted = false
      let completedInnerObservableCount = 0
      let innerObservableCount = 0
      const subscription = this.subscribe({
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

  public throttleTime(this: Observable<unknown>, millis: number) {
    let previousMillis = 0
    return new Observable((subscriber) => {
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
        },
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }
}
