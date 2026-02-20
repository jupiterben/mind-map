<template>
  <div
    class="sidebarContainer"
    ref="containerRef"
    @click.stop
    :class="{ show: show, isDark: isDark, positionLeft: position === 'left', draggable: draggable }"
    :style="[baseStyle, dragStyle]"
  >
    <span class="closeBtn el-icon-close" @click="close"></span>
    <div
      class="sidebarHeader"
      v-if="title"
      :class="{ dragHandle: draggable }"
      @mousedown.prevent="draggable ? onDragStart($event) : undefined"
    >
      {{ title }}
    </div>
    <div class="sidebarContent customScrollbar" ref="sidebarContentRef">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useStore } from '@/store'
import { getBus } from '@/bus'
import { store as configStore } from '@/config'

const props = withDefaults(
  defineProps<{
    title?: string
    /** 'left' 左侧滑出，'right' 右侧滑出 */
    position?: 'left' | 'right'
    /** 是否可通过拖动标题栏移动窗口 */
    draggable?: boolean
  }>(),
  { title: '', position: 'right', draggable: false }
)
const store = useStore()
const { isDark } = storeToRefs(store)
const { setActiveSidebar } = store
const bus = getBus()

const containerRef = ref<HTMLElement | null>(null)
const sidebarContentRef = ref<HTMLElement | null>(null)
const show = ref(false)
const zIndex = ref(0)

// 拖动相关：启用 draggable 时用 left/top 定位
const dragLeft = ref<number | null>(null)
const dragTop = ref<number | null>(null)
let dragStartX = 0
let dragStartY = 0
let dragStartLeft = 0
let dragStartTop = 0

const baseStyle = computed(() => ({
  zIndex: zIndex.value,
  transition: props.draggable && dragLeft.value !== null ? 'none' : undefined
}))

const dragStyle = computed(() => {
  if (!props.draggable || dragLeft.value === null || dragTop.value === null) return {}
  return {
    right: 'auto',
    left: `${dragLeft.value}px`,
    top: `${dragTop.value}px`,
    bottom: 'auto',
    height: `calc(100vh - ${dragTop.value}px)`
  }
})

function onDragStart(e: MouseEvent) {
  const el = containerRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  if (dragLeft.value === null || dragTop.value === null) {
    dragLeft.value = rect.left
    dragTop.value = rect.top
  }
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragStartLeft = dragLeft.value
  dragStartTop = dragTop.value
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: MouseEvent) {
  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  let left = dragStartLeft + dx
  let top = dragStartTop + dy
  const W = 300
  const minTop = 0
  const maxTop = window.innerHeight - 200
  left = Math.max(0, Math.min(window.innerWidth - W, left))
  top = Math.max(minTop, Math.min(maxTop, top))
  dragLeft.value = left
  dragTop.value = top
}

function onDragEnd() {
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

watch(show, (val, oldVal) => {
  if (val && !oldVal) {
    zIndex.value = configStore.sidebarZIndex++
    // 非可拖动或首次打开时重置拖动位置，让侧栏回到边缘
    if (!props.draggable) {
      dragLeft.value = null
      dragTop.value = null
    }
  }
  if (!val && props.draggable) {
    dragLeft.value = null
    dragTop.value = null
  }
})

function handleCloseSidebar() {
  close()
}

function close() {
  show.value = false
  setActiveSidebar(null)
}

function getEl() {
  return sidebarContentRef.value
}

function setShow(val: boolean) {
  show.value = val
}

onMounted(() => {
  bus.$on('closeSideBar', handleCloseSidebar)
})
onBeforeUnmount(() => {
  bus.$off('closeSideBar', handleCloseSidebar)
})

defineExpose({ show, getEl, setShow })
</script>

<style lang="less" scoped>
.sidebarContainer {
  position: fixed;
  right: -300px;
  top: 110px;
  bottom: 0;
  width: 300px;
  background-color: #fff;
  border-left: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;

  &.positionLeft {
    right: auto;
    left: -300px;
    border-left: none;
    border-right: 1px solid #e8e8e8;

    &.show {
      left: 0;
    }

    .closeBtn {
      right: auto;
      left: 20px;
    }
  }

  &.isDark {
    background-color: #262a2e;
    border-left-color: hsla(0, 0%, 100%, 0.1);

    &.positionLeft {
      border-right-color: hsla(0, 0%, 100%, 0.1);
    }

    .sidebarHeader {
      border-bottom-color: hsla(0, 0%, 100%, 0.1);
      color: #fff;
    }

    .closeBtn {
      color: #fff;
    }
  }

  &.show:not(.positionLeft) {
    right: 0;
  }

  .closeBtn {
    position: absolute;
    right: 20px;
    top: 12px;
    font-size: 20px;
    cursor: pointer;
  }

  .sidebarHeader {
    width: 100%;
    height: 44px;
    border-bottom: 1px solid #e8e8e8;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-grow: 0;
    flex-shrink: 0;

    &.dragHandle {
      cursor: move;
      user-select: none;
    }
  }

  .sidebarContent {
    width: 100%;
    height: 100%;
    overflow: auto;
  }
}
</style>
