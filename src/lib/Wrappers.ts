import Observable from "./Observable"
import Subscriber from "./Subscriber"
import { EventMap, EventObjectMap } from "./types"

export function fromEvent<T extends EventObjectMap>(
  object: T,
  eventType: EventMap<T>
): Observable {
  return new Observable((subscriber) => {
    const listener = ((subscriber: Subscriber, event: Event) => {
      subscriber.next(event)
    }).bind(null, subscriber)

    object.addEventListener(eventType, listener)

    return () => {
      object.removeEventListener(eventType, listener)
    }
  })
}
