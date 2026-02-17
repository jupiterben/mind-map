import { storeToRefs } from 'pinia'
import { useStore } from '@/store'

export function useStoreMixin() {
  const store = useStore()
  return {
    ...storeToRefs(store),
    ...store
  }
}

export const storeMixin = {
  setup() {
    return useStoreMixin()
  }
}
