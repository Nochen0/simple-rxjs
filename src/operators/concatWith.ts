import { concat } from "../creators/concat.js"
import Observable from "../Observable.js"

export const concatWith = <T, V>(...observables: Observable<V>[]) => {
  return (source: Observable<T>) => {
    return concat(source, ...observables)
  }
}
