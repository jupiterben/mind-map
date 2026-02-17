declare module 'simple-mind-map/example/exampleData' {
  const data: unknown
  export default data
}

declare module 'simple-mind-map/src/utils/index' {
  export const simpleDeepClone: (o: unknown) => unknown
  export function getTextFromHtml(html: string): string
  export function createUid(): string
  export function isUndef(v: unknown): boolean
  export function mergerIconList(list: unknown[]): unknown[]
  export const nodeRichTextToTextWithWrap: (richText: unknown) => string
  export const textToNodeRichTextWithWrap: (text: string) => unknown
  export const htmlEscape: (s: string) => string
  export const handleInputPasteText: (e: unknown) => void
  export function checkNodeOuter(node: unknown, target: unknown): boolean
  export function getStrWithBrFromHtml(html: string): string
}

declare module 'simple-mind-map/src/parse/xmind*' {
  const parse: (file: File) => Promise<unknown>
  export default parse
}

declare module 'simple-mind-map/src/parse/markdown*' {
  const parse: (content: string) => unknown
  export default parse
}

declare module 'simple-mind-map/src/parse/toMarkdown' {
  export function transformToMarkdown(data: unknown): string
}

declare module 'simple-mind-map/src/parse/toTxt' {
  export function transformToTxt(data: unknown): string
}

declare module 'simple-mind-map/src/parse/markdownTo*' {
  const transform: (md: string) => unknown
  export default transform
}

declare module 'simple-mind-map/src/svg/icons' {
  export const nodeIconList: unknown[]
}

declare module 'simple-mind-map/src/plugins/*' {
  const Plugin: unknown
  export default Plugin
}

declare module 'simple-mind-map/src/utils' {
  export const simpleDeepClone: (o: unknown) => unknown
  export function createUid(): string
  export function isUndef(v: unknown): boolean
  export const getTextFromHtml: (html: string) => string
  export const getObjectChangedProps: (a: unknown, b: unknown) => unknown
  export const handleGetSvgDataExtraContent: (...args: unknown[]) => unknown
  export const getNodeTreeBoundingRect: (...args: unknown[]) => unknown
  export const mergeTheme: (...args: unknown[]) => unknown
  export const createUidForAppointNodes: (...args: unknown[]) => unknown
}

declare module 'simple-mind-map/src/plugins/OuterFrame' {
  export const defaultStyle: Record<string, unknown>
}

declare module 'simple-mind-map/package.json' {
  const pkg: { version: string }
  export default pkg
}

export {}
