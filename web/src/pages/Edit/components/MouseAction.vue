<template>
  <div class="mouseActionContainer" :class="{ isDark: isDark }">
    <el-tooltip
      class="item"
      effect="dark"
      :content="
        useLeftKeySelectionRightKeyDrag ? t('mouseAction.tip2') : t('mouseAction.tip1')
      "
      placement="top"
    >
      <div
        class="btn iconfont"
        :class="[useLeftKeySelectionRightKeyDrag ? 'iconmouseR' : 'iconmouseL']"
        @click="toggleAction"
      ></div>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useStore } from '@/store'

const props = defineProps<{
  mindMap: { updateConfig: (c: { useLeftKeySelectionRightKeyDrag: boolean }) => void }
  isDark?: boolean
}>()
const { t } = useI18n()
const store = useStore()
const { useLeftKeySelectionRightKeyDrag, isDark } = storeToRefs(store)
const { setLocalConfig } = store

function toggleAction() {
  const val = !useLeftKeySelectionRightKeyDrag.value
  props.mindMap.updateConfig({ useLeftKeySelectionRightKeyDrag: val })
  setLocalConfig({ useLeftKeySelectionRightKeyDrag: val })
}
</script>

<style lang="less" scoped>
.mouseActionContainer {
  display: flex;
  align-items: center;

  &.isDark{
    .btn {
      color: hsla(0,0%,100%,.6);
    }
  }

  .item {
    margin-right: 12px;

    &:last-of-type {
      margin-right: 0;
    }
  }

  .btn {
    cursor: pointer;
    font-size: 18px;
  }
}
</style>
