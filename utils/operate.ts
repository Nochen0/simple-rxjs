import Observable from "../src/Observable"
import Subscriber from "../src/Subscriber"
import Subscription from "../src/Subscription"

export function operate<T, V = T>(
  source: Observable<T>,
  subscriber: Subscriber<V>,
  next?: (x: T) => void,
  complete?: () => void,
  error?: (e: unknown) => void
) {
  let subscription: undefined | Subscription
  subscription = source.subscribe({
    next: next
      ? next
      : (x) => {
          subscriber.next(x as any as V)
        },
    complete: complete
      ? () => {
          complete()
          subscription?.unsubscribe()
        }
      : () => {
          subscriber.complete()
          subscription?.unsubscribe()
        },
    error: error
      ? (e) => {
          error(e)
          subscription?.unsubscribe()
        }
      : (e) => {
          subscriber.error(e)
          subscription?.unsubscribe()
        },
  })

  return subscription
}
