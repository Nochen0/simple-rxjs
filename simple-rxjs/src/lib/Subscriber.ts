import { Operator, SubscriberCallbacks } from "./types"

export default class Subscriber {
  private isComplete = false
  private callbacks: SubscriberCallbacks
  private operators: Operator<unknown>[]
  constructor(callbacks: SubscriberCallbacks, operators: Operator<unknown>[]) {
    this.callbacks = callbacks
    this.operators = operators
  }

  error(e: unknown) {
    if (!this.isComplete && this.callbacks.error) {
      this.callbacks.error(e)
    }
  }

  next(value: unknown) {
    let operatorCheck = true
    for (let i = 0; i < this.operators.length; i++) {
      const { pass, newValue } = this.operators[i](value)
      if (!pass) {
        operatorCheck = false
        break
      }
      if (newValue) value = newValue as any
    }
    if (!this.isComplete && operatorCheck && this.callbacks.next) {
      this.callbacks.next(value)
    }
  }

  complete() {
    this.isComplete = true
    if (this.callbacks.complete) {
      this.callbacks.complete()
    }
  }
}
