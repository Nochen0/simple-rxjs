import { OperatorFactory } from "./types"

export function throttleTime(millis: number): OperatorFactory<unknown> {
  return () => {
    let lastClick = Date.now() - millis
    return (newValue) => {
      if (Date.now() - lastClick >= millis) {
        lastClick = Date.now()
        return { pass: true, newValue }
      } else {
        return { pass: false, newValue }
      }
    }
  }
}

export function scan<T>(
  fn: (x: T, ...args: any[]) => T,
  initalState: T
): OperatorFactory<unknown> {
  return () => {
    let state = initalState
    return (...args) => {
      state = fn(state, ...args)
      return { newValue: state, pass: true }
    }
  }
}

export function concatHello(): OperatorFactory<unknown> {
  return () => {
    return (value) => {
      return { newValue: `${value} hello`, pass: true }
    }
  }
}

export function map<T>(fn: (x: T) => unknown): OperatorFactory<T> {
  return () => {
    return (value) => {
      return { newValue: fn(value), pass: true }
    }
  }
}
