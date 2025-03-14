"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttleTime = throttleTime;
exports.scan = scan;
exports.concatHello = concatHello;
exports.map = map;
function throttleTime(millis) {
    return () => {
        let lastClick = Date.now() - millis;
        return (newValue) => {
            if (Date.now() - lastClick >= millis) {
                lastClick = Date.now();
                return { pass: true, newValue };
            }
            else {
                return { pass: false, newValue };
            }
        };
    };
}
function scan(fn, initalState) {
    return () => {
        let state = initalState;
        return (...args) => {
            state = fn(state, ...args);
            return { newValue: state, pass: true };
        };
    };
}
function concatHello() {
    return () => {
        return (value) => {
            return { newValue: `${value} hello`, pass: true };
        };
    };
}
function map(fn) {
    return () => {
        return (value) => {
            return { newValue: fn(value), pass: true };
        };
    };
}
