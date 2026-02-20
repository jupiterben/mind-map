import { ElLoading } from 'element-plus'

interface LoadingInstance {
  close: () => void
}

let loadingInstance: LoadingInstance | null = null

export const showLoading = (): void => {
  loadingInstance = ElLoading.service({
    lock: true
  }) as unknown as LoadingInstance
}

export const hideLoading = (): void => {
  if (loadingInstance) {
    loadingInstance.close()
    loadingInstance = null
  }
}
