<template>
  <Sidebar ref="sidebarRef" :title="t('theme.title')">
    <div class="themeGroupList" :class="{ isDark: isDark }">
      <el-tabs v-model="activeName" class="tabBox">
        <el-tab-pane
          v-for="group in groupList"
          :key="group.name"
          :label="group.name"
          :name="group.name"
        ></el-tab-pane>
      </el-tabs>
      <div class="themeListTheme customScrollbar">
        <div
          class="themeItem"
          v-for="item in currentList"
          :key="item.value"
          @click="useTheme(item)"
          :class="{ active: item.value === theme }"
        >
          <div class="imgBox">
            <img :src="item.img || themeImgMap[item.value]" alt="" />
          </div>
          <div class="name">{{ item.name }}</div>
        </div>
      </div>
    </div>
  </Sidebar>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useStore } from '@/store'
import { getBus } from '@/bus'
import { ElMessageBox } from 'element-plus'
import Sidebar from './Sidebar.vue'
import { storeData } from '@/api'
import themeImgMap from 'simple-mind-map-plugin-themes/themeImgMap'
import themeList from 'simple-mind-map-plugin-themes/themeList'

const props = defineProps<{
  data: { theme?: { config?: Record<string, unknown> } } | null
  mindMap: {
    getTheme: () => string
    setTheme: (t: string) => void
    setThemeConfig: (c: Record<string, unknown>, clear?: boolean) => void
    getCustomThemeConfig: () => Record<string, unknown>
    on: (e: string, fn: () => void) => void
    off: (e: string, fn: () => void) => void
  }
}>()
const { t } = useI18n()
const store = useStore()
const { isDark, extendThemeGroupList, activeSidebar } = storeToRefs(store)
const { setLocalConfig } = store
const bus = getBus()

const sidebarRef = ref<InstanceType<typeof Sidebar> | null>(null)
const themeListAll = ref([
  { name: '默认主题', value: 'default', dark: false },
  ...themeList
].reverse())
const theme = ref('')
const activeName = ref('')
const defaultGroupList = ref<{ name: string; list: { value: string; name: string; img?: string; dark?: boolean }[] }[]>([])

const groupList = computed(() => [...defaultGroupList.value, ...extendThemeGroupList.value])

const currentList = computed(() => {
  const g = groupList.value.find((item) => item.name === activeName.value)
  return g?.list ?? []
})

function handleViewThemeChange() {
  theme.value = props.mindMap.getTheme()
  handleDark()
}

function initGroup() {
  const baiduThemes = [
    'default', 'skyGreen', 'classic2', 'classic3', 'classicGreen', 'classicBlue',
    'blueSky', 'brainImpairedPink', 'earthYellow', 'freshGreen', 'freshRed',
    'romanticPurple', 'pinkGrape', 'mint'
  ]
  const baiduList: { value: string; name: string; img?: string; dark?: boolean }[] = []
  const classicsList: { value: string; name: string; img?: string; dark?: boolean }[] = []
  themeListAll.value.forEach((item) => {
    if (baiduThemes.includes(item.value)) {
      baiduList.push(item)
    } else if (!item.dark) {
      classicsList.push(item)
    }
  })
  defaultGroupList.value = [
    { name: t('theme.classics'), list: classicsList },
    { name: t('theme.dark'), list: themeListAll.value.filter((i) => i.dark) },
    { name: t('theme.simple'), list: baiduList }
  ]
  activeName.value = defaultGroupList.value[0]?.name ?? ''
}

function useTheme(item: { value: string }) {
  if (item.value === theme.value) return
  theme.value = item.value
  handleDark()
  const customThemeConfig = props.mindMap.getCustomThemeConfig()
  const hasCustomThemeConfig = Object.keys(customThemeConfig).length > 0
  if (hasCustomThemeConfig) {
    ElMessageBox.confirm(t('theme.coverTip'), t('theme.tip'), {
      confirmButtonText: t('theme.cover'),
      cancelButtonText: t('theme.reserve'),
      type: 'warning',
      distinguishCancelAndClose: true
    }).then((action) => {
      if (action === 'confirm') {
        props.mindMap.setThemeConfig({}, true)
        if (props.data?.theme) props.data.theme.config = {}
        changeTheme(item, {})
      } else if (action === 'cancel') {
        changeTheme(item, customThemeConfig)
      }
    }).catch(() => {})
  } else {
    changeTheme(item, customThemeConfig)
  }
}

function changeTheme(
  themeItem: { value: string },
  config: Record<string, unknown>
) {
  bus.$emit('showLoading')
  props.mindMap.setTheme(themeItem.value)
  storeData({ theme: { template: themeItem.value, config } })
}

function handleDark() {
  const extendThemeList: { value: string; dark?: boolean }[] = []
  extendThemeGroupList.value.forEach((group) => {
    extendThemeList.push(...group.list)
  })
  const target = [...themeListAll.value, ...extendThemeList].find(
    (item) => item.value === theme.value
  )
  setLocalConfig({ isDark: !!target?.dark })
}

watch(activeSidebar, (val) => {
  if (sidebarRef.value) {
    if (val === 'theme') {
      theme.value = props.mindMap.getTheme()
      sidebarRef.value.show = true
    } else {
      sidebarRef.value.show = false
    }
  }
})

onMounted(() => {
  initGroup()
  theme.value = props.mindMap.getTheme()
  props.mindMap.on('view_theme_change', handleViewThemeChange)
})
onBeforeUnmount(() => {
  props.mindMap.off('view_theme_change', handleViewThemeChange)
})
</script>

<style lang="less" scoped>
.themeGroupList {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;

  &.isDark {
    .name {
      color: #fff;
    }
  }

  .tabBox {
    flex-shrink: 0;

    :deep(.el-tabs__nav-wrap) {
      display: flex;
      justify-content: center;
    }
  }

  .themeListTheme {
    height: 100%;
    overflow-y: auto;
    padding: 0 20px;

    .themeItem {
      width: 100%;
      cursor: pointer;
      border-bottom: 1px solid #e9e9e9;
      margin-bottom: 20px;
      padding-bottom: 20px;
      transition: all 0.2s;
      border: 3px solid transparent;
      border-radius: 5px;
      overflow: hidden;

      &:last-of-type {
        border: none;
      }

      &:hover {
        box-shadow: 0 1px 2px -2px rgba(0, 0, 0, 0.16),
          0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09);
      }

      &.active {
        border: 3px solid rgb(154, 198, 250);
      }

      .imgBox {
        width: 100%;

        img {
          width: 100%;
        }
      }
      .name {
        text-align: center;
        font-size: 14px;
      }
    }
  }
}
</style>
