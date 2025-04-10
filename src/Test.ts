import Observable from "./Observable"

const observable = new Observable<Observable<number>>((subscriber) => {
  let count = 0
  const intervalId = setInterval(() => {
    if (count == 10) {
      subscriber.complete()
      return
    }
    const innerObservable = new Observable<number>((subscriber) => {
      let count = 0
      const intervalId = setInterval(() => {
        if (count == 10) {
          subscriber.complete()
          return
        }
        subscriber.next(++count)
      })

      return () => {
        clearInterval(intervalId)
      }
    })

    subscriber.next(innerObservable)
  }, 1000)

  return () => {
    clearInterval(intervalId)
  }
})
  .concatAll()
  .map((x) => `Current Number is: ${x}`)

observable.subscribe({
  next(x) {
    console.log(x)
  },
  complete() {
    console.log("done")
  },
})
