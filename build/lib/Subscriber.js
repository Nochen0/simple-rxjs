"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Subscriber {
    constructor(callbacks, operators) {
        this.isComplete = false;
        this.callbacks = callbacks;
        this.operators = operators;
    }
    error(e) {
        if (!this.isComplete && this.callbacks.error) {
            this.callbacks.error(e);
        }
    }
    next(value) {
        let operatorCheck = true;
        for (let i = 0; i < this.operators.length; i++) {
            const { pass, newValue } = this.operators[i](value);
            if (!pass) {
                operatorCheck = false;
                break;
            }
            if (newValue)
                value = newValue;
        }
        if (!this.isComplete && operatorCheck && this.callbacks.next) {
            this.callbacks.next(value);
        }
    }
    complete() {
        this.isComplete = true;
        if (this.callbacks.complete) {
            this.callbacks.complete();
        }
    }
}
exports.default = Subscriber;
