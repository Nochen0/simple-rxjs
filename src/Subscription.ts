import Subscriber from "./Subscriber.js"
import { Cleanup } from "./types.js"

export default class Subscription {
  private cleanup: Cleanup
  private subscriber: Subscriber<any>
  constructor(cleanup: Cleanup, subscriber: Subscriber<any>) {
    this.cleanup = cleanup
    this.subscriber = subscriber
  }

  public unsubscribe() {
    this.subscriber.complete(true)
    if (this.cleanup) this.cleanup()
  }
}
