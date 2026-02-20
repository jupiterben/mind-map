<template>
  <el-dialog
    class="aiConfigDialog"
    :title="$t('ai.AIConfiguration')"
    v-model="aiConfigDialogVisible"
    width="550px"
    append-to-body
  >
    <div class="aiConfigBox">
      <el-form :model="ruleForm" :rules="rulesRef" ref="ruleFormRef" label-width="100px">
        <p class="title">{{ $t('ai.AIConfiguration') }}</p>
        <el-form-item :label="$t('ai.provider')" prop="provider">
          <el-select v-model="ruleForm.provider" :placeholder="$t('ai.provider')" @change="onProviderChange" style="width: 100%">
            <el-option :label="$t('ai.providerVolcanoArk')" value="volcano_ark" />
            <el-option :label="$t('ai.providerDeepseek')" value="deepseek" />
            <el-option :label="$t('ai.providerMiniMax')" value="minimax" />
          </el-select>
        </el-form-item>
        <p class="desc" v-if="ruleForm.provider === 'volcano_ark'">
          {{ $t('ai.configTip') }}<a href="https://mp.weixin.qq.com/s/JNb7PH4sCjWzIZ9G8wStGQ" target="_blank">{{ $t('ai.course') }}</a>。
        </p>
        <p class="desc" v-else-if="ruleForm.provider === 'deepseek'">{{ $t('ai.deepseekConfigTip') }}</p>
        <p class="desc" v-else-if="ruleForm.provider === 'minimax'">{{ $t('ai.minimaxConfigTip') }}</p>
        <el-form-item label="API Key" prop="key">
          <el-input v-model="ruleForm.key" :placeholder="apiKeyPlaceholder"></el-input>
        </el-form-item>
        <el-form-item :label="$t('ai.model')" prop="model">
          <el-select
            v-model="ruleForm.model"
            :placeholder="$t('ai.model')"
            filterable
            allow-create
            style="width: 100%"
            :teleported="false"
          >
            <el-option
              v-for="opt in modelOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancel">{{ $t('ai.cancel') }}</el-button>
        <el-button type="primary" @click="confirm">{{ $t('ai.confirm') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useStoreMixin } from '@/mixins/storeMixin'

const props = withDefaults(
  defineProps<{
    visible?: boolean
  }>(),
  { visible: false }
)

const emit = defineEmits<{
  (e: 'change', value: boolean): void
}>()

const { aiConfig, setLocalConfig } = useStoreMixin()
const { t } = useI18n()

const aiConfigDialogVisible = ref(false)
const ruleFormRef = ref<any>(null)
const PROVIDER_DEFAULTS: Record<string, { model: string }> = {
  volcano_ark: { model: '' },
  deepseek: { model: 'deepseek-chat' },
  minimax: { model: 'MiniMax-M2.5' }
}

/** 各 provider 的模型选项（value 为接口 model 参数） */
const PROVIDER_MODELS: Record<string, { label: string; value: string }[]> = {
  volcano_ark: [
    { label: 'Doubao Pro 128K', value: 'doubao-pro-128k' },
    { label: 'Doubao Pro 32K', value: 'doubao-pro-32k' },
    { label: 'Doubao 1.5 Pro 32K', value: 'doubao-1.5-pro-32k' },
    { label: 'Doubao 1.5 Pro 128K', value: 'doubao-1.5-pro-128k' },
    { label: '豆包 Lite 32K', value: 'doubao-lite-32k' }
  ],
  deepseek: [
    { label: 'DeepSeek Chat (V3)', value: 'deepseek-chat' },
    { label: 'DeepSeek Reasoner', value: 'deepseek-reasoner' },
    { label: 'DeepSeek Coder', value: 'deepseek-coder' }
  ],
  minimax: [
    { label: 'MiniMax-M2.5（204.8K，峰值性能）', value: 'MiniMax-M2.5' },
    { label: 'MiniMax-M2.5-highspeed（204.8K，约 100 tps）', value: 'MiniMax-M2.5-highspeed' },
    { label: 'MiniMax-M2.1（204.8K，编程增强）', value: 'MiniMax-M2.1' },
    { label: 'MiniMax-M2.1-highspeed（204.8K，约 100 tps）', value: 'MiniMax-M2.1-highspeed' },
    { label: 'MiniMax-M2（204.8K，Agent / 推理）', value: 'MiniMax-M2' }
  ]
}

const modelOptions = computed(() => PROVIDER_MODELS[ruleForm.provider] ?? [])

const apiKeyPlaceholder = computed(() => {
  if (ruleForm.provider === 'deepseek') return t('ai.deepseekKeyPlaceholder')
  if (ruleForm.provider === 'minimax') return t('ai.minimaxKeyPlaceholder')
  return undefined
})

const ruleForm = reactive({
  provider: 'volcano_ark' as 'volcano_ark' | 'deepseek' | 'minimax',
  key: '',
  model: '',
  port: '',
  method: ''
})

const rulesRef = ref({
  provider: [{ required: true, message: '', trigger: 'change' }],
  key: [{ required: true, message: '', trigger: 'blur' }],
  model: [{ required: true, message: '', trigger: 'blur' }],
  port: [{ required: true, message: '', trigger: 'blur' }],
  method: [{ required: true, message: '', trigger: 'blur' }]
})

function close() {
  emit('change', false)
}

function initFormData() {
  const config = aiConfig.value
  if (!config || typeof config !== 'object') return
  const provider = (config as any).provider || 'volcano_ark'
  ruleForm.provider = provider
  ruleForm.key = (config.keys?.[provider as import('@/store').AiProvider] ?? (config as any).key) ?? ''
  ruleForm.model = (config.models?.[provider as import('@/store').AiProvider] ?? config.model ?? PROVIDER_DEFAULTS[provider]?.model) ?? ''
  ruleForm.port = config.port !== undefined && config.port !== null ? String(config.port) : ''
  ruleForm.method = config.method ?? 'POST'
}

function onProviderChange(provider: 'volcano_ark' | 'deepseek' | 'minimax') {
  const config = aiConfig.value
  ruleForm.key = (config?.keys?.[provider as import('@/store').AiProvider] ?? (config as any)?.key) ?? ''
  ruleForm.model = (config?.models?.[provider as import('@/store').AiProvider] ?? config?.model ?? PROVIDER_DEFAULTS[provider]?.model) ?? ''
}

function cancel() {
  close()
  initFormData()
}

const DEFAULT_KEYS: Partial<Record<'volcano_ark' | 'deepseek' | 'minimax', string>> = {
  volcano_ark: '',
  deepseek: '',
  minimax: ''
}

function confirm() {
  ruleFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      close()
      const config = aiConfig.value
      const port = ruleForm.port === '' ? 3456 : Number(ruleForm.port)
      const keys = { ...DEFAULT_KEYS, ...config?.keys, [ruleForm.provider]: ruleForm.key }
      const models = { ...config?.models, [ruleForm.provider]: ruleForm.model }
      const { key: _k, ...rest } = ruleForm
      setLocalConfig({
        ...rest,
        port: Number.isNaN(port) ? 3456 : port,
        keys,
        models,
        model: ruleForm.model
      })
      ElMessage.success(t('ai.configSaveSuccessTip'))
    }
  })
}

watch(
  () => props.visible,
  (val) => {
    aiConfigDialogVisible.value = val
  },
  { immediate: true }
)

watch(aiConfigDialogVisible, (val, oldVal) => {
  if (!val && oldVal) close()
})

onMounted(() => {
  rulesRef.value.provider[0].message = t('ai.providerValidateTip')
  rulesRef.value.key[0].message = t('ai.keyValidateTip')
  rulesRef.value.model[0].message = t('ai.modelValidateTip')
  rulesRef.value.port[0].message = t('ai.portValidateTip')
  rulesRef.value.method[0].message = t('ai.methodValidateTip')
  initFormData()
})
</script>

<style lang="less" scoped>
.aiConfigDialog {
  :deep(.el-dialog__body) {
    padding: 12px 20px;
  }

  .aiConfigBox {
    a {
      color: #409eff;
    }

    .title {
      margin-bottom: 12px;
      font-weight: bold;
    }

    .desc {
      margin-bottom: 12px;
      padding-left: 12px;
      border-left: 5px solid #ccc;
    }
  }
}
</style>
