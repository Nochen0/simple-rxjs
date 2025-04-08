import Observable from "./Observable"

const observable = new Observable<Observable<number>>((subscriber) => {
  subscriber.next(
    new Observable((subscriber) => {
      setTimeout(() => {
        subscriber.next(1)
        subscriber.complete()
      }, 1100)
    })
  )
  subscriber.next(
    new Observable((subscriber) => {
      let count = 1
      const interval = setInterval(() => {
        subscriber.next(++count)
        if (count == 5) {
          subscriber.complete()
        }
      }, 200)

      return () => {
        clearInterval(interval)
      }
    })
  )
  subscriber.complete()
}).concatAll()

observable.subscribe({
  next(x) {
    console.log(x)
  },
  complete() {
    console.log("completed")
  },
})
