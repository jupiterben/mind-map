import { storeToRefs } from 'pinia'
import { useStore } from '@/store'

export function useStoreMixin() {
  const store = useStore()
  return {
    ...store,
    ...storeToRefs(store)
  }
}

export const storeMixin = {
  setup() {
    return useStoreMixin()
  }
}
