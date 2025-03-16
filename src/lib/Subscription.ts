import { Cleanup } from "./types"

type Either = Cleanup | Promise<Cleanup>

export default class Subscription {
  private cleanup: Either
  private childSubscriptions: Subscription[]
  constructor(cleanup: Either) {
    this.cleanup = cleanup
    this.childSubscriptions = []
  }
  add(...subscriptions: Subscription[]) {
    this.childSubscriptions.push(...subscriptions)
    return this
  }

  remove(...subscriptions: Subscription[]) {
    this.childSubscriptions = this.childSubscriptions.filter(
      (subs) => !subscriptions.find((s) => subs === s)
    )
    return this
  }

  private recursiveUnsubscribe(children: Subscription[]) {
    children
      .map((subscription) => async () => {
        if (this.cleanup) (await subscription.cleanup)!()
        if (subscription.childSubscriptions.length) {
          this.recursiveUnsubscribe(subscription.childSubscriptions)
        }
      })
      .reduce((a, b) => a.then(() => b()), Promise.resolve())
  }

  unsubscribe() {
    if (this.cleanup instanceof Function) {
      this.cleanup()
    }
    this.recursiveUnsubscribe(this.childSubscriptions)
  }
}
