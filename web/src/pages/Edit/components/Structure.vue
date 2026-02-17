<template>
  <Sidebar ref="sidebarRef" :title="t('strusture.title')">
    <div class="layoutGroupList" :class="{ isDark: isDark }">
      <div
        class="laytouGroup"
        v-for="group in layoutGroupList"
        :key="group.name"
      >
        <div class="groupName">{{ group.name }}</div>
        <div class="layoutList">
          <div
            class="layoutItem"
            v-for="item in group.list"
            :key="item"
            @click="useLayout(item)"
            :class="{ active: item === layout }"
          >
            <img :src="layoutImgMap[item]" alt="" />
          </div>
        </div>
      </div>
    </div>
  </Sidebar>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useStore } from '@/store'
import Sidebar from './Sidebar.vue'
import { storeData } from '@/api'
import { layoutImgMap } from '@/config/constant.js'
import { layoutGroupList as layoutGroupListConfig } from '@/config'

const props = defineProps<{
  mindMap: { getLayout: () => string; setLayout: (l: string) => void }
}>()
const { t, locale } = useI18n()
const store = useStore()
const { activeSidebar, isDark } = storeToRefs(store)

const sidebarRef = ref<InstanceType<typeof Sidebar> | null>(null)
const layout = ref('')

const layoutGroupList = computed(() => {
  const loc = locale?.value ?? locale
  const groupList = (layoutGroupListConfig as Record<string, { name: string; list: string[] }[]>)[loc as string] || (layoutGroupListConfig as { zh: { name: string; list: string[] }[] }).zh
  return groupList.map((group: { name: string; list: string[] }) => {
    const list = [...group.list].filter((item) => !['rightFishbone', 'rightFishbone2'].includes(item))
    return { name: group.name, list }
  })
})

watch(activeSidebar, (val) => {
  if (sidebarRef.value) {
    if (val === 'structure') {
      layout.value = props.mindMap.getLayout()
      sidebarRef.value.show = true
    } else {
      sidebarRef.value.show = false
    }
  }
})

function useLayout(l: string) {
  layout.value = l
  props.mindMap.setLayout(l)
  storeData({ layout: l })
}
</script>

<style lang="less" scoped>
.layoutGroupList {
  width: 100%;
  padding: 20px;

  &.isDark {
    .laytouGroup {
      .groupName {
        color: #fff;
      }
    }
  }

  .laytouGroup {
    width: 100%;
    margin-bottom: 12px;

    .groupName {
      font-weight: 500;
      color: #303133;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .layoutList {
      width: 100%;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;

      .layoutItem {
        width: 120px;
        height: 70px;
        cursor: pointer;
        border: 1px solid #e9e9e9;
        transition: all 0.2s;
        overflow: hidden;
        margin-bottom: 12px;
        padding: 5px;
        border-radius: 5px;

        &:hover {
          box-shadow: 0 1px 2px -2px rgba(0, 0, 0, 0.16),
            0 3px 6px 0 rgba(0, 0, 0, 0.12), 0 5px 12px 4px rgba(0, 0, 0, 0.09);
        }

        &.active {
          border: 1px solid #409eff;
        }

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    }
  }
}
</style>
