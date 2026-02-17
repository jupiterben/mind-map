<template>
  <div class="searchContainer" :class="{ isDark: isDark, show: show }">
    <div class="closeBtnBox">
      <span class="closeBtn el-icon-close" @click="close"></span>
    </div>
    <div class="searchInputBox">
      <el-input
        ref="searchInputRef"
        :placeholder="t('search.searchPlaceholder')"
        size="small"
        v-model="searchText"
        @keyup.enter.stop="onSearchNext"
        @keydown.stop
        @focus="onFocus"
        @blur="onBlur"
      >
        <template #prefix>
          <i class="el-input__icon el-icon-search"></i>
        </template>
        <template #append v-if="!isUndef(searchText)">
          <el-button size="small" @click="showReplaceInput = true">
            {{ t('search.replace') }}
          </el-button>
        </template>
      </el-input>
      <div class="searchInfo" v-if="showSearchInfo && !isUndef(searchText)">
        {{ currentIndex }} / {{ total }}
      </div>
    </div>
    <el-input
      v-if="showReplaceInput"
      ref="replaceInputRef"
      :placeholder="t('search.replacePlaceholder')"
      size="small"
      v-model="replaceText"
      style="margin: 12px 0;"
      @keydown.stop
      @focus="onFocus"
      @blur="onBlur"
    >
      <template #prefix>
        <i class="el-input__icon el-icon-edit"></i>
      </template>
      <template #append>
        <el-button size="small" @click="hideReplaceInput">
          {{ t('search.cancel') }}
        </el-button>
      </template>
    </el-input>
    <div class="btnList" v-if="showReplaceInput">
      <el-button size="small" :disabled="isReadonly" @click="replace">
        {{ t('search.replace') }}
      </el-button>
      <el-button size="small" :disabled="isReadonly" @click="replaceAll">
        {{ t('search.replaceAll') }}
      </el-button>
    </div>
    <div
      class="searchResultList"
      :style="{ height: searchResultListHeight + 'px' }"
      v-if="showSearchResultList"
    >
      <div
        class="searchResultItem"
        v-for="(item, index) in searchResultList"
        :key="item.id"
        :title="item.name"
        v-html="item.text"
        @click.stop="onSearchResultItemClick(index)"
      ></div>
      <div class="empty" v-if="searchResultList.length <= 0">
        <span class="iconfont iconwushuju"></span>
        <span class="text">{{ t('search.noResult') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useStore } from '@/store'
import { getBus } from '@/bus'
import { isUndef as isUndefUtil, getTextFromHtml } from 'simple-mind-map/src/utils/index'

const props = defineProps<{
  mindMap: {
    on: (e: string, fn: (...args: unknown[]) => void) => void
    off: (e: string, fn: (...args: unknown[]) => void) => void
    updateConfig: (c: { enableAutoEnterTextEditWhenKeydown: boolean }) => void
    search: {
      search: (text: string) => void
      replace: (text: string, one?: boolean) => void
      replaceAll: (text: string) => void
      endSearch: () => void
      jump: (index: number) => void
    }
    keyCommand: { addShortcut: (k: string, fn: () => void) => void; removeShortcut: (k: string, fn: () => void) => void }
  }
}>()
const { t } = useI18n()
const store = useStore()
const { isDark, isReadonly } = storeToRefs(store)
const bus = getBus()

const searchInputRef = ref<{ focus: () => void; blur: () => void } | null>(null)
const replaceInputRef = ref<{ blur: () => void } | null>(null)
const show = ref(false)
const searchText = ref('')
const replaceText = ref('')
const showReplaceInput = ref(false)
const currentIndex = ref(0)
const total = ref(0)
const showSearchInfo = ref(false)
const searchResultListHeight = ref(0)
const searchResultList = ref<{ id: string; text: string; name: string }[]>([])
const showSearchResultList = ref(false)

function isUndef(v: unknown) {
  return isUndefUtil(v)
}

function handleSearchInfoChange(data: { currentIndex: number; total: number }) {
  currentIndex.value = data.currentIndex + 1
  total.value = data.total
  showSearchInfo.value = true
}

function showSearch() {
  bus.$emit('closeSideBar')
  show.value = true
  nextTick(() => searchInputRef.value?.focus())
}

function hideReplaceInput() {
  showReplaceInput.value = false
  replaceText.value = ''
}

function onFocus() {
  props.mindMap.updateConfig({ enableAutoEnterTextEditWhenKeydown: false })
}

function onBlur() {
  props.mindMap.updateConfig({ enableAutoEnterTextEditWhenKeydown: true })
}

function blur() {
  searchInputRef.value?.blur()
  replaceInputRef.value?.blur()
}

function onSearchNext() {
  showSearchResultList.value = true
  props.mindMap.search.search(searchText.value)
}

function replace() {
  props.mindMap.search.replace(replaceText.value, true)
}

function replaceAll() {
  props.mindMap.search.replaceAll(replaceText.value)
}

function close() {
  show.value = false
  showSearchResultList.value = false
  showSearchInfo.value = false
  total.value = 0
  currentIndex.value = 0
  searchText.value = ''
  hideReplaceInput()
  props.mindMap.search.endSearch()
}

function onSearchMatchNodeListChange(list: { data?: { text?: string; uid?: string }; nodeData?: { data: { text?: string; uid?: string } } }[]) {
  searchResultList.value = list.map((item) => {
    const data = item.data ?? (item as { nodeData: { data: { text?: string; uid?: string } } }).nodeData?.data
    let name = (data?.text ?? '') as string
    const id = (data as { uid?: string })?.uid ?? ''
    if ((data as { richText?: boolean })?.richText) {
      name = getTextFromHtml(name)
    }
    const reg = new RegExp(`${searchText.value.trim()}`, 'g')
    const text = name.replace(reg, (a) => `<span class="match">${a}</span>`)
    return { data: item, id, text, name }
  })
}

function setSearchResultListHeight() {
  searchResultListHeight.value = window.innerHeight - 267 - 24
}

function onSearchResultItemClick(index: number) {
  props.mindMap.search.jump(index)
}

watch(searchText, () => {
  if (isUndef(searchText.value)) {
    currentIndex.value = 0
    total.value = 0
    showSearchInfo.value = false
  }
})

onMounted(() => {
  bus.$on('show_search', showSearch)
  props.mindMap.on('search_info_change', handleSearchInfoChange)
  props.mindMap.on('node_click', blur)
  props.mindMap.on('draw_click', blur)
  props.mindMap.on('expand_btn_click', blur)
  props.mindMap.on('search_match_node_list_change', onSearchMatchNodeListChange)
  props.mindMap.keyCommand.addShortcut('Control+f', showSearch)
  window.addEventListener('resize', setSearchResultListHeight)
  bus.$on('setData', close)
  setSearchResultListHeight()
})
onBeforeUnmount(() => {
  bus.$off('show_search', showSearch)
  props.mindMap.off('search_info_change', handleSearchInfoChange)
  props.mindMap.off('node_click', blur)
  props.mindMap.off('draw_click', blur)
  props.mindMap.off('expand_btn_click', blur)
  props.mindMap.off('search_match_node_list_change', onSearchMatchNodeListChange)
  props.mindMap.keyCommand.removeShortcut('Control+f', showSearch)
  window.removeEventListener('resize', setSearchResultListHeight)
  bus.$off('setData', close)
})
</script>

<style lang="less" scoped>
.searchContainer {
  position: relative;
  background-color: #fff;
  padding: 16px;
  width: 296px;
  border-radius: 12px;
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 110px;
  right: -296px;
  transition: all 0.3s;

  &.isDark {
    background-color: #363b3f;

    .closeBtnBox {
      color: #fff;
      background-color: #363b3f;
    }
  }

  &.show {
    right: 20px;
  }

  .btnList {
    display: flex;
    justify-content: flex-end;
  }

  .closeBtnBox {
    position: absolute;
    right: -5px;
    top: -5px;
    width: 20px;
    height: 20px;
    background-color: #fff;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);

    .closeBtn {
      font-size: 16px;
    }
  }

  .searchInputBox {
    position: relative;

    .searchInfo {
      position: absolute;
      right: 70px;
      top: 50%;
      transform: translateY(-50%);
      color: #909090;
      font-size: 14px;
    }
  }

  .searchResultList {
    position: absolute;
    left: 0;
    top: 100%;
    width: 100%;
    background-color: #fff;
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
    border-radius: 12px;
    margin-top: 5px;
    overflow-y: auto;
    padding: 12px 0;

    .searchResultItem {
      height: 30px;
      line-height: 30px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      padding: 0 12px;
      font-size: 14px;
      cursor: pointer;
      position: relative;
      padding-left: 22px;

      &::before {
        content: '';
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        width: 5px;
        height: 5px;
        background-color: #606266;
        border-radius: 50%;
      }

      &:hover {
        background-color: #f2f4f7;
      }

      :deep(.match) {
        color: #409eff;
        font-weight: bold;
      }
    }

    .empty {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .iconfont {
        font-size: 50px;
        margin-bottom: 20px;
      }

      .text {
        font-size: 14px;
        color: rgba(26, 26, 26, 0.8);
      }
    }
  }
}
</style>
