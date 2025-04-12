import { fromEvent } from "./Wrappers.js"

const div = document.querySelector("div")!
const divWidth = div.clientWidth
const divHeight = div.clientHeight

const mouseDrags = fromEvent<MouseEvent, HTMLElement>(div, "mousedown")
  .take(2)
  .map(() =>
    fromEvent<MouseEvent, HTMLElement>(document.body, "mousemove").takeUntil(
      fromEvent<MouseEvent, HTMLElement>(document.body, "mouseup")
    )
  )
  .mergeAll()

mouseDrags.subscribe({
  next(x) {
    div.style.left = String(`${x.clientX - divWidth / 2}px`)
    div.style.top = String(`${x.clientY - divHeight / 2}px`)
  },
  complete() {
    console.log("completed")
  },
})
