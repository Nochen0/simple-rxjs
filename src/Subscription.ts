import Subscriber from "./Subscriber.js"
import { Cleanup } from "./types.js"

export default class Subscription {
  private cleanup: Cleanup
  private subscriber: Subscriber<any>
  private unsubscribed: boolean
  constructor(cleanup: Cleanup, subscriber: Subscriber<any>) {
    this.cleanup = cleanup
    this.subscriber = subscriber
    this.unsubscribed = false
  }

  public unsubscribe() {
    if (!this.unsubscribed) {
      this.unsubscribed = true
      this.subscriber.complete(true)
      if (this.cleanup) this.cleanup()
    }
  }
}
