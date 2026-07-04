/**
 * @file vue.ts
 * @description Vue 3 bindings for @cursortag/mention-kit.
 *
 * ## 1. Drop-in component
 * ```vue
 * <MentionInput :users="users" @submit="(text) => save(text)" />
 * ```
 *
 * ## 2. Composable (BYO container)
 * ```vue
 * const editor = useMentionEditor({ get users() { return list.value; } });
 * <div :ref="editor.containerRef" />
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
  parsePersist,
  serializeToPersist,
  type EditorCallbackMeta,
  type EditorNode,
  type MentionEditorInstance,
  type MentionEditorOptions,
  type MentionItem,
  type MentionTrigger,
  type MentionUser,
  type TriggerItems,
} from './mention-editor';
import type { MentionTheme } from './theme';
import { buildEditorOpts } from './_build-opts';

/** @internal Static item lists for non-`@` triggers, for parsing a controlled value. */
function deriveTriggerItems(
  triggers?: MentionTrigger[],
): TriggerItems[] | undefined {
  const arr = triggers
    ?.filter((t) => t.trigger !== '@' && Array.isArray(t.items))
    .map((t) => ({ trigger: t.trigger, items: t.items as MentionItem[] }));
  return arr && arr.length ? arr : undefined;
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type {
  EditorCallbackMeta,
  EditorNode,
  MentionEditorInstance,
  MentionEditorOptions,
  MentionItem,
  MentionNode,
  MentionTrigger,
  MentionUser,
  MentionUserDetail,
  TextNode,
  TriggerActionContext,
  TriggerItems,
} from './mention-editor';

export {
  DEFAULT_MENTION_PALETTE,
  parsePersist,
  renderCommentMessage,
  renderCommentMessageToHTML,
  serializeToMarkdown,
  serializeToPersist,
  serializeToText,
} from './mention-editor';

export { attachHovercards } from './hovercard';
export type { HovercardOptions } from './hovercard';
export { resolveThemeVars, applyTheme } from './theme';
export type { MentionTheme } from './theme';

// ─── Shared types ─────────────────────────────────────────────────────────────

export type MentionBindingOptions = Omit<MentionEditorOptions, 'container'> & {
  defaultNodes?: EditorNode[];
  /** Initial content as a persisted `@{userId}` string. */
  defaultValue?: string;
  /** Controlled persisted value (`@{id}` token string); re-syncs on change. */
  value?: string;
};

// ─── useMentionEditor ─────────────────────────────────────────────────────────

export interface UseMentionEditorReturn {
  containerRef: Ref<HTMLDivElement | null>;
  getNodes: () => EditorNode[];
  setNodes: (nodes: EditorNode[], emit?: boolean) => void;
  clear: () => void;
  focus: () => void;
  setPlaceholder: (text: string) => void;
  setDisabled: (value: boolean) => void;
  readonly el: HTMLElement | null;
}

export function useMentionEditor(
  opts: MentionBindingOptions,
): UseMentionEditorReturn {
  const containerRef = ref<HTMLDivElement | null>(null);
  const instanceRef = ref<MentionEditorInstance | null>(null);

  const optsRef = { current: opts };

  onMounted(() => {
    optsRef.current = opts;
    if (!containerRef.value) return;

    const editor = createMentionEditor(
      buildEditorOpts(containerRef.value, opts, {
        getUsers: () => optsRef.current.users,
        onChange: (text, meta) => optsRef.current.onChange?.(text, meta),
        onSubmit: (text, meta) => optsRef.current.onSubmit?.(text, meta),
      }),
    );

    instanceRef.value = editor;

    if (opts.value !== undefined) {
      editor.setNodes(
        parsePersist(opts.value, opts.users, deriveTriggerItems(opts.triggers)),
      );
    } else if (opts.defaultNodes?.length) {
      editor.setNodes(opts.defaultNodes);
    } else if (opts.defaultValue) {
      editor.setNodes(parsePersist(opts.defaultValue, opts.users));
    }
  });

  onUnmounted(() => {
    instanceRef.value?.destroy();
    instanceRef.value = null;
  });

  watch(
    () => opts.placeholder,
    (p) => {
      if (p !== undefined) instanceRef.value?.setPlaceholder(p);
    },
  );

  watch(
    () => opts.disabled,
    (d) => {
      instanceRef.value?.setDisabled(!!d);
    },
  );

  // Controlled value — re-seed only on genuine external changes.
  watch(
    () => opts.value,
    (v) => {
      const inst = instanceRef.value;
      if (!inst || v === undefined) return;
      if (serializeToPersist(inst.getNodes()) !== v) {
        inst.setNodes(
          parsePersist(v, opts.users, deriveTriggerItems(opts.triggers)),
        );
      }
    },
  );

  return {
    containerRef,
    getNodes: () => instanceRef.value?.getNodes() ?? [],
    setNodes: (nodes, emit) => instanceRef.value?.setNodes(nodes, emit),
    clear: () => instanceRef.value?.clear(),
    focus: () => instanceRef.value?.focus(),
    setPlaceholder: (text) => instanceRef.value?.setPlaceholder(text),
    setDisabled: (value) => instanceRef.value?.setDisabled(value),
    get el() {
      return instanceRef.value?.el ?? null;
    },
  };
}

// ─── MentionInput component ───────────────────────────────────────────────────

export const MentionInput = defineComponent({
  name: 'MentionInput',

  props: {
    users: { type: Array as PropType<MentionUser[]>, required: true },
    placeholder: { type: String, default: undefined },
    maxSuggestions: { type: Number, default: undefined },
    disabled: { type: Boolean, default: undefined },
    palette: { type: Array as PropType<string[]>, default: undefined },
    triggers: { type: Array as PropType<MentionTrigger[]>, default: undefined },
    theme: { type: Object as PropType<MentionTheme>, default: undefined },
    defaultNodes: {
      type: Array as PropType<EditorNode[]>,
      default: undefined,
    },
    defaultValue: { type: String, default: undefined },
    value: { type: String, default: undefined },
  },

  emits: {
    change: (_text: string, _meta: EditorCallbackMeta) => true,
    submit: (_text: string, _meta: EditorCallbackMeta) => true,
    focus: () => true,
    blur: () => true,
  },

  setup(props, { emit, expose, attrs }) {
    const containerRef = ref<HTMLDivElement | null>(null);
    const instanceRef = ref<MentionEditorInstance | null>(null);

    onMounted(() => {
      if (!containerRef.value) return;

      const editorOpts: MentionEditorOptions = {
        container: containerRef.value,
        get users() {
          return props.users;
        },
        onChange: (text, meta) => emit('change', text, meta),
        onSubmit: (text, meta) => emit('submit', text, meta),
        onFocus: () => emit('focus'),
        onBlur: () => emit('blur'),
      };
      if (props.placeholder !== undefined)
        editorOpts.placeholder = props.placeholder;
      if (props.maxSuggestions !== undefined)
        editorOpts.maxSuggestions = props.maxSuggestions;
      if (props.disabled !== undefined) editorOpts.disabled = props.disabled;
      if (props.palette !== undefined) editorOpts.palette = props.palette;
      if (props.triggers !== undefined) editorOpts.triggers = props.triggers;
      if (props.theme !== undefined) editorOpts.theme = props.theme;

      const editor = createMentionEditor(editorOpts);
      instanceRef.value = editor;

      if (props.value !== undefined) {
        editor.setNodes(
          parsePersist(
            props.value,
            props.users,
            deriveTriggerItems(props.triggers),
          ),
        );
      } else if (props.defaultNodes?.length) {
        editor.setNodes(props.defaultNodes);
      } else if (props.defaultValue) {
        editor.setNodes(parsePersist(props.defaultValue, props.users));
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

    watch(
      () => props.disabled,
      (d) => {
        if (d !== undefined) instanceRef.value?.setDisabled(d);
      },
    );

    // Controlled value — re-seed only on genuine external changes.
    watch(
      () => props.value,
      (v) => {
        const inst = instanceRef.value;
        if (!inst || v === undefined) return;
        if (serializeToPersist(inst.getNodes()) !== v) {
          inst.setNodes(
            parsePersist(v, props.users, deriveTriggerItems(props.triggers)),
          );
        }
      },
    );

    expose({
      getNodes: () => instanceRef.value?.getNodes() ?? [],
      setNodes: (nodes: EditorNode[], emitChange?: boolean) =>
        instanceRef.value?.setNodes(nodes, emitChange),
      clear: () => instanceRef.value?.clear(),
      focus: () => instanceRef.value?.focus(),
      setPlaceholder: (text: string) => instanceRef.value?.setPlaceholder(text),
      setDisabled: (value: boolean) => instanceRef.value?.setDisabled(value),
      get el() {
        return instanceRef.value?.el ?? null;
      },
    });

    return () => h('div', { ref: containerRef, ...attrs });
  },
});
