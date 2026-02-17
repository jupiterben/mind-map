import mitt from 'mitt'

type Bus = {
  $on: (e: string, fn: (...args: unknown[]) => void) => void
  $off: (e: string, fn: (...args: unknown[]) => void) => void
  $emit: (e: string, ...args: unknown[]) => void
}

const m = mitt()
// event -> (originalFn -> wrappedFn)，用于 $off 时用同一引用解绑
const wrappedByEvent = new Map<string, Map<(...args: unknown[]) => void, (payload: unknown) => void>>()
export const bus: Bus = {
  $on: (e: string, fn: (...args: unknown[]) => void) => {
    let byFn = wrappedByEvent.get(e)
    if (!byFn) {
      byFn = new Map()
      wrappedByEvent.set(e, byFn)
    }
    const wrapped = (payload: unknown) => {
      if (Array.isArray(payload)) fn(...payload)
      else if (payload !== undefined && payload !== null) fn(payload)
      else fn()
    }
    byFn.set(fn, wrapped)
    m.on(e, wrapped)
  },
  $off: (e: string, fn: (...args: unknown[]) => void) => {
    const wrapped = wrappedByEvent.get(e)?.get(fn)
    if (wrapped) {
      m.off(e, wrapped)
      wrappedByEvent.get(e)?.delete(fn)
    }
  },
  $emit: (e: string, ...args: unknown[]) => m.emit(e, args.length > 0 ? args : undefined)
}

let busInstance: Bus | null = null
export function setBusInstance(b: Bus): void {
  busInstance = b
}
export function getBus(): Bus {
  return busInstance || bus
}
