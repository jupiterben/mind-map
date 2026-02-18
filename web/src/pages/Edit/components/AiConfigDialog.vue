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
          </el-select>
        </el-form-item>
        <p class="desc" v-if="ruleForm.provider === 'volcano_ark'">
          {{ $t('ai.configTip') }}<a href="https://mp.weixin.qq.com/s/JNb7PH4sCjWzIZ9G8wStGQ" target="_blank">{{ $t('ai.course') }}</a>。
        </p>
        <p class="desc" v-else>{{ $t('ai.deepseekConfigTip') }}</p>
        <el-form-item label="API Key" prop="key">
          <el-input v-model="ruleForm.key" :placeholder="ruleForm.provider === 'deepseek' ? $t('ai.deepseekKeyPlaceholder') : undefined"></el-input>
        </el-form-item>
        <el-form-item :label="ruleForm.provider === 'deepseek' ? $t('ai.model') : $t('ai.inferenceAccessPoint')" prop="model">
          <el-input v-model="ruleForm.model"></el-input>
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
import { ref, reactive, watch, onMounted } from 'vue'
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
const PROVIDER_DEFAULTS: Record<string, { api: string; model: string }> = {
  volcano_ark: {
    api: 'http://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: ''
  },
  deepseek: {
    api: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat'
  }
}

const ruleForm = reactive({
  provider: 'volcano_ark' as 'volcano_ark' | 'deepseek',
  api: '',
  key: '',
  model: '',
  port: '',
  method: ''
})

const rulesRef = ref({
  provider: [{ required: true, message: '', trigger: 'change' }],
  api: [{ required: true, message: '', trigger: 'blur' }],
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
  ruleForm.api = config.api ?? PROVIDER_DEFAULTS[provider]?.api ?? ''
  ruleForm.key = config.key ?? ''
  ruleForm.model = config.model ?? PROVIDER_DEFAULTS[provider]?.model ?? ''
  ruleForm.port = config.port ?? ''
  ruleForm.method = config.method ?? 'POST'
}

function onProviderChange(provider: 'volcano_ark' | 'deepseek') {
  const def = PROVIDER_DEFAULTS[provider]
  if (def) {
    ruleForm.api = def.api
    ruleForm.model = def.model
  }
}

function cancel() {
  close()
  initFormData()
}

function confirm() {
  ruleFormRef.value?.validate((valid: boolean) => {
    if (valid) {
      close()
      setLocalConfig({ ...ruleForm })
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
  rulesRef.value.api[0].message = t('ai.apiValidateTip')
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
