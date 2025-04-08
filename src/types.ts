export type Cleanup = (() => void) | void
export type Callbacks<T> = {
  next: (x: T) => void
  complete: () => void
}
