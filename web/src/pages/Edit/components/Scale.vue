<template>
  <div class="scaleContainer" :class="{ isDark: isDark }">
    <el-tooltip
      class="item"
      effect="dark"
      :content="t('scale.zoomOut')"
      placement="top"
    >
      <div class="btn el-icon-minus" @click="narrow"></div>
    </el-tooltip>
    <div class="scaleInfo">
      <input
        ref="inputRef"
        type="text"
        v-model="scaleNum"
        @input="onScaleNumInput"
        @change="onScaleNumChange"
        @focus="onScaleNumInputFocus"
        @keydown.stop
        @keyup.stop
      />%
    </div>
    <el-tooltip
      class="item"
      effect="dark"
      :content="t('scale.zoomIn')"
      placement="top"
    >
      <div class="btn el-icon-plus" @click="enlarge"></div>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

interface MindMapProp {
  view: { scale: number; narrow: () => void; enlarge: () => void; setScale: (s: number, x: number, y: number) => void }
  on: (e: string, fn: (...args: unknown[]) => void) => void
  off: (e: string, fn: (...args: unknown[]) => void) => void
  width: number
  height: number
}
const props = defineProps<{
  mindMap: MindMapProp
  isDark?: boolean
}>()
const { t } = useI18n()

const inputRef = ref<HTMLInputElement | null>(null)
const scaleNum = ref('100')
const cacheScaleNum = ref('100')

function toPer(scale: number) {
  return (scale * 100).toFixed(0)
}

function narrow() {
  props.mindMap.view.narrow()
}

function enlarge() {
  props.mindMap.view.enlarge()
}

function onScaleNumInputFocus() {
  cacheScaleNum.value = scaleNum.value
}

function onScaleNumInput() {
  scaleNum.value = scaleNum.value.replace(/[^0-9]+/g, '')
}

function onScaleNumChange() {
  const num = Number(scaleNum.value)
  if (Number.isNaN(num) || num <= 0) {
    scaleNum.value = cacheScaleNum.value
  } else {
    const cx = props.mindMap.width / 2
    const cy = props.mindMap.height / 2
    props.mindMap.view.setScale(num / 100, cx, cy)
  }
}

function onScale(scale: number) {
  scaleNum.value = toPer(scale)
}

function onDrawClick() {
  nextTick(() => {
    if (inputRef.value) inputRef.value.blur()
  })
}

watch(
  () => props.mindMap,
  (val, oldVal) => {
    if (val && !oldVal) {
      val.on('scale', onScale)
      val.on('draw_click', onDrawClick)
      scaleNum.value = toPer(val.view.scale)
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  if (props.mindMap) {
    props.mindMap.off('scale', onScale)
    props.mindMap.off('draw_click', onDrawClick)
  }
})
</script>

<style lang="less" scoped>
.scaleContainer {
  display: flex;
  align-items: center;

  &.isDark {
    .btn {
      color: hsla(0, 0%, 100%, 0.6);
    }

    .scaleInfo {
      color: hsla(0, 0%, 100%, 0.6);

      input {
        color: hsla(0, 0%, 100%, 0.6);
      }
    }
  }

  .btn {
    cursor: pointer;
  }

  .scaleInfo {
    margin: 0 20px;
    display: flex;
    align-items: center;

    input {
      width: 35px;
      text-align: center;
      background-color: transparent;
      border: none;
      outline: none;
    }
  }
}
</style>
