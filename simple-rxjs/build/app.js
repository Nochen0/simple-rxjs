"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Observable_1 = __importDefault(require("./lib/Observable"));
const Operators_1 = require("./lib/Operators");
const observable = new Observable_1.default((subscriber) => {
    const interval = setInterval(() => subscriber.next("here"), 950);
    return () => {
        clearInterval(interval);
    };
}).pipe((0, Operators_1.throttleTime)(800));
const s1 = observable.subscribe((x) => console.log("1 " + x));
const s2 = observable.subscribe((x) => console.log("2 " + x));
setTimeout(() => s1.unsubscribe(), 5000);
setTimeout(() => s2.unsubscribe(), 10000);
