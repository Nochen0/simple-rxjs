import Observable from "./Observable.js"

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

export const fromFetch = <T>(
  requestInfo: RequestInfo | URL,
  init?: RequestInit
) => {
  return new Observable<T>((subscriber) => {
    const controller = new AbortController()
    const request = new Request(requestInfo, {
      signal: controller.signal,
    })

    fetch(request, init)
      .then((x) => x.json())
      .then((x) => {
        subscriber.next(x)
        subscriber.complete()
      })
      .catch((e) => {
        subscriber.error(e)
      })

    return () => {
      controller.abort()
    }
  })
}
