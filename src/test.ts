// import { limit, map } from "./Operators"
import { fromEvent } from "./Wrappers"

const eventObservable = fromEvent<MouseEvent, HTMLElement>(
  document.body,
  "click"
)
  .limit(5)
  .map((x) => x.clientY)

// const eventObservable = fromEvent<MouseEvent, HTMLElement>(
//   document.body,
//   "click"
// ).pipe([limit(5), map<MouseEvent, number>((event) => event.clientY)])

eventObservable.subscribe({
  next(x) {
    console.log(x)
  },
  complete() {
    console.log("done")
  },
})
