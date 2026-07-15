<template>
  <div class="flex flex-col group relative transition-all border border-slate-200 bg-white rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-slate-100 focus-within:border-slate-400" :style="{ minHeight: minHeight + 'px' }">
    <Suspense>
      <template #default>
        <component
          :is="ToolbarComponent"
          class="border-b border-slate-100 bg-slate-50/50 px-2 py-1"
          :editor="editorRef"
          :defaultConfig="toolbarConfig"
          :mode="mode"
        />
        <component
          :is="EditorComponent"
          style="flex: 1; overflow-y: auto;"
          v-model="valueHtml"
          :defaultConfig="editorConfig"
          :mode="mode"
          @onCreated="handleCreated"
          @onChange="handleChange"
          class="custom-editor px-4 py-2"
        />
      </template>
      <template #fallback>
        <div class="flex flex-1 items-center justify-center text-sm text-slate-400">
          正在加载编辑器…
        </div>
      </template>
    </Suspense>
  </div>
</template>

<script setup>
import { defineAsyncComponent, onBeforeUnmount, ref, shallowRef, watch } from 'vue'

let editorModulePromise
function loadEditorModule() {
  if (!editorModulePromise) {
    editorModulePromise = Promise.all([
      import('@wangeditor/editor-for-vue'),
      import('@wangeditor/editor/dist/css/style.css')
    ]).then(([module]) => module)
  }
  return editorModulePromise
}

const EditorComponent = defineAsyncComponent(() => loadEditorModule().then(({ Editor }) => Editor))
const ToolbarComponent = defineAsyncComponent(() => loadEditorModule().then(({ Toolbar }) => Toolbar))

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '请输入内容...'
  },
  minHeight: {
    type: Number,
    default: 300
  }
})

const emit = defineEmits(['update:modelValue'])

const editorRef = shallowRef()
const valueHtml = ref(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  if (newVal !== valueHtml.value) {
    valueHtml.value = newVal
  }
})

const mode = 'simple'

const toolbarConfig = {
  toolbarKeys: [
    'bold',
    'underline',
    'color',
    '|',
    'bulletedList',
    'numberedList',
    '|',
    'undo',
    'redo'
  ]
}

const editorConfig = {
  placeholder: props.placeholder
}

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})

const handleCreated = (editor) => {
  editorRef.value = editor
}

const handleChange = (editor) => {
  emit('update:modelValue', editor.getHtml())
}
</script>

<style>
/* 调整编辑器内部的基础样式，使其更贴近 A4 排版风格 */
.custom-editor .w-e-text-container {
  padding: 0.5rem 0;
  outline: none !important;
}
.custom-editor .w-e-text {
  font-size: 1.125rem;
  line-height: 1.8;
  color: #334155;
}
.custom-editor .w-e-text p {
  margin-bottom: 0.5rem;
}
</style>
