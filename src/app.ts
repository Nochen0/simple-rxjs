import { fromEvent } from "./Wrappers.js"

const div = document.querySelector("div")!

const mouseDrags = fromEvent<MouseEvent, HTMLElement>(div, "mousedown")
  .map(() =>
    fromEvent<MouseEvent, HTMLElement>(document.body, "mousemove").takeUntil(
      fromEvent<MouseEvent, HTMLElement>(document.body, "mouseup")
    )
  )
  .concatAll()

mouseDrags.subscribe({
  next(x) {
    div.style.left = String(`${x.clientX - div.clientWidth / 2}px`)
    div.style.top = String(`${x.clientY - div.clientHeight / 2}px`)
  },
  complete() {},
})
