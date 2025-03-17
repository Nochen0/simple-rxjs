import { Operator, SubscriberCallbacks } from "./types"

export default class Subscriber {
  private isComplete: boolean
  private callbacks: SubscriberCallbacks
  private operators: Operator<unknown>[]
  constructor(callbacks: SubscriberCallbacks, operators: Operator<unknown>[]) {
    this.isComplete = false
    this.callbacks = callbacks
    this.operators = operators
  }

  error(e: unknown) {
    if (!this.isComplete && this.callbacks.error) {
      this.callbacks.error(e)
    }
  }

  next(value: unknown) {
    if (this.isComplete) return

    let operatorCheck = true
    for (let operator of this.operators) {
      const { pass, newValue } = operator(value)
      if (!pass) {
        operatorCheck = false
        break
      }
      if (newValue) value = newValue as any
    }
    if (operatorCheck) this.callbacks.next(value)
  }

  complete() {
    this.isComplete = true
    if (this.callbacks.complete) this.callbacks.complete()
  }
}
