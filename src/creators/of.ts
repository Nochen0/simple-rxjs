import Observable from "../Observable.js"

export const of = <T>(xs: T[]) => {
  return new Observable<T>((subscriber) => {
    xs.forEach((x) => subscriber.next(x))
    subscriber.complete()
  })
}
