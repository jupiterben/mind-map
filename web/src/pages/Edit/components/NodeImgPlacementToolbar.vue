<template>
  <div
    class="nodeImgPlacementToolbar"
    ref="toolbarRef"
    :style="style"
    @click.stop.passive
    v-show="showImgPlacementToolbar"
  >
    <div
      class="imgPlacementItem iconfont iconcontentleft"
      v-for="item in imgPlacementList"
      :key="item"
      :class="[
        { selected: imgPlacement === item },
        'icon_' + item
      ]"
      @click="updateImgPlacement(item)"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  mindMap: {
    on: (e: string, fn: (...args: unknown[]) => void) => void
    off: (e: string, fn: (...args: unknown[]) => void) => void
  }
}>()

const toolbarRef = ref<HTMLElement | null>(null)
const showImgPlacementToolbar = ref(false)
const style = reactive({ left: '0px', top: '0px' })
const imgPlacementList = ['top', 'bottom', 'left', 'right']
const node = ref<{ getStyle: (k: string) => string; setStyle: (k: string, v: string) => void } | null>(null)
const imgNode = ref<{ rbox: () => { width: number; x: number; y: number } } | null>(null)
const imgPlacement = ref('')

function show(n: { getStyle: (k: string) => string; setStyle: (k: string, v: string) => void }, img: { rbox: () => { width: number; x: number; y: number } }) {
  node.value = n
  imgPlacement.value = n.getStyle('imgPlacement')
  imgNode.value = img
  showImgPlacementToolbar.value = true
  nextTick(() => updatePos())
}

function close() {
  showImgPlacementToolbar.value = false
  node.value = null
  imgPlacement.value = ''
  imgNode.value = null
  style.left = '0px'
  style.top = '0px'
}

function updatePos() {
  if (!imgNode.value || !toolbarRef.value) return
  const { width, height } = toolbarRef.value.getBoundingClientRect()
  const { width: imgWidth, x, y } = imgNode.value.rbox()
  style.left = x + imgWidth / 2 - width / 2 + 'px'
  style.top = y - height - 5 + 'px'
}

function onScale() {
  updatePos()
}

function onNodeActive(n: unknown) {
  if (n === node.value) return
  close()
}

function updateImgPlacement(item: string) {
  imgPlacement.value = item
  node.value?.setStyle('imgPlacement', item)
  close()
}

onMounted(() => {
  props.mindMap.on('node_img_click', show)
  props.mindMap.on('draw_click', close)
  props.mindMap.on('svg_mousedown', close)
  props.mindMap.on('node_dblclick', close)
  props.mindMap.on('node_active', onNodeActive)
  props.mindMap.on('scale', onScale)
  props.mindMap.on('node_img_adjust_btn_mousedown', close)
  props.mindMap.on('delete_node_img_from_delete_btn', close)
  props.mindMap.on('translate', close)
  nextTick(() => {
    if (toolbarRef.value) document.body.append(toolbarRef.value)
  })
})
onBeforeUnmount(() => {
  props.mindMap.off('node_img_click', show)
  props.mindMap.off('draw_click', close)
  props.mindMap.off('svg_mousedown', close)
  props.mindMap.off('node_dblclick', close)
  props.mindMap.off('node_active', onNodeActive)
  props.mindMap.off('scale', onScale)
  props.mindMap.off('node_img_adjust_btn_mousedown', close)
  props.mindMap.off('delete_node_img_from_delete_btn', close)
  props.mindMap.off('translate', close)
})
</script>

<style lang="less" scoped>
.nodeImgPlacementToolbar {
  position: fixed;
  z-index: 2000;
  height: 40px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  padding: 0 10px;

  .imgPlacementItem {
    width: 30px;
    height: 30px;
    margin: 5px;
    cursor: pointer;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;

    &:hover {
      background-color: rgb(237, 237, 237);
    }

    &.icon_top {
      transform: rotateZ(90deg);
    }

    &.icon_bottom {
      transform: rotateZ(-90deg);
    }

    &.icon_right {
      transform: rotateZ(180deg);
    }

    &.selected {
      background-color: rgb(237, 237, 237);
    }
  }
}
</style>
