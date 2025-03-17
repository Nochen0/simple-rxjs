import Subscriber from "./Subscriber"
import Subscription from "./Subscription"
import { OperatorFactory, Producer } from "./types"

export default class Observable {
  private producer: Producer
  private operatorFactories: OperatorFactory<unknown>[]
  constructor(producer: Producer) {
    this.producer = producer
    this.operatorFactories = []
  }

  subscribe(
    next: (x: unknown) => void,
    error?: (e: unknown) => void,
    complete?: () => void
  ): Subscription {
    const subscriber = new Subscriber(
      { next, error, complete },
      this.operatorFactories.map((f) => f())
    )
    const cleanup = this.producer(subscriber) // also executes the observable
    return new Subscription(cleanup)
  }

  pipe(...fs: OperatorFactory<any>[]) {
    this.operatorFactories.push(...fs)
    return this
  }
}
