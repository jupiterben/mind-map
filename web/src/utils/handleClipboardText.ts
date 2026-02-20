import { imgToDataUrl } from 'simple-mind-map/src/utils/index'

interface ZhixiNodeData {
  type?: string
  text?: string
  hyperlink?: string
  hyperlinkTitle?: string
  note?: string
  image?: string
  imageSize?: { width: number; height: number }
  generalization?: Array<{ text: string }>
}

interface ZhixiNode {
  data: ZhixiNodeData
  children?: ZhixiNode[]
}

/** 转换后的新节点（与 ZhixiResult.data 项结构一致，children 递归同类型） */
interface NewNode {
  data: ZhixiNodeData
  children: NewNode[]
}

interface ZhixiResult {
  simpleMindMap: true
  data: NewNode[]
}

const handleZHIXI = async (data: unknown): Promise<ZhixiResult | ''> => {
  try {
    let list: ZhixiNode[] = []
    try {
      if (!Array.isArray(data)) {
        const str = String(data).replace('￿﻿', '')
        list = JSON.parse(str) as ZhixiNode[]
      } else {
        list = data
      }
    } catch {
      // ignore parse error
    }
    if (!Array.isArray(list)) {
      list = []
    }
    const newNodeList: NewNode[] = []
    const waitLoadImageList: Promise<void>[] = []

    const walk = (items: ZhixiNode[], newList: NewNode[]): void => {
      items.forEach(async item => {
        const newRoot: NewNode = {
          data: {},
          children: []
        }
        newList.push(newRoot)
        newRoot.data = {
          text: item.data?.text,
          hyperlink: item.data?.hyperlink,
          hyperlinkTitle: item.data?.hyperlinkTitle,
          note: item.data?.note
        }
        if (item.data?.image) {
          let resolve: () => void
          const promise = new Promise<void>(r => {
            resolve = r
          })
          waitLoadImageList.push(promise)
          try {
            const url = await imgToDataUrl(item.data.image)
            newRoot.data.image = typeof url === 'string' ? url : ''
            newRoot.data.imageSize = item.data?.imageSize
          } catch {
            // ignore
          }
          resolve!()
        }
        newRoot.children = []
        if (item.children && item.children.length > 0) {
          const children: ZhixiNode[] = []
          item.children.forEach(item2 => {
            if (item2.data?.type === 'generalize') {
              newRoot.data.generalization = [{ text: item2.data?.text ?? '' }]
            } else {
              children.push(item2)
            }
          })
          walk(children, newRoot.children)
        }
      })
    }
    walk(list, newNodeList)
    await Promise.all(waitLoadImageList)
    return {
      simpleMindMap: true,
      data: newNodeList
    }
  } catch {
    return ''
  }
}

const handleClipboardText = async (text: string): Promise<ZhixiResult | ''> => {
  try {
    const parsedData = JSON.parse(text) as { __c_zx_v?: unknown; children?: unknown }
    if (parsedData.__c_zx_v !== undefined) {
      return await handleZHIXI(parsedData.children)
    }
  } catch {
    // ignore
  }
  if (text.includes('￿﻿')) {
    return await handleZHIXI(text)
  }
  return ''
}

export default handleClipboardText
