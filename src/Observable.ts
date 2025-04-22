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

  public static EmptyError = new Observable<never>((subscriber) => {
    subscriber.error(null)
  })

  subscribe(callbacks: Callbacks<T>): Subscription
  subscribe(
    next: (x: T) => void,
    complete?: () => void,
    error?: (e: unknown) => void
  ): Subscription
  public subscribe(
    callbacksOrNext: Callbacks<T> | ((x: T) => void),
    complete?: () => void,
    error?: (e: unknown) => void
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

  public pipe<V>(this: Observable<T>, ...operators: Operator<any>[]) {
    return operators.reduce<Observable<V>>((a, b) => b(a), this)
  }
}
