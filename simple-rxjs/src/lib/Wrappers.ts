import Observable from "./Observable"
import Subscriber from "./Subscriber"
import { EventMap, EventObjectMap } from "./types"

export function fromEvent(
  object: EventObjectMap,
  eventType: EventMap<EventObjectMap>
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
