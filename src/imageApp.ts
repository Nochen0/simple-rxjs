import { merge } from "./creators/merge.js"
import { distinctUntilChanged } from "./operators/distinctUntilChanged.js"
import { map } from "./operators/map.js"
import { scan } from "./operators/scan.js"
import { startWith } from "./operators/startWith.js"
import { switchAll } from "./operators/switchAll.js"
import { fromEvent, fromFetch } from "./Wrappers.js"

const previous = document.getElementById("previous")!
const next = document.getElementById("next")!
const select = document.getElementById("select") as HTMLInputElement
const img = document.getElementById("img") as HTMLImageElement

const nextClicks = fromEvent<MouseEvent, HTMLElement>(
  next,
  "click"
).pipe<number>(map(() => 1))
const previousClicks = fromEvent<MouseEvent, HTMLElement>(
  previous,
  "click"
).pipe<number>(map(() => -1))

const selections = fromEvent<InputEvent, HTMLElement>(
  select,
  "change"
).pipe<string>(
  map((x) => x.target.value),
  startWith(select.value),
  map((x) => fromFetch(`/${x}.json`)),
  switchAll(),
  map((x) =>
    merge(previousClicks, nextClicks).pipe<number>(
      startWith(0),
      scan(
        (a, b) =>
          a + b < 0 ? 0 : a + b >= x.length - 1 ? x.length - 1 : a + b,
        0
      ),
      distinctUntilChanged(),
      map((y) => x[y].image)
    )
  ),
  switchAll()
)

selections.subscribe((x) => {
  img.src = x
})
