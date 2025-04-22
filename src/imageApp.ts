import { merge } from "./creators/merge.js"
import { of } from "./creators/of.js"
import Observable from "./Observable.js"
import { catchError } from "./operators/catchError.js"
import { distinctUntilChanged } from "./operators/distinctUntilChanged.js"
import { map } from "./operators/map.js"
import { retry } from "./operators/retry.js"
import { scan } from "./operators/scan.js"
import { startWith } from "./operators/startWith.js"
import { switchAll } from "./operators/switchAll.js"
import { fromEvent, fromFetch } from "./Wrappers.js"

const previous = document.getElementById("previous")!
const next = document.getElementById("next")!
const select = document.getElementById("select") as HTMLInputElement
const img = document.getElementById("img") as HTMLImageElement

function preload(url: string) {
  return new Observable((subscriber) => {
    const onLoad = () => {
      subscriber.next(url)
      subscriber.complete()
    }
    const onError = () => {
      subscriber.error(null)
    }
    const image = new Image()
    image.addEventListener("load", onLoad)
    image.src = url
    image.addEventListener("error", onError)

    return () => {
      image.removeEventListener("load", onLoad)
      image.removeEventListener("error", onError)
      image.remove()
    }
  })
}

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
      map((y) => x[y].image),
      map((y) =>
        preload(y).pipe(
          retry(3),
          catchError(() => of(-1))
        )
      ),
      switchAll()
    )
  ),
  switchAll()
)

selections.subscribe((x) => {
  img.src =
    typeof x == "string"
      ? x
      : "https://upload.wikimedia.org/wikipedia/commons/4/4e/Fail_stamp.jpg"
})
