/**
 * @file vue.ts
 * @description Vue 3 bindings for mention-editor.
 *
 * Two integration paths:
 *
 * ## 1. Drop-in component (quick start)
 * ```vue
 * <script setup lang="ts">
 * import { MentionInput } from 'mention-editor/vue';
 * </script>
 *
 * <template>
 *   <MentionInput :users="users" placeholder="Write…" @submit="save" />
 * </template>
 * ```
 *
 * ## 2. Composable (BYO container — full control)
 * ```vue
 * <script setup lang="ts">
 * import { useMentionEditor } from 'mention-editor/vue';
 *
 * const editor = useMentionEditor({
 *   get users() { return userList.value; }, // reactive getter
 *   onSubmit: save,
 * });
 * </script>
 *
 * <template>
 *   <!-- attach containerRef to any element: native, Element Plus, Vuetify… -->
 *   <el-input :ref="editor.containerRef" />
 * </template>
 * ```
 */

import {
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  ref,
  watch,
  type PropType,
  type Ref,
} from 'vue';

import {
  createMentionEditor,
  type EditorNode,
  type MentionEditorInstance,
  type MentionEditorOptions,
  type MentionUser,
} from './mention-editor';
import { buildEditorOpts } from './_build-opts';

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type {
  EditorNode,
  MentionEditorInstance,
  MentionEditorOptions,
  MentionNode,
  MentionUser,
  TextNode,
} from './mention-editor';

export {
  DEFAULT_MENTION_PALETTE,
  renderCommentMessage,
  renderCommentMessageToHTML,
  serializeToMarkdown,
  serializeToText,
} from './mention-editor';

// ─── Shared types ─────────────────────────────────────────────────────────────

export type MentionBindingOptions = Omit<MentionEditorOptions, 'container'> & {
  defaultNodes?: EditorNode[];
};

// ─── useMentionEditor ─────────────────────────────────────────────────────────

export interface UseMentionEditorReturn {
  /**
   * Attach to any element with `:ref="editor.containerRef"`.
   * Works with native elements and component libraries that forward refs.
   */
  containerRef: Ref<HTMLDivElement | null>;
  getNodes: () => EditorNode[];
  setNodes: (nodes: EditorNode[], emit?: boolean) => void;
  clear: () => void;
  focus: () => void;
  setPlaceholder: (text: string) => void;
}

/**
 * Headless composable — you own the container element.
 *
 * @example
 * ```ts
 * const editor = useMentionEditor({
 *   get users() { return users.value; }, // reactive getter
 *   onChange: (nodes) => (value.value = nodes),
 * });
 * ```
 */
export function useMentionEditor(
  opts: MentionBindingOptions,
): UseMentionEditorReturn {
  const containerRef = ref<HTMLDivElement | null>(null);
  const instanceRef = ref<MentionEditorInstance | null>(null);

  // Plain mutable ref — keeps callbacks live without triggering Vue reactivity.
  const optsRef = { current: opts };

  onMounted(() => {
    optsRef.current = opts;
    if (!containerRef.value) return;

    const editor = createMentionEditor(
      buildEditorOpts(containerRef.value, opts, {
        getUsers: () => optsRef.current.users,
        onChange: (nodes) => optsRef.current.onChange?.(nodes),
        onSubmit: (nodes) => optsRef.current.onSubmit?.(nodes),
      }),
    );

    instanceRef.value = editor;

    if (opts.defaultNodes?.length) {
      editor.setNodes(opts.defaultNodes);
    }
  });

  onUnmounted(() => {
    instanceRef.value?.destroy();
    instanceRef.value = null;
  });

  // Sync placeholder when it changes reactively.
  watch(
    () => opts.placeholder,
    (p) => {
      if (p !== undefined) instanceRef.value?.setPlaceholder(p);
    },
  );

  return {
    containerRef,
    getNodes: () => instanceRef.value?.getNodes() ?? [],
    setNodes: (nodes, emit) => instanceRef.value?.setNodes(nodes, emit),
    clear: () => instanceRef.value?.clear(),
    focus: () => instanceRef.value?.focus(),
    setPlaceholder: (text) => instanceRef.value?.setPlaceholder(text),
  };
}

// ─── MentionInput component ───────────────────────────────────────────────────

/**
 * Drop-in Vue 3 component. Renders a single unstyled `<div>`.
 *
 * **Emits:** `change(nodes: EditorNode[])`, `submit(nodes: EditorNode[])`
 * **Exposes:** `getNodes`, `setNodes`, `clear`, `focus`, `setPlaceholder`
 *
 * @example
 * ```vue
 * <MentionInput
 *   :users="users"
 *   placeholder="Write a comment…"
 *   class="rounded border p-2"
 *   @submit="onSubmit"
 * />
 * ```
 *
 * @example Imperative access via template ref
 * ```vue
 * <MentionInput ref="editorRef" :users="users" />
 * <!-- editorRef.value.clear() -->
 * ```
 */
export const MentionInput = defineComponent({
  name: 'MentionInput',

  props: {
    users: { type: Array as PropType<MentionUser[]>, required: true },
    placeholder: { type: String, default: undefined },
    maxSuggestions: { type: Number, default: undefined },
    disabled: { type: Boolean, default: undefined },
    palette: { type: Array as PropType<string[]>, default: undefined },
    defaultNodes: { type: Array as PropType<EditorNode[]>, default: undefined },
    // popoverPosition and renderUser are advanced options; reach for the
    // composable if you need them.
  },

  emits: {
    change: (_nodes: EditorNode[]) => true,
    submit: (_nodes: EditorNode[]) => true,
  },

  setup(props, { emit, expose, attrs }) {
    const containerRef = ref<HTMLDivElement | null>(null);
    const instanceRef = ref<MentionEditorInstance | null>(null);

    onMounted(() => {
      if (!containerRef.value) return;

      // Build options imperatively to satisfy exactOptionalPropertyTypes —
      // Vue's LooseRequired<props> differs from our LooseOpts type.
      const editorOpts: MentionEditorOptions = {
        container: containerRef.value,
        get users() {
          return props.users;
        },
        onChange: (nodes) => emit('change', nodes),
        onSubmit: (nodes) => emit('submit', nodes),
      };
      if (props.placeholder !== undefined)
        editorOpts.placeholder = props.placeholder;
      if (props.maxSuggestions !== undefined)
        editorOpts.maxSuggestions = props.maxSuggestions;
      if (props.disabled !== undefined) editorOpts.disabled = props.disabled;
      if (props.palette !== undefined) editorOpts.palette = props.palette;

      const editor = createMentionEditor(editorOpts);

      instanceRef.value = editor;

      if (props.defaultNodes?.length) {
        editor.setNodes(props.defaultNodes);
      }
    });

    onUnmounted(() => {
      instanceRef.value?.destroy();
      instanceRef.value = null;
    });

    watch(
      () => props.placeholder,
      (p) => {
        if (p !== undefined) instanceRef.value?.setPlaceholder(p);
      },
    );

    // Expose instance API via template ref.
    expose({
      getNodes: () => instanceRef.value?.getNodes() ?? [],
      setNodes: (nodes: EditorNode[], emitChange?: boolean) =>
        instanceRef.value?.setNodes(nodes, emitChange),
      clear: () => instanceRef.value?.clear(),
      focus: () => instanceRef.value?.focus(),
      setPlaceholder: (text: string) => instanceRef.value?.setPlaceholder(text),
    });

    // Render a plain div, forwarding any extra attrs (class, style, data-*, etc.)
    return () => h('div', { ref: containerRef, ...attrs });
  },
});
