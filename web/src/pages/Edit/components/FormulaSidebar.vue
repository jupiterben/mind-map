<template>
  <Sidebar ref="sidebarRef" :title="t('formulaSidebar.title')">
    <div class="box" :class="{ isDark: isDark }">
      <div class="formulaInputBox">
        <el-input
          v-model="formulaText"
          :rows="4"
          resize="none"
          type="textarea"
          :placeholder="t('formulaSidebar.placeholder')"
          @keydown.stop
        />
        <el-button
          size="small"
          style="width: 100%; margin-top: 20px;"
          @click="confirm"
        >
          {{ t('formulaSidebar.confirm') }}
        </el-button>
      </div>
      <div class="title">{{ t('formulaSidebar.common') }}</div>
      <div class="formulaList customScrollbar">
        <div class="formulaItem" v-for="(item, index) in list" :key="index">
          <div class="overview" v-html="item.overview"></div>
          <div class="text" @click="formulaText = item.text">
            {{ item.text }}
          </div>
        </div>
      </div>
    </div>
  </Sidebar>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useStore } from '@/store'
import { getBus } from '@/bus'
import { ElMessage } from 'element-plus'
import Sidebar from './Sidebar.vue'
import { formulaList } from '@/config/constant'

const props = defineProps<{
  mindMap: {
    formula: { getKatexConfig: () => unknown }
    execCommand: (cmd: string, str: string) => void
  }
}>()
const { t } = useI18n()
const store = useStore()
const { isDark, activeSidebar } = storeToRefs(store)
const { setActiveSidebar } = store
const { openNodeRichText } = storeToRefs(store)
const bus = getBus()

const sidebarRef = ref<InstanceType<typeof Sidebar> | null>(null)
const formulaText = ref('')
const list = ref<{ overview: string; text: string }[]>([])
const activeNodes = ref<unknown[]>([])

function init() {
  if (typeof window === 'undefined' || !(window as unknown as { katex?: { renderToString: (s: string, c: unknown) => string } }).katex) return
  const katex = (window as unknown as { katex: { renderToString: (s: string, c: unknown) => string } }).katex
  list.value = formulaList.map((item: string) => ({
    overview: katex.renderToString(item, props.mindMap.formula.getKatexConfig()),
    text: item
  }))
}

function handleNodeActive(_node: unknown, nodes: unknown[]) {
  activeNodes.value = nodes ?? []
  if (activeNodes.value.length <= 0 && activeSidebar.value === 'formulaSidebar') {
    setActiveSidebar(null)
  }
}

function confirm() {
  if (!openNodeRichText.value) {
    ElMessage.warning(t('formulaSidebar.tip'))
    return
  }
  const str = formulaText.value.trim()
  if (!str) return
  props.mindMap.execCommand('INSERT_FORMULA', str)
}

watch(activeSidebar, (val) => {
  if (sidebarRef.value) {
    sidebarRef.value.show = val === 'formulaSidebar'
  }
})

onMounted(() => {
  bus.$on('node_active', handleNodeActive)
  init()
})
onBeforeUnmount(() => {
  bus.$off('node_active', handleNodeActive)
})
</script>

<style lang="less" scoped>
.box {
  padding: 10px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.isDark {
    .title {
      color: #fff;
    }

    .formulaList {
      .formulaItem {
        .overview,
        .text {
          color: #fff;
        }

        .text {
          background-color: #363b3f;
        }
      }
    }

    :deep(.el-textarea__inner) {
      background-color: transparent;
      color: #fff;
    }
  }

  .title {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin: 10px 0;
    flex-shrink: 0;
  }

  .formulaInputBox {
    flex-shrink: 0;
  }

  .formulaList {
    height: 100%;
    overflow-y: auto;

    .formulaItem {
      position: relative;
      display: flex;
      overflow: hidden;
      align-items: center;
      border: 1px solid #dcdfe6;
      border-bottom: none;

      &:last-of-type {
        border-bottom: 1px solid #dcdfe6;
      }

      .overview,
      .text {
        width: 50%;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-shrink: 0;
      }

      .overview {
        padding: 10px 0;
        border-right: none;
      }

      .text {
        cursor: pointer;
        font-size: 14px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        height: 100%;
        position: absolute;
        right: 0;
        top: 0;
        border-left: 1px solid #dcdfe6;
        background-color: #fafafa;
      }
    }
  }
}
</style>
