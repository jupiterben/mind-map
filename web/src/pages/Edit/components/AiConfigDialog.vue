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
        <p class="title">{{ $t('ai.VolcanoArkLargeModelConfiguration') }}</p>
        <p class="desc">
          {{ $t('ai.configTip') }}<a href="https://mp.weixin.qq.com/s/JNb7PH4sCjWzIZ9G8wStGQ" target="_blank">{{ $t('ai.course') }}</a>。
        </p>
        <el-form-item label="API Key" prop="key">
          <el-input v-model="ruleForm.key"></el-input>
        </el-form-item>
        <el-form-item :label="$t('ai.inferenceAccessPoint')" prop="model">
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
const ruleForm = reactive({
  api: '',
  key: '',
  model: '',
  port: '',
  method: ''
})

const rulesRef = ref({
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
  Object.keys(config).forEach((key) => {
    ;(ruleForm as any)[key] = config[key]
  })
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
