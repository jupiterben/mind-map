<template>
  <div
    class="richTextToolbar"
    ref="richTextToolbar"
    :style="style"
    :class="{ isDark: isDark }"
    @click.stop.passive
    v-show="showRichTextToolbar"
  >
    <el-tooltip :content="$t('richTextToolbar.bold')" placement="top">
      <div class="btn" :class="{ active: formatInfo.bold }" @click="toggleBold">
        <span class="icon iconfont iconzitijiacu"></span>
      </div>
    </el-tooltip>

    <el-tooltip :content="$t('richTextToolbar.italic')" placement="top">
      <div class="btn" :class="{ active: formatInfo.italic }" @click="toggleItalic">
        <span class="icon iconfont iconzitixieti"></span>
      </div>
    </el-tooltip>

    <el-tooltip :content="$t('richTextToolbar.underline')" placement="top">
      <div class="btn" :class="{ active: formatInfo.underline }" @click="toggleUnderline">
        <span class="icon iconfont iconzitixiahuaxian"></span>
      </div>
    </el-tooltip>

    <el-tooltip :content="$t('richTextToolbar.strike')" placement="top">
      <div class="btn" :class="{ active: formatInfo.strike }" @click="toggleStrike">
        <span class="icon iconfont iconshanchuxian"></span>
      </div>
    </el-tooltip>

    <el-tooltip :content="$t('richTextToolbar.fontFamily')" placement="top">
      <span class="btn-wrap">
        <el-popover placement="bottom" trigger="hover">
          <template #default>
            <div class="fontOptionsList" :class="{ isDark: isDark }">
              <div
                class="fontOptionItem"
                v-for="item in fontFamilyList"
                :key="item.value"
                :style="{ fontFamily: item.value }"
                :class="{ active: formatInfo.font === item.value }"
                @click="changeFontFamily(item.value)"
              >
                {{ item.name }}
              </div>
            </div>
          </template>
          <template #reference>
            <div class="btn">
              <span class="icon iconfont iconxingzhuang-wenzi"></span>
            </div>
          </template>
        </el-popover>
      </span>
    </el-tooltip>

    <el-tooltip :content="$t('richTextToolbar.fontSize')" placement="top">
      <span class="btn-wrap">
        <el-popover placement="bottom" trigger="hover">
          <template #default>
            <div class="fontOptionsList" :class="{ isDark: isDark }">
              <div
                class="fontOptionItem"
                v-for="item in fontSizeListRef"
                :key="item"
                :style="{
                  fontSize: item + 'px',
                  height: (item < 30 ? 30 : item + 10) + 'px'
                }"
                :class="{ active: formatInfo.size === item + 'px' }"
                @click="changeFontSize(item)"
              >
                {{ item }}px
              </div>
            </div>
          </template>
          <template #reference>
            <div class="btn">
              <span class="icon iconfont iconcase fontColor"></span>
            </div>
          </template>
        </el-popover>
      </span>
    </el-tooltip>

    <el-tooltip :content="$t('richTextToolbar.color')" placement="top">
      <span class="btn-wrap">
        <el-popover placement="bottom" trigger="hover">
          <template #default>
            <Color :color="fontColor" @change="changeFontColor"></Color>
          </template>
          <template #reference>
            <div class="btn" :style="{ color: formatInfo.color }">
              <span class="icon iconfont iconzitiyanse"></span>
            </div>
          </template>
        </el-popover>
      </span>
    </el-tooltip>

    <el-tooltip :content="$t('richTextToolbar.backgroundColor')" placement="top">
      <span class="btn-wrap">
        <el-popover placement="bottom" trigger="hover">
          <template #default>
            <Color :color="fontBackgroundColor" @change="changeFontBackgroundColor"></Color>
          </template>
          <template #reference>
            <div class="btn">
              <span class="icon iconfont iconbeijingyanse"></span>
            </div>
          </template>
        </el-popover>
      </span>
    </el-tooltip>

    <el-tooltip :content="$t('richTextToolbar.textAlign')" placement="top">
      <span class="btn-wrap">
        <el-popover placement="bottom" trigger="hover">
          <template #default>
            <div class="fontOptionsList" :class="{ isDark: isDark }">
              <div
                class="fontOptionItem"
                v-for="item in alignList"
                :key="item.value"
                :class="{ active: formatInfo.align === item.value }"
                @click="changeTextAlign(item.value)"
              >
                {{ item.name }}
              </div>
            </div>
          </template>
          <template #reference>
            <div class="btn">
              <span class="icon iconfont iconjuzhongduiqi"></span>
            </div>
          </template>
        </el-popover>
      </span>
    </el-tooltip>

    <el-tooltip :content="$t('richTextToolbar.removeFormat')" placement="top">
      <div class="btn" @click="removeFormat">
        <span class="icon iconfont iconqingchu"></span>
      </div>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { fontFamilyList as fontFamilyConfig, fontSizeList, alignList as alignListConfig } from '@/config'
