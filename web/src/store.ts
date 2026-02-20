import { defineStore } from 'pinia'
import { storeLocalConfig } from '@/api'

export interface LocalConfig {
  isZenMode: boolean
  openNodeRichText: boolean
  useLeftKeySelectionRightKeyDrag: boolean
  isShowScrollbar: boolean
  isDark: boolean
  enableAi: boolean
  enableDragImport?: boolean
}

export type AiProvider = 'volcano_ark' | 'deepseek' | 'minimax'

export interface AiConfig {
  provider: AiProvider
  /** 各 provider 各自的 API Key */
  keys?: Partial<Record<AiProvider, string>>
  /** @deprecated 兼容旧配置，新数据请使用 keys */
  key?: string
  /** 当前 provider 的模型（createAi 使用）；与 models 同步 */
  model: string
  /** 各 provider 各自选择的模型 */
  models?: Partial<Record<AiProvider, string>>
  port: number
  method: string
}

let storeInstance: ReturnType<typeof useStore> | null = null

export const useStore = defineStore('main', {
  state: () => ({
    isHandleLocalFile: false,
    localConfig: {
      isZenMode: false,
      openNodeRichText: true,
      useLeftKeySelectionRightKeyDrag: false,
      isShowScrollbar: false,
      isDark: false,
      enableAi: true
    } as LocalConfig,
    activeSidebar: '',
    isOutlineEdit: false,
    isReadonly: false,
    isSourceCodeEdit: false,
    extraTextOnExport: '',
    isDragOutlineTreeNode: false,
    aiConfig: {
      provider: 'volcano_ark' as AiProvider,
      keys: {} as Partial<Record<AiProvider, string>>,
      model: '',
      models: {} as Partial<Record<AiProvider, string>>,
      port: 3456,
      method: 'POST'
    } as AiConfig,
    extendThemeGroupList: [] as unknown[],
    bgList: [] as unknown[]
  }),
  actions: {
    setIsHandleLocalFile(data: boolean) {
      this.isHandleLocalFile = data
    },
    setLocalConfig(data: Partial<LocalConfig & AiConfig>) {
      const aiConfigKeys = Object.keys(this.aiConfig)
      Object.keys(data).forEach((key) => {
        if (aiConfigKeys.includes(key)) {
          ;(this.aiConfig as Record<string, unknown>)[key] = (data as Record<string, unknown>)[key]
        } else {
          ;(this.localConfig as Record<string, unknown>)[key] = (data as Record<string, unknown>)[key]
        }
      })
      storeLocalConfig({
        ...this.localConfig,
        ...this.aiConfig
      })
    },
    setActiveSidebar(data: string | null) {
      this.activeSidebar = data ?? ''
    },
    setIsOutlineEdit(data: boolean) {
      this.isOutlineEdit = data
    },
    setIsReadonly(data: boolean) {
      this.isReadonly = data
    },
    setIsSourceCodeEdit(data: boolean) {
      this.isSourceCodeEdit = data
    },
    setExtraTextOnExport(data: string) {
      this.extraTextOnExport = data
    },
    setIsDragOutlineTreeNode(data: boolean) {
      this.isDragOutlineTreeNode = data
    },
    setExtendThemeGroupList(data: unknown[]) {
      this.extendThemeGroupList = data
    },
    setBgList(data: unknown[]) {
      this.bgList = data
    }
  },
  getters: {
    isZenMode: (s) => s.localConfig.isZenMode,
    openNodeRichText: (s) => s.localConfig.openNodeRichText,
    isShowScrollbar: (s) => s.localConfig.isShowScrollbar,
    enableDragImport: (s) => s.localConfig.enableDragImport,
    useLeftKeySelectionRightKeyDrag: (s) => s.localConfig.useLeftKeySelectionRightKeyDrag,
    enableAi: (s) => s.localConfig.enableAi,
    isDark: (s) => s.localConfig.isDark
  }
})

export function setStoreInstance(s: ReturnType<typeof useStore>): void {
  storeInstance = s
}

export function getStore(): ReturnType<typeof useStore> | null {
  return storeInstance
}
