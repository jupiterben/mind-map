<template>
  <div class="colorContainer" :class="{ isDark: isDark }">
    <div class="colorList">
      <span
        class="colorItem iconfont"
        v-for="item in colorList"
        :key="item"
        :style="{ backgroundColor: item }"
        :class="{ icontouming: item === 'transparent' }"
        @click="clickColorItem(item)"
      ></span>
    </div>
    <div class="moreColor">
      <span>{{ t('color.moreColor') }}</span>
      <el-color-picker
        size="small"
        show-alpha
        v-model="selectColor"
        @change="changeColor"
      ></el-color-picker>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useStore } from '@/store'
import { colorList } from '@/config'

const props = withDefaults(
  defineProps<{
    color?: string
  }>(),
  { color: '' }
)
const emit = defineEmits<{ (e: 'change', color: string): void }>()
const { t } = useI18n()
const store = useStore()
const { isDark } = storeToRefs(store)

const selectColor = ref(props.color)
watch(
  () => props.color,
  (v) => {
    selectColor.value = v
  },
  { immediate: true }
)

function clickColorItem(color: string) {
  emit('change', color)
}

function changeColor() {
  emit('change', selectColor.value)
}
</script>

<style lang="less" scoped>
.colorContainer {
  &.isDark {
    .moreColor {
      color: hsla(0, 0%, 100%, 0.6);
    }
  }
}

.colorList {
  width: 240px;
  display: flex;
  flex-wrap: wrap;

  .colorItem {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 15px;
    height: 15px;
    margin-right: 5px;
    margin-bottom: 5px;
    cursor: pointer;
  }
}

.moreColor {
  display: flex;
  align-items: center;

  span {
    margin-right: 5px;
  }
}
</style>
