<template>
  <div class="countContainer" :class="{ isDark: isDark }">
    <div class="item">
      <span class="name">{{ t('count.words') }}</span>
      <span class="value">{{ words }}</span>
    </div>
    <div class="item">
      <span class="name">{{ t('count.nodes') }}</span>
      <span class="value">{{ num }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useStore } from '@/store'
import { getBus } from '@/bus'

const props = defineProps<{
  mindMap?: { getData: () => unknown }
}>()
const { t } = useI18n()
const store = useStore()
const { isDark } = storeToRefs(store)
const bus = getBus()

const textStr = ref('')
const words = ref(0)
const num = ref(0)

const countEl = typeof document !== 'undefined' ? document.createElement('div') : null

function walk(data: { data?: { text?: string }; children?: unknown[] } | null) {
  if (!data) return
  num.value++
  textStr.value += String((data as { data?: { text?: string } }).data?.text) || ''
  const children = (data as { children?: unknown[] }).children
  if (children && children.length > 0) {
    children.forEach((item) => walk(item as { data?: { text?: string }; children?: unknown[] }))
  }
}

function onDataChange(data: unknown) {
  textStr.value = ''
  words.value = 0
  num.value = 0
  walk(data as { data?: { text?: string }; children?: unknown[] })
  if (countEl) {
    countEl.innerHTML = textStr.value
    words.value = countEl.textContent?.length ?? 0
  }
}

onMounted(() => {
  bus.$on('data_change', onDataChange)
  if (props.mindMap) {
    onDataChange(props.mindMap.getData())
  }
})
onBeforeUnmount(() => {
  bus.$off('data_change', onDataChange)
})
</script>

<style lang="less" scoped>
.countContainer {
  padding: 0 12px;
  position: fixed;
  left: 20px;
  bottom: 20px;
  background: hsla(0, 0%, 100%, 0.8);
  border-radius: 2px;
  opacity: 0.8;
  height: 22px;
  line-height: 22px;
  font-size: 12px;
  display: flex;

  &.isDark {
    background: #262a2e;

    .item {
      color: hsla(0, 0%, 100%, 0.6);
    }
  }

  .item {
    color: #555;
    margin-right: 15px;

    &:last-of-type {
      margin-right: 0;
    }

    .name {
      margin-right: 5px;
    }
  }
}

@media screen and (max-width: 900px) {
  .countContainer {
    display: none;
  }
}
</style>
