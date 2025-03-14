"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Subscription {
    constructor(cleanup) {
        this.cleanup = cleanup;
        this.childSubscriptions = [];
    }
    add(...subscriptions) {
        this.childSubscriptions.push(...subscriptions);
        return this;
    }
    remove(...subscriptions) {
        this.childSubscriptions = this.childSubscriptions.filter((subs) => !subscriptions.find((s) => subs === s));
        return this;
    }
    recursiveUnsubscribe(children) {
        children.forEach((subscription) => {
            if (this.cleanup)
                subscription.cleanup();
            if (subscription.childSubscriptions.length) {
                this.recursiveUnsubscribe(subscription.childSubscriptions);
            }
        });
    }
    unsubscribe() {
        if (this.cleanup instanceof Function) {
            this.cleanup();
        }
        this.recursiveUnsubscribe(this.childSubscriptions);
    }
}
exports.default = Subscription;
