"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Subscriber_1 = __importDefault(require("./Subscriber"));
const Subscription_1 = __importDefault(require("./Subscription"));
class Observable {
    constructor(producer) {
        this.producer = producer;
        this.operatorFactories = [];
    }
    subscribe(fn) {
        if (fn instanceof Function) {
            fn = {
                next: fn,
            };
        }
        const subscriber = new Subscriber_1.default(fn, this.operatorFactories.map((fn) => fn()));
        let cleanup = this.producer(subscriber);
        return new Subscription_1.default(cleanup);
    }
    pipe(...fns) {
        this.operatorFactories = [...this.operatorFactories, ...fns];
        return this;
    }
}
exports.default = Observable;
