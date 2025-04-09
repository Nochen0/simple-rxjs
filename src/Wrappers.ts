import Observable from "./Observable"

type FromEvent = <T, V extends Window | Document | HTMLElement>(
  target: V,
  eventType: V extends Window
    ? keyof WindowEventMap
    : V extends Document
    ? keyof DocumentEventMap
    : keyof HTMLElementEventMap
) => Observable<T>

export const fromEvent: FromEvent = (target, eventType) => {
  return new Observable((subscriber) => {
    const listener = (event: any) => {
      subscriber.next(event)
    }

    target.addEventListener(eventType, listener)

    return () => {
      target.removeEventListener(eventType, listener)
    }
  })
}
