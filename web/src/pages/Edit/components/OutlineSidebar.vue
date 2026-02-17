<template>
  <Sidebar ref="sidebarRef" :title="t('outline.title')">
    <div class="btnList">
      <el-tooltip
        class="item"
        effect="dark"
        :content="t('outline.print')"
        placement="top"
      >
        <div class="btn" @click="onPrint">
          <span class="icon iconfont iconprinting"></span>
        </div>
      </el-tooltip>
      <el-tooltip
        class="item"
        effect="dark"
        :content="t('outline.fullscreen')"
        placement="top"
      >
        <div
          class="btn"
          :class="{ isDark: isDark }"
          @click="onChangeToOutlineEdit"
        >
          <span class="icon iconfont iconquanping1"></span>
        </div>
      </el-tooltip>
    </div>
    <Outline
      :mindMap="mindMap"
      v-if="activeSidebar === 'outline'"
      @scrollTo="onScrollTo"
      ref="outlineRef"
    ></Outline>
  </Sidebar>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useStore } from '@/store'
import Sidebar from './Sidebar.vue'
import Outline from './Outline.vue'
import { printOutline } from '@/utils'

const props = defineProps<{
  mindMap: unknown
}>()
const { t } = useI18n()
const store = useStore()
const { activeSidebar, isDark } = storeToRefs(store)
const { setActiveSidebar, setIsOutlineEdit } = store

const sidebarRef = ref<InstanceType<typeof Sidebar> | null>(null)
const outlineRef = ref<InstanceType<typeof Outline> | null>(null)

watch(activeSidebar, (val) => {
  if (sidebarRef.value) {
    sidebarRef.value.show = val === 'outline'
  }
})

function onChangeToOutlineEdit() {
  setActiveSidebar(null)
  setIsOutlineEdit(true)
}

function onScrollTo(y: number) {
  const container = sidebarRef.value?.getEl()
  if (!container) return
  const height = container.offsetHeight
  const top = container.scrollTop
  if (y > top + height) {
    container.scrollTo(0, y - height / 2)
  }
}

function onPrint() {
  const el = outlineRef.value && (outlineRef.value as { $el?: HTMLElement }).$el
  if (el) printOutline(el)
}
</script>

<style lang="less" scoped>
.btnList {
  position: absolute;
  right: 50px;
  top: 12px;
  display: flex;
  align-items: center;

  .btn {
    cursor: pointer;
    margin-left: 12px;

    &.isDark {
      color: #fff;
    }
  }
}
</style>
