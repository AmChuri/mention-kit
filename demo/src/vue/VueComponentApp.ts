import { defineComponent, h, ref } from 'vue';
import {
  MentionInput,
  serializeToText,
  type EditorNode,
  type MentionEditorInstance,
} from '@cursortag/mention-kit/vue';
import { USERS } from '../data';

export const VueComponentApp = defineComponent({
  name: 'VueComponentApp',
  setup() {
    const editorRef = ref<MentionEditorInstance | null>(null);
    const output = ref('');

    const onSubmit = (nodes: EditorNode[]) => {
      output.value = serializeToText(nodes);
      editorRef.value?.clear();
    };

    const loadDraft = () => {
      editorRef.value?.setNodes([
        { type: 'text', text: 'Hey ' },
        { type: 'mention', user: USERS[2]!, displayName: 'Carol White' },
        { type: 'text', text: ', can you check this?' },
      ]);
    };

    return () =>
      h('div', { class: 'demo-live' }, [
        h(MentionInput, {
          ref: editorRef,
          users: USERS,
          placeholder: 'Write a comment… (type @ to mention)',
          class: 'demo-editor',
          onSubmit,
        }),
        h('div', { class: 'demo-actions' }, [
          h(
            'button',
            { class: 'btn-ghost', onClick: () => editorRef.value?.clear() },
            'Clear',
          ),
          h('button', { class: 'btn-ghost', onClick: loadDraft }, 'Load draft'),
        ]),
        output.value
          ? h('div', { class: 'demo-output' }, [
              h('span', { class: 'output-label' }, 'submitted'),
              h('code', output.value),
            ])
          : null,
      ]);
  },
});
