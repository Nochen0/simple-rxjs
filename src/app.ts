import Observable from "./Observable.js"
import { of } from "./Operators.js"
import { fromEvent, fromFetch } from "./Wrappers.js"

const div = document.body.querySelector("div")!
const input = document.body.querySelector("input")!
const ul = document.body.querySelector("ul")!
const FETCH_URL = "https://en.wikipedia.org/w/api.php"

const getRequestURL = (x: string) => {
  return new URL(
    `${FETCH_URL}?${new URLSearchParams([
      ["namespace", "0"],
      ["action", "opensearch"],
      ["origin", "*"],
      ["limit", "5"],
      ["format", "json"],
      ["search", x],
    ])}`
  )
}

const createElement = (tagName: string, textContent: string) => {
  const element = document.createElement(tagName)
  element.textContent = textContent

  return element
}

const mouseDrags = fromEvent<MouseEvent, HTMLElement>(div, "mousedown")
  .take(2)
  .map(() =>
    fromEvent<MouseEvent, HTMLElement>(document.body, "mousemove").takeUntil(
      fromEvent<MouseEvent, HTMLElement>(document.body, "mouseup")
    )
  )
  .mergeAll()

const keydowns = fromEvent<any, HTMLElement>(input, "keydown")
  .auditTime(300)
  .map<string>((x) => x.target.value)
  .map<Observable<string[][] | number>>((x) =>
    x.trim().length ? fromFetch<string[][]>(getRequestURL(x)) : of([-1])
  )
  .switchAll()
  .takeUntil(mouseDrags)

keydowns.subscribe({
  next(x) {
    if (typeof x == "number") {
      ul.replaceChildren()
      return
    }

    Array.from(ul.children)
      .filter((y) => !x[3].find((z) => z == y.textContent))
      .forEach((y) => y.remove())
    x[3]
      .filter((y) => !Array.from(ul.children).find((z) => z.textContent == y))
      .forEach((y) => ul.appendChild(createElement("li", y)))
  },
  complete() {
    console.log("completed")
  },
  error(e) {
    console.log(e)
  },
})

mouseDrags.subscribe({
  next(x) {
    div.style.left = String(`${x.clientX - div.offsetWidth / 2}px`)
    div.style.top = String(`${x.clientY - div.offsetHeight / 2}px`)
  },
  complete() {
    console.log("done")
  },
})