import Color from './Color.vue'
import { useStore } from '@/store'
import { getBus } from '@/bus'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  mindMap: any
}>()

const bus = getBus()
const { locale } = useI18n()

const richTextToolbar = ref<HTMLElement | null>(null)
const showRichTextToolbar = ref(false)
const style = reactive({ left: '0px', top: '0px' })
const fontColor = ref('')
const fontBackgroundColor = ref('')
const formatInfo = reactive<Record<string, any>>({})

const isDark = computed(() => useStore().isDark ?? false)
const fontFamilyList = computed(
  () => fontFamilyConfig[locale.value ?? (locale as any)] || fontFamilyConfig.zh
)
const alignList = computed(
  () => alignListConfig[locale.value ?? (locale as any)] || alignListConfig.zh
)
const fontSizeListRef = fontSizeList

function onRichTextSelectionChange(hasRange: boolean, rect: any, info: any) {
  if (hasRange) {
    style.left = rect.left + rect.width / 2 + 'px'
    style.top = rect.top - 60 + 'px'
    Object.assign(formatInfo, info || {})
  }
  showRichTextToolbar.value = hasRange
}

function toggleBold() {
  formatInfo.bold = !formatInfo.bold
  props.mindMap.richText.formatText({ bold: formatInfo.bold })
}

function toggleItalic() {
  formatInfo.italic = !formatInfo.italic
  props.mindMap.richText.formatText({ italic: formatInfo.italic })
}

function toggleUnderline() {
  formatInfo.underline = !formatInfo.underline
  props.mindMap.richText.formatText({ underline: formatInfo.underline })
}

function toggleStrike() {
  formatInfo.strike = !formatInfo.strike
  props.mindMap.richText.formatText({ strike: formatInfo.strike })
}

function changeFontFamily(font: string) {
  formatInfo.font = font
  props.mindMap.richText.formatText({ font })
}

function changeFontSize(size: number) {
  formatInfo.size = size + 'px'
  props.mindMap.richText.formatText({ size: size + 'px' })
}

function changeFontColor(color: string) {
  formatInfo.color = color
  props.mindMap.richText.formatText({ color })
}

function changeFontBackgroundColor(background: string) {
  formatInfo.background = background
  props.mindMap.richText.formatText({ background })
}

function changeTextAlign(align: string) {
  formatInfo.align = align
  props.mindMap.richText.formatText({ align })
}

function removeFormat() {
  props.mindMap.richText.removeFormat()
}

onMounted(() => {
  bus.$on('rich_text_selection_change', onRichTextSelectionChange)
  if (richTextToolbar.value) document.body.append(richTextToolbar.value)
})

onBeforeUnmount(() => {
  bus.$off('rich_text_selection_change', onRichTextSelectionChange)
})
</script>

<style lang="less" scoped>
.richTextToolbar {
  position: fixed;
  z-index: 2000;
  height: 55px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  transform: translateX(-50%);

  &.isDark {
    background: #363b3f;

    .btn {
      color: #fff;

      &:hover {
        background: hsla(0, 0%, 100%, 0.05);
      }
    }
  }

  .btn-wrap {
    display: inline-flex;
  }

  .btn {
    width: 55px;
    height: 55px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;

    &:hover {
      background-color: #eefbed;
    }

    &.active {
      color: #12bb37;
    }

    .icon {
      font-size: 20px;

      &.fontColor {
        font-size: 26px;
      }
    }
  }
}

.fontOptionsList {
  width: 150px;

  &.isDark {
    .fontOptionItem {
      color: #fff;

      &:hover {
        background-color: hsla(0, 0%, 100%, 0.05);
      }
    }
  }

  .fontOptionItem {
    height: 30px;
    width: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;

    &:hover {
      background-color: #f7f7f7;
    }

    &.active {
      color: #12bb37;
    }
  }
}
</style>
