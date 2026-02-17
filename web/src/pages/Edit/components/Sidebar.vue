<template>
  <div
    class="sidebarContainer"
    @click.stop
    :class="{ show: show, isDark: isDark }"
    :style="{ zIndex: zIndex }"
  >
    <span class="closeBtn el-icon-close" @click="close"></span>
    <div class="sidebarHeader" v-if="title">
      {{ title }}
    </div>
    <div class="sidebarContent customScrollbar" ref="sidebarContentRef">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useStore } from '@/store'
import { getBus } from '@/bus'
import { store as configStore } from '@/config'

const props = withDefaults(
  defineProps<{
    title?: string
  }>(),
  { title: '' }
)
const store = useStore()
const { isDark } = storeToRefs(store)
const { setActiveSidebar } = store
const bus = getBus()

const sidebarContentRef = ref<HTMLElement | null>(null)
const show = ref(false)
const zIndex = ref(0)

watch(show, (val, oldVal) => {
  if (val && !oldVal) {
    zIndex.value = configStore.sidebarZIndex++
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

  &.isDark {
    background-color: #262a2e;
    border-left-color: hsla(0, 0%, 100%, 0.1);

    .sidebarHeader {
      border-bottom-color: hsla(0, 0%, 100%, 0.1);
      color: #fff;
    }

    .closeBtn {
      color: #fff;
    }
  }

  &.show {
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
  }

  .sidebarContent {
    width: 100%;
    height: 100%;
    overflow: auto;
  }
}
</style>
