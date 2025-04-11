import Observable from "./Observable"

const observable = new Observable<Observable<number>>((subscriber) => {
  const intervalId = setInterval(() => {
    const innerObservable = new Observable<number>((subscriber) => {
      let count = 0
      const intervalId = setInterval(() => {
        if (count == 4) {
          subscriber.complete()
          return
        }
        subscriber.next(++count)
      }, 200)

      return () => {
        clearInterval(intervalId)
      }
    })

    subscriber.next(innerObservable)
  }, 500)

  return () => {
    clearInterval(intervalId)
  }
})
  .take(2)
  .concatAll()
  .takeUntil(
    new Observable((subscriber) => {
      setTimeout(() => subscriber.next(5), 1800)
    })
  )
  .map((x) => `Current Number is: ${x}`)

observable.subscribe({
  next(x) {
    console.log(x)
  },
  complete() {
    console.log("done")
  },
})
