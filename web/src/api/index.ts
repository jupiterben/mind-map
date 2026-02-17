import exampleData from 'simple-mind-map/example/exampleData'
import { simpleDeepClone } from 'simple-mind-map/src/utils/index'
import { getBus } from '@/bus'

interface StoreRef {
  isHandleLocalFile: boolean
}

let storeRef: StoreRef | null = null
export function setStoreRef(s: StoreRef | null): void {
  storeRef = s
}

const SIMPLE_MIND_MAP_DATA = 'SIMPLE_MIND_MAP_DATA'
const SIMPLE_MIND_MAP_CONFIG = 'SIMPLE_MIND_MAP_CONFIG'
const SIMPLE_MIND_MAP_LANG = 'SIMPLE_MIND_MAP_LANG'
const SIMPLE_MIND_MAP_LOCAL_CONFIG = 'SIMPLE_MIND_MAP_LOCAL_CONFIG'

let mindMapData: unknown = null

export const getData = (): unknown => {
  if (window.takeOverApp && window.takeOverAppMethods) {
    mindMapData = window.takeOverAppMethods.getMindMapData?.()
    return mindMapData
  }
  if (storeRef?.isHandleLocalFile && typeof window.getCurrentData === 'function') {
    return window.getCurrentData!()
  }
  const storeData = localStorage.getItem(SIMPLE_MIND_MAP_DATA)
  if (storeData === null) {
    return simpleDeepClone(exampleData)
  }
  try {
    return JSON.parse(storeData)
  } catch {
    return simpleDeepClone(exampleData)
  }
}

export const storeData = (data: Record<string, unknown>): void => {
  try {
    let originData: unknown = null
    if (window.takeOverApp) {
      originData = mindMapData
    } else {
      originData = getData()
    }
    if (!originData) originData = {}
    originData = { ...(originData as Record<string, unknown>), ...data }
    if (window.takeOverApp && window.takeOverAppMethods) {
      mindMapData = originData
      window.takeOverAppMethods.saveMindMapData?.(originData)
      return
    }
    getBus().$emit('write_local_file', originData)
    if (storeRef?.isHandleLocalFile) return
    localStorage.setItem(SIMPLE_MIND_MAP_DATA, JSON.stringify(originData))
  } catch (error) {
    console.log(error)
    const err = error as { code?: string; name?: string } | undefined
    if (err && (err.code === 'exceeded' || err.name === 'QuotaExceededError')) {
      getBus().$emit('localStorageExceeded')
    }
  }
}

export const getConfig = (): unknown => {
  if (window.takeOverApp && window.takeOverAppMethods) {
    return window.takeOverAppMethods.getMindMapConfig?.()
  }
  const config = localStorage.getItem(SIMPLE_MIND_MAP_CONFIG)
  return config ? JSON.parse(config) : null
}

export const storeConfig = (config: unknown): void => {
  try {
    if (window.takeOverApp && window.takeOverAppMethods) {
      window.takeOverAppMethods.saveMindMapConfig?.(config)
      return
    }
    localStorage.setItem(SIMPLE_MIND_MAP_CONFIG, JSON.stringify(config))
  } catch (error) {
    console.log(error)
  }
}

export const storeLang = (lang: string): void => {
  if (window.takeOverApp && window.takeOverAppMethods) {
    window.takeOverAppMethods.saveLanguage?.(lang)
    return
  }
  localStorage.setItem(SIMPLE_MIND_MAP_LANG, lang)
}

export const getLang = (): string => {
  if (window.takeOverApp && window.takeOverAppMethods) {
    return (window.takeOverAppMethods.getLanguage?.() as string) || 'zh'
  }
  const lang = localStorage.getItem(SIMPLE_MIND_MAP_LANG)
  if (lang) return lang
  storeLang('zh')
  return 'zh'
}

export const storeLocalConfig = (config: unknown): void => {
  if (window.takeOverApp && window.takeOverAppMethods) {
    window.takeOverAppMethods.saveLocalConfig?.(config)
    return
  }
  localStorage.setItem(SIMPLE_MIND_MAP_LOCAL_CONFIG, JSON.stringify(config))
}

export const getLocalConfig = (): unknown => {
  if (window.takeOverApp && window.takeOverAppMethods) {
    return window.takeOverAppMethods.getLocalConfig?.()
  }
  const config = localStorage.getItem(SIMPLE_MIND_MAP_LOCAL_CONFIG)
  return config ? JSON.parse(config) : null
}
