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
          outerCompleted = true
        },
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }

  public limit(this: Observable<T>, limitBy: number) {
    return new Observable<T>((subscriber) => {
      let count = 0
      const subscription = this.subscribe({
        next(x) {
          if (count == limitBy) {
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
}
