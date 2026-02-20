// 全屏事件检测（兼容旧版各浏览器前缀）
interface DocumentElementWithFullscreen extends HTMLElement {
  requestFullScreen?: () => void
  webkitRequestFullScreen?: () => void
  mozRequestFullScreen?: () => void
  msRequestFullscreen?: () => void
}
const getOnfullscreEnevt = (): string | undefined => {
  const docEl = document.documentElement as DocumentElementWithFullscreen
  if (docEl.requestFullScreen) return 'onfullscreenchange'
  if (docEl.webkitRequestFullScreen) return 'onwebkitfullscreenchange'
  if (docEl.mozRequestFullScreen) return 'onmozfullscreenchange'
  if (docEl.msRequestFullscreen) return 'onmsfullscreenchange'
  return undefined
}

export const fullscrrenEvent = getOnfullscreEnevt()

// 全屏
export const fullScreen = (element: Element & { requestFullScreen?: () => void; webkitRequestFullScreen?: () => void; mozRequestFullScreen?: () => void }): void => {
  if (element.requestFullScreen) {
    element.requestFullScreen()
  } else if (element.webkitRequestFullScreen) {
    element.webkitRequestFullScreen()
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen()
  }
}

// 文件转buffer
export const fileToBuffer = (file: File): Promise<ArrayBuffer | null> => {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer | null)
    }
    reader.readAsArrayBuffer(file)
  })
}

// 复制文本到剪贴板
export const copy = (text: string): void => {
  const input = document.createElement('textarea')
  input.innerHTML = text
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
}

// 复制文本到剪贴板
export const setDataToClipboard = (data: string): void => {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(data)
  }
}

// 复制图片到剪贴板
export const setImgToClipboard = (img: Blob): void => {
  if (navigator.clipboard?.write) {
    const data = [new ClipboardItem({ 'image/png': img })]
    navigator.clipboard.write(data)
  }
}

// 打印大纲
export const printOutline = (el: HTMLElement): void => {
  const printContent = el.outerHTML
  const iframe = document.createElement('iframe')
  iframe.setAttribute('style', 'position: absolute; width: 0; height: 0;')
  document.body.appendChild(iframe)
  const iframeDoc = iframe.contentWindow!.document
  const styleList = document.querySelectorAll('style')
  Array.from(styleList).forEach(styleEl => {
    iframeDoc.write(styleEl.outerHTML)
  })
  iframeDoc.write('<style media="print">@page {size: portrait;}</style>')
  iframeDoc.write('<div>' + printContent + '</div>')
  setTimeout(() => {
    iframe.contentWindow?.print()
    document.body.removeChild(iframe)
  }, 500)
}

export const getParentWithClass = (el: Element, className: string): Element | null => {
  if (el.classList.contains(className)) {
    return el
  }
  if (el.parentNode && el.parentNode !== document.body) {
    return getParentWithClass(el.parentNode as Element, className)
  }
  return null
}
