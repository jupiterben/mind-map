import mitt from 'mitt'

type Bus = {
  $on: (e: string, fn: (...args: unknown[]) => void) => void
  $off: (e: string, fn: (...args: unknown[]) => void) => void
  $emit: (e: string, ...args: unknown[]) => void
}

const m = mitt()
export const bus: Bus = {
  $on: m.on.bind(m) as Bus['$on'],
  $off: m.off.bind(m) as Bus['$off'],
  $emit: (e: string, ...args: unknown[]) => m.emit(e, args.length > 0 ? args : undefined)
}

let busInstance: Bus | null = null
export function setBusInstance(b: Bus): void {
  busInstance = b
}
export function getBus(): Bus {
  return busInstance || bus
}
