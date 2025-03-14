import Subscriber from "./Subscriber"
import Subscription from "./Subscription"
import { Effect, OperatorFactory, Producer, SubscriberCallbacks } from "./types"

export default class Observable {
  private producer: Producer
  private operatorFactories: OperatorFactory<unknown>[]
  constructor(producer: Producer) {
    this.producer = producer
    this.operatorFactories = []
  }

  subscribe(fn: Effect | SubscriberCallbacks): Subscription {
    if (fn instanceof Function) {
      fn = {
        next: fn,
      }
    }
    const subscriber = new Subscriber(
      fn,
      this.operatorFactories.map((fn) => fn())
    )
    let cleanup = this.producer(subscriber)
    return new Subscription(cleanup)
  }

  pipe(...fns: OperatorFactory<any>[]) {
    this.operatorFactories = [...this.operatorFactories, ...fns]
    return this
  }
}
