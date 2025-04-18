import Observable from "../Observable.js"

export const interval = (millis: number) => {
  return new Observable<void>((subscriber) => {
    const intervalId = setInterval(() => {
      subscriber.next()
    }, millis)

    return () => {
      clearInterval(intervalId)
    }
  })
}
