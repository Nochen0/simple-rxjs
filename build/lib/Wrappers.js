"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromEvent = fromEvent;
const Observable_1 = __importDefault(require("./Observable"));
function fromEvent(object, eventType) {
    return new Observable_1.default((subscriber) => {
        const listener = ((subscriber, event) => {
            subscriber.next(event);
        }).bind(null, subscriber);
        object.addEventListener(eventType, listener);
        return () => {
            object.removeEventListener(eventType, listener);
        };
    });
}
