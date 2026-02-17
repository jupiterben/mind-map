/// <reference types="vite/client" />

declare module 'simple-mind-map-plugin-themes' {
  const Themes: {
    darkList: unknown[]
    lightList: unknown[]
    init(MindMap: unknown): void
    remove(MindMap: unknown): void
  }
  export default Themes
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

interface Window {
  takeOverApp?: boolean
  initApp?: () => void
  $bus?: { $on: (e: string, fn: (...args: unknown[]) => void) => void; $off: (e: string, fn: (...args: unknown[]) => void) => void; $emit: (e: string, ...args: unknown[]) => void }
  getCurrentData?: () => unknown
  takeOverAppMethods?: Record<string, (...args: unknown[]) => unknown>
}
