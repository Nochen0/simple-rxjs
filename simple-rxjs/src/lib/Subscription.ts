import { Cleanup } from "./types"

export default class Subscription {
  private cleanup: Cleanup
  private childSubscriptions: Subscription[]
  constructor(cleanup: Cleanup) {
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
    children.forEach((subscription) => {
      if (this.cleanup) subscription.cleanup!()
      if (subscription.childSubscriptions.length) {
        this.recursiveUnsubscribe(subscription.childSubscriptions)
      }
    })
  }

  unsubscribe() {
    if (this.cleanup instanceof Function) {
      this.cleanup()
    }
    this.recursiveUnsubscribe(this.childSubscriptions)
  }
}
