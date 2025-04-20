import Observable from "../Observable.js"

export const timeout = (millis: number) => {
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
