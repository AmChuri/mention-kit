import { defineComponent, h, ref } from 'vue';
import {
  MentionInput,
  renderCommentMessageToHTML,
  serializeToPersist,
  type EditorCallbackMeta,
  type MentionEditorInstance,
} from '@cursortag/mention-kit/vue';
import { USERS } from '../data';

export const VueComponentApp = defineComponent({
  name: 'VueComponentApp',
  setup() {
    const editorRef = ref<MentionEditorInstance | null>(null);
    const submitted = ref('');

    const onSubmit = (_text: string, meta: EditorCallbackMeta) => {
      submitted.value = serializeToPersist(meta.nodes);
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
        submitted.value
          ? h('div', { class: 'demo-output' }, [
              h('span', { class: 'output-label' }, 'rendered'),
              // renderCommentMessageToHTML escapes text — safe to set as innerHTML.
              h('div', {
                innerHTML: renderCommentMessageToHTML(submitted.value, USERS),
              }),
              h(
                'span',
                { class: 'output-label', style: 'margin-top:8px' },
                'stored',
              ),
              h('code', submitted.value),
            ])
          : null,
      ]);
  },
});
