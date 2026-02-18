declare module 'simple-mind-map' {
  interface MindMapInstance {
    destroy(): void
    [key: string]: unknown
  }
  interface MindMapConstructor {
    new (opt?: Record<string, unknown>): MindMapInstance
    usePlugin(plugin: unknown, opt?: Record<string, unknown>): MindMapConstructor
    hasPlugin(plugin: unknown): number
    pluginList: unknown[]
    instanceCount: number
    extendNodeDataNoStylePropList(list?: string[]): void
    resetNodeDataNoStylePropList(): void
    defineTheme(name: string, config?: Record<string, unknown>): void
    removeTheme(name: string): void
  }
  const MindMap: MindMapConstructor
  export default MindMap
}
