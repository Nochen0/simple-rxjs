import Observable from "./lib/Observable"
import { throttleTime } from "./lib/Operators"

const observable = new Observable((subscriber) => {
  const interval = setInterval(async () => {
    const req = await fetch("https://pokeapi.co/api/v2/pokemon-species/eevee")
    const resp = await req.json()
    subscriber.next(resp)
  }, 100)

  return () => {
    clearInterval(interval)
  }
}).pipe(throttleTime(1000))

const s1 = observable.subscribe((x: any) => console.log(x.color.name))
const s2 = observable.subscribe((x: any) => console.log(x.habitat.name))

setTimeout(() => s1.unsubscribe(), 5000)
setTimeout(() => s2.unsubscribe(), 10000)
