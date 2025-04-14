import { Callbacks } from "./types.js"

export default class Subscriber<T> {
  private completed: boolean
  private callbacks: Callbacks<T>
  constructor(callbacks: Callbacks<T>) {
    this.callbacks = callbacks
    this.completed = false
  }

  public next(x: T) {
    if (!this.completed) this.callbacks.next(x)
  }

  public complete(silent = false) {
    if (!this.completed) {
      this.completed = true
      if (!silent && this.callbacks.complete) {
        this.callbacks.complete()
      }
    }
  }

  public error(e: Error) {
    if (!this.completed && this.callbacks.error) {
      this.callbacks.error(e)
    }
  }
}
