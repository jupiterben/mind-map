<template>
  <div
    class="aiContinueToolbar"
    ref="toolbarRef"
    :class="{ isDark: isDark }"
    @click.stop.passive
  >
    <div class="row">
      <span class="label">{{ $t('ai.breadth') }}</span>
      <el-select v-model="breadthOption" size="small" class="breadthSelect">
        <el-option :label="$t('ai.breadthAuto')" value="auto" />
        <el-option v-for="n in 10" :key="n" :label="String(n)" :value="n" />
      </el-select>
    </div>
    <el-button
      type="primary"
      size="small"
      :loading="creating"
      :disabled="!canRun"
      class="btn"
      @click="runContinue"
    >
      {{ $t('ai.aiCreatePart') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from '@/store'
import { getBus } from '@/bus'

const props = defineProps<{ mindMap: any }>()

const bus = getBus()
const toolbarRef = ref<HTMLElement | null>(null)
const activeNodes = ref<any[]>([])
const breadthOption = ref<string | number>('auto')
const creating = ref(false)

const isDark = computed(() => useStore().isDark ?? false)
const hasGeneralization = computed(
  () => activeNodes.value.findIndex((n: any) => n.isGeneralization) !== -1
)
const canRun = computed(
  () => activeNodes.value.length === 1 && !hasGeneralization.value
)

function onNodeActive(_node: any, list: any[]) {
  activeNodes.value = [...(list || [])]
}

function runContinue() {
  if (activeNodes.value.length !== 1) return
  // 按钮点击默认：添加子节点（不替换）
  const options = breadthOption.value === 'auto' ? { replace: false } : { breadth: Number(breadthOption.value), replace: false }
  bus.$emit('ai_create_part_with_options', activeNodes.value[0], options)
}

function onCreatingStart() {
  creating.value = true
}
function onCreatingEnd() {
  creating.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (!(e.ctrlKey || e.metaKey)) return
  const isReplace = e.key === 'Enter'
  const isAdd = e.key === '+' || (e.key === '=' && e.shiftKey)
  if (!isReplace && !isAdd) return
  const target = e.target as HTMLElement
  if (target && (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable)) return
  if (!canRun.value) return
  e.preventDefault()
  e.stopImmediatePropagation()
  const options = breadthOption.value === 'auto' ? { replace: isReplace } : { breadth: Number(breadthOption.value), replace: isReplace }
  bus.$emit('ai_create_part_with_options', activeNodes.value[0], options)
}

onMounted(() => {
  bus.$on('node_active', onNodeActive)
  bus.$on('ai_creating_start', onCreatingStart)
  bus.$on('ai_creating_end', onCreatingEnd)
  window.addEventListener('keydown', onKeydown, true)
  if (toolbarRef.value) document.body.appendChild(toolbarRef.value)
})

onBeforeUnmount(() => {
  bus.$off('node_active', onNodeActive)
  bus.$off('ai_creating_start', onCreatingStart)
  bus.$off('ai_creating_end', onCreatingEnd)
  window.removeEventListener('keydown', onKeydown, true)
})
</script>

<style lang="less" scoped>
.aiContinueToolbar {
  position: fixed;
  z-index: 2000;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 4px 10px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  box-shadow: 0 2px 16px 0 rgba(0, 0, 0, 0.06);

  &.isDark {
    background: #363b3f;
    border-color: rgba(255, 255, 255, 0.1);

    .label {
      color: #eee;
    }
  }

  .row {
    display: flex;
    align-items: center;
    gap: 4px;

    .label {
      flex-shrink: 0;
      font-size: 12px;
      color: #666;
    }
    :deep(.el-input-number),
    :deep(.el-select) {
      width: 88px;

      .el-input__wrapper {
        padding: 0 8px;
        min-height: 24px;
      }
      .el-input__inner {
        font-size: 12px;
      }
    }
  }

  .breadthSelect {
    flex-shrink: 0;
  }

  .btn {
    flex-shrink: 0;
  }
}
</style>
