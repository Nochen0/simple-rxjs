import { fromEvent } from "./Wrappers"

const eventObservable = fromEvent<MouseEvent, HTMLElement>(
  document.body,
  "click"
)
  .limit(5)
  .map((x) => x.clientY)

eventObservable.subscribe({
  next(x) {
    console.log(x)
  },
  complete() {
    console.log("done")
  },
})
