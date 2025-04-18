import Observable from "../Observable.js"

export const take = <T>(limitBy: number) => {
  return (source: Observable<T>) => {
    return new Observable<T>((subscriber) => {
      let count = 0
      const subscription = source.subscribe({
        next(x) {
          count++
          if (count <= limitBy) {
            subscriber.next(x)
            if (count == limitBy) {
              subscriber.complete()
              subscription.unsubscribe()
            }
          }
        },
        complete() {
          subscriber.complete()
          subscription.unsubscribe()
        },
        error(e) {
          subscriber.error(e)
          subscription.unsubscribe()
        },
      })

      return () => {
        subscription.unsubscribe()
      }
    })
  }
}
