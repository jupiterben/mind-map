<template>
  <div class="scrollbarContainer" :class="{ isDark: isDark }">
    <div
      class="scrollbar verticalScrollbar"
      ref="verticalScrollbarRef"
      @click="onVerticalScrollbarClick"
    >
      <div
        class="scrollbarInner"
        :style="verticalScrollbarStyle"
        @click.stop
        @mousedown="onVerticalScrollbarMousedown"
      ></div>
    </div>
    <div
      class="scrollbar horizontalScrollbar"
      ref="horizontalScrollbarRef"
      @click="onHorizontalScrollbarClick"
    >
      <div
        class="scrollbarInner"
        :style="horizontalScrollbarStyle"
        @click.stop
        @mousedown="onHorizontalScrollbarMousedown"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useStore } from '@/store'
import { getBus } from '@/bus'

const props = defineProps<{
  mindMap: {
    scrollbar: {
      setScrollBarWrapSize: (w: number, h: number) => void
      onMousedown: (e: MouseEvent, dir: string) => void
      onClick: (e: MouseEvent, dir: string) => void
    }
  }
}>()
const store = useStore()
const { isDark } = storeToRefs(store)
const bus = getBus()

const verticalScrollbarRef = ref<HTMLElement | null>(null)
const horizontalScrollbarRef = ref<HTMLElement | null>(null)
const verticalScrollbarStyle = reactive<Record<string, string>>({})
const horizontalScrollbarStyle = reactive<Record<string, string>>({})
let resizeTimer: ReturnType<typeof setTimeout> | null = null

function setScrollBarWrapSize() {
  if (!props.mindMap.scrollbar) return
  if (horizontalScrollbarRef.value && verticalScrollbarRef.value) {
    const { width } = horizontalScrollbarRef.value.getBoundingClientRect()
    const { height } = verticalScrollbarRef.value.getBoundingClientRect()
    props.mindMap.scrollbar.setScrollBarWrapSize(width, height)
  }
}

function onResize() {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    setScrollBarWrapSize()
  }, 300)
}

function updateScrollbar({
  vertical,
  horizontal
}: {
  vertical: { top: number; height: number }
  horizontal: { left: number; width: number }
}) {
  verticalScrollbarStyle.top = vertical.top + '%'
  verticalScrollbarStyle.height = vertical.height + '%'
  horizontalScrollbarStyle.left = horizontal.left + '%'
  horizontalScrollbarStyle.width = horizontal.width + '%'
}

function onVerticalScrollbarMousedown(e: MouseEvent) {
  props.mindMap.scrollbar.onMousedown(e, 'vertical')
}

function onVerticalScrollbarClick(e: MouseEvent) {
  props.mindMap.scrollbar.onClick(e, 'vertical')
}

function onHorizontalScrollbarMousedown(e: MouseEvent) {
  props.mindMap.scrollbar.onMousedown(e, 'horizontal')
}

function onHorizontalScrollbarClick(e: MouseEvent) {
  props.mindMap.scrollbar.onClick(e, 'horizontal')
}

onMounted(() => {
  setScrollBarWrapSize()
  bus.$on('scrollbar_change', updateScrollbar)
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  bus.$off('scrollbar_change', updateScrollbar)
  window.removeEventListener('resize', onResize)
})
</script>

<style lang="less" scoped>
.scrollbarContainer {
  &.isDark {
    .scrollbar {
      background-color: #363b3f;

      .scrollbarInner {
        background-color: rgba(0, 0, 0, 0.3);
      }
    }
  }

  .scrollbar {
    position: absolute;
    background-color: #f5f5f5;
    border-radius: 10px;
    overflow: hidden;

    &.verticalScrollbar {
      width: 10px;
      top: 100px;
      bottom: 100px;
      left: 20px;

      .scrollbarInner {
        width: 10px;
        left: 0;
      }
    }

    &.horizontalScrollbar {
      height: 10px;
      left: 100px;
      right: 100px;
      bottom: 70px;

      .scrollbarInner {
        height: 10px;
        top: 0;
      }
    }

    .scrollbarInner {
      position: absolute;
      background-color: #ccc;
      border-radius: 10px;
    }
  }
}
</style>
