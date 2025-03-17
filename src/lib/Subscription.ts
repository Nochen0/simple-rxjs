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
  }

  remove(...subscriptions: Subscription[]) {
    this.childSubscriptions = this.childSubscriptions.filter(
      (subs) => !subscriptions.find((s) => subs === s)
    )
  }

  private recursiveUnsubscribe(children: Subscription[]) {
    children
      .map((subscription) => async () => {
        const cleanup = await subscription.cleanup
        if (cleanup) cleanup()
        if (subscription.childSubscriptions.length) {
          this.recursiveUnsubscribe(subscription.childSubscriptions)
        }
      })
      .reduce((a, b) => a.then(() => b()), Promise.resolve())
  }

  async unsubscribe() {
    const cleanup = await this.cleanup
    if (cleanup) cleanup()
    this.recursiveUnsubscribe(this.childSubscriptions)
  }
}
