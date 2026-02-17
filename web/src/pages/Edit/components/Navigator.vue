<template>
  <div
    v-if="showMiniMap"
    class="navigatorBox"
    :class="{ isDark: isDark }"
    ref="navigatorBoxRef"
    :style="{ width: width + 'px' }"
    @mousedown="onMousedown"
    @mousemove="onMousemove"
  >
    <div
      class="svgBox"
      ref="svgBoxRef"
      :style="{
        transform: `scale(${svgBoxScale})`,
        left: svgBoxLeft + 'px',
        top: svgBoxTop + 'px'
      }"
    >
      <img :src="mindMapImg" @mousedown.prevent />
    </div>
    <div
      class="windowBox"
      :style="viewBoxStyle"
      :class="{ withTransition: withTransition }"
      @mousedown.stop="onViewBoxMousedown"
      @mousemove="onViewBoxMousemove"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useStore } from '@/store'
import { getBus } from '@/bus'

const props = defineProps<{
  mindMap: {
    miniMap: {
      calculationMiniMap: (w: number, h: number) => {
        getImgUrl: (cb: (img: string) => void) => void
        viewBoxStyle: { left: number; right: number; top: number; bottom: number }
        miniMapBoxScale: number
        miniMapBoxLeft: number
        miniMapBoxTop: number
      }
      onMousedown: (e: MouseEvent) => void
      onMousemove: (e: MouseEvent) => void
      onMouseup: (e: MouseEvent) => void
      onViewBoxMousedown: (e: MouseEvent) => void
      onViewBoxMousemove: (e: MouseEvent) => void
    }
    on: (e: string, fn: (...args: unknown[]) => void) => void
    off: (e: string, fn: (...args: unknown[]) => void) => void
  }
}>()
const store = useStore()
const { isDark } = storeToRefs(store)
const bus = getBus()

const navigatorBoxRef = ref<HTMLElement | null>(null)
const svgBoxRef = ref<HTMLElement | null>(null)
const showMiniMap = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null
const boxWidth = ref(0)
const boxHeight = ref(0)
const svgBoxScale = ref(1)
const svgBoxLeft = ref(0)
const svgBoxTop = ref(0)
const viewBoxStyle = reactive({ left: 0, top: 0, bottom: 0, right: 0 })
const mindMapImg = ref('')
const width = ref(0)
let setSizeTimer: ReturnType<typeof setTimeout> | null = null
const withTransition = ref(true)

function toggle_mini_map(show: boolean) {
  showMiniMap.value = show
  nextTick(() => {
    if (navigatorBoxRef.value) init()
    if (svgBoxRef.value) drawMiniMap()
  })
}

function data_change() {
  if (!showMiniMap.value) return
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    drawMiniMap()
  }, 500)
}

function setSize() {
  if (setSizeTimer) clearTimeout(setSizeTimer)
  setSizeTimer = setTimeout(() => {
    width.value = Math.min(window.innerWidth - 80, 370)
    nextTick(() => {
      if (showMiniMap.value) {
        init()
        drawMiniMap()
      }
    })
  }, 300)
}

function init() {
  if (!navigatorBoxRef.value) return
  const { width: w, height: h } = navigatorBoxRef.value.getBoundingClientRect()
  boxWidth.value = w
  boxHeight.value = h
}

function drawMiniMap() {
  const result = props.mindMap.miniMap.calculationMiniMap(boxWidth.value, boxHeight.value)
  result.getImgUrl((img) => {
    mindMapImg.value = img
  })
  viewBoxStyle.left = result.viewBoxStyle.left
  viewBoxStyle.right = result.viewBoxStyle.right
  viewBoxStyle.top = result.viewBoxStyle.top
  viewBoxStyle.bottom = result.viewBoxStyle.bottom
  svgBoxScale.value = result.miniMapBoxScale
  svgBoxLeft.value = result.miniMapBoxLeft
  svgBoxTop.value = result.miniMapBoxTop
}

function onMousedown(e: MouseEvent) {
  props.mindMap.miniMap.onMousedown(e)
}

function onMousemove(e: MouseEvent) {
  props.mindMap.miniMap.onMousemove(e)
}

function onMouseup(e: MouseEvent) {
  if (!withTransition.value) withTransition.value = true
  if (props.mindMap.miniMap) props.mindMap.miniMap.onMouseup(e)
}

function onViewBoxMousedown(e: MouseEvent) {
  props.mindMap.miniMap.onViewBoxMousedown(e)
}

function onViewBoxMousemove(e: MouseEvent) {
  props.mindMap.miniMap.onViewBoxMousemove(e)
}

function onViewBoxPositionChange({
  left,
  right,
  top,
  bottom
}: {
  left: number
  right: number
  top: number
  bottom: number
}) {
  withTransition.value = false
  viewBoxStyle.left = left
  viewBoxStyle.right = right
  viewBoxStyle.top = top
  viewBoxStyle.bottom = bottom
}

onMounted(() => {
  setSize()
  window.addEventListener('resize', setSize)
  bus.$on('toggle_mini_map', toggle_mini_map)
  bus.$on('data_change', data_change)
  bus.$on('view_data_change', data_change)
  bus.$on('node_tree_render_end', data_change)
  window.addEventListener('mouseup', onMouseup)
  props.mindMap.on('mini_map_view_box_position_change', onViewBoxPositionChange)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', setSize)
  bus.$off('toggle_mini_map', toggle_mini_map)
  bus.$off('data_change', data_change)
  bus.$off('view_data_change', data_change)
  bus.$off('node_tree_render_end', data_change)
  window.removeEventListener('mouseup', onMouseup)
  props.mindMap.off('mini_map_view_box_position_change', onViewBoxPositionChange)
})
</script>

<style lang="less" scoped>
.navigatorBox {
  position: absolute;
  height: 220px;
  background-color: #fff;
  bottom: 80px;
  right: 70px;
  box-shadow: 0 0 16px #989898;
  border-radius: 4px;
  border: 1px solid #eee;
  cursor: pointer;
  user-select: none;

  &.isDark {
    background-color: #262a2e;
  }

  .svgBox {
    position: absolute;
    left: 0;
    transform-origin: left top;
  }

  .windowBox {
    position: absolute;
    border: 2px solid rgb(238, 69, 69);
    background-color: rgba(238, 69, 69, 0.2);

    &.withTransition {
      transition: all 0.3s;
    }
  }
}
</style>
