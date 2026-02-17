<template>
  <div
    class="nodeIconToolbar"
    ref="nodeIconToolbar"
    :style="style"
    @click.stop.passive
    v-show="showNodeIconToolbar"
  >
    <div class="iconListBox">
      <div
        class="icon"
        v-for="icon in iconList"
        :key="icon.name"
        v-html="getHtml(icon.icon)"
        :class="{ selected: nodeIconList.includes(iconType + '_' + icon.name) }"
        @click="setIcon(icon.name)"
      ></div>
    </div>
    <div class="btnBox">
      <span class="btn iconfont iconshanchu" @click="deleteIcon"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { nodeIconList as _nodeIconList } from 'simple-mind-map/src/svg/icons'
import icon from '@/config/icon'
import { useStoreMixin } from '@/mixins/storeMixin'
import { getBus } from '@/bus'

const allIconList = [..._nodeIconList, ...icon]

const props = defineProps<{
  mindMap: any
}>()

const { activeSidebar, setActiveSidebar } = useStoreMixin()
const bus = getBus()

const nodeIconToolbar = ref<HTMLElement | null>(null)
const showNodeIconToolbar = ref(false)
const style = reactive({ left: '0px', top: '0px' })
const node = ref<any>(null)
const iconType = ref('')
const iconName = ref('')
const nodeIconList = ref<string[]>([])
const iconList = ref<any[]>([])

function handleShow(n: any, iconKey: string) {
  node.value = n
  iconType.value = iconKey.split('_')[0]
  iconName.value = iconKey.split('_')[1]
  nodeIconList.value = n.getData('icon') || []
  const found = allIconList.find((item) => item.type === iconType.value)
  iconList.value = found ? [...found.list] : []
  updatePos()
  showNodeIconToolbar.value = true
  if (activeSidebar.value === 'nodeIconSidebar') {
    setActiveSidebar(null)
  }
}

function close() {
  showNodeIconToolbar.value = false
  node.value = null
  iconType.value = ''
  iconName.value = ''
  nodeIconList.value = []
  iconList.value = []
  style.left = '0px'
  style.top = '0px'
}

function updatePos() {
  if (!node.value) return
  const rect = node.value.getRect()
  style.left = rect.x + 'px'
  style.top = rect.y + rect.height + 'px'
}

function onScale() {
  updatePos()
}

function onNodeActive(n: any) {
  if (n === node.value) return
  close()
}

function deleteIcon() {
  setIcon(iconName.value)
  close()
}

function getHtml(iconStr: string) {
  return /^<svg/.test(iconStr) ? iconStr : `<img src="${iconStr}" />`
}

function setIcon(name: string) {
  const key = iconType.value + '_' + name
  const idx = nodeIconList.value.findIndex((item) => item === key)
  if (idx !== -1) {
    nodeIconList.value.splice(idx, 1)
  } else {
    const typeIdx = nodeIconList.value.findIndex((item) => item.split('_')[0] === iconType.value)
    if (typeIdx !== -1) {
      nodeIconList.value.splice(typeIdx, 1, key)
      iconName.value = name
    } else {
      nodeIconList.value.push(key)
    }
  }
  node.value?.setIcon([...nodeIconList.value])
}

onMounted(() => {
  props.mindMap.on('node_icon_click', handleShow)
  props.mindMap.on('draw_click', close)
  props.mindMap.on('svg_mousedown', close)
  props.mindMap.on('node_dblclick', close)
  props.mindMap.on('node_active', onNodeActive)
  props.mindMap.on('scale', onScale)
  bus.$on('close_node_icon_toolbar', close)
  if (nodeIconToolbar.value) document.body.append(nodeIconToolbar.value)
})

onBeforeUnmount(() => {
  props.mindMap.off('node_icon_click', handleShow)
  props.mindMap.off('draw_click', close)
  props.mindMap.off('svg_mousedown', close)
  props.mindMap.off('node_dblclick', close)
  props.mindMap.off('node_active', onNodeActive)
  props.mindMap.off('scale', onScale)
  bus.$off('close_node_icon_toolbar', close)
})
</script>

<style lang="less" scoped>
.nodeIconToolbar {
  position: fixed;
  z-index: 2000;
  width: 210px;
  max-height: 170px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .iconListBox {
    width: 100%;
    height: 180px;
    overflow-y: auto;
    padding: 10px;

    .icon {
      width: 24px;
      height: 24px;
      margin: 5px;
      cursor: pointer;
      position: relative;
      float: left;

      :deep(img) {
        width: 100%;
        height: 100%;
      }

      :deep(svg) {
        width: 100%;
        height: 100%;
      }

      &.selected {
        &::after {
          content: '';
          position: absolute;
          left: -4px;
          top: -4px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid #409eff;
        }
      }
    }
  }

  .btnBox {
    width: 100%;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-top: 1px solid #eee;
    flex-shrink: 0;

    .btn {
      cursor: pointer;
      color: rgba(26, 26, 26, 0.8);
    }
  }
}
</style>
