import Subscriber from "./Subscriber"

export type SubscriberCallbacks = {
  next?: (value: unknown) => void
  error?: (e: unknown) => void
  complete?: () => void
}
export type Cleanup = (() => void) | void
export type Producer = (subscriber: Subscriber) => Cleanup | Promise<Cleanup>
export type Effect = (value: unknown) => void
export type EventObjectMap = HTMLElement | Window | Document
export type EventMap<T> = T extends HTMLElement
  ? keyof HTMLElementEventMap
  : T extends Window
  ? keyof WindowEventMap
  : keyof DocumentEventMap
export type Operator<T> = (
  value: T,
  ...args: unknown[]
) => { newValue: unknown; pass: boolean }
export type OperatorFactory<T> = () => Operator<T>
