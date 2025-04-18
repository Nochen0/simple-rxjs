export type Cleanup = (() => void) | void
export type Callbacks<T> = {
  next: (x: T) => void
  complete?: () => void
  error?: (e: unknown) => void
}
export type Entry = {
  observableNumber: number
  values: { value: any; consumed: boolean }[]
  done: boolean
}
