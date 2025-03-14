import Observable from "./lib/Observable"
import { throttleTime } from "./lib/Operators"

const observable = new Observable((subscriber) => {
  const interval = setInterval(() => subscriber.next("here"), 950)

  return () => {
    clearInterval(interval)
  }
}).pipe(throttleTime(2500))

const s1 = observable.subscribe((x) => console.log("1 " + x))
const s2 = observable.subscribe((x) => console.log("2 " + x))

setTimeout(() => s1.unsubscribe(), 5000)
setTimeout(() => s2.unsubscribe(), 10000)
