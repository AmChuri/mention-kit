/**
 * @file react.tsx
 * @description React bindings for @cursortag/mention-kit.
 *
 * ## 1. Drop-in component
 * ```tsx
 * <MentionInput users={users} onSubmit={(text) => save(text)} />
 * ```
 *
 * ## 2. Hook (BYO container)
 * ```tsx
 * const editor = useMentionEditor({ users, onSubmit: (text) => save(text) });
 * <Box ref={editor.containerRef} />
 * ```
 *
 * ## 3. Rendered message (display stored comments)
 * ```tsx
 * <RenderedMessage message="Hey @{u1}!" users={users} />
 * ```
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type CSSProperties,
  type Ref,
} from 'react';

import {
  createMentionEditor,
  parsePersist,
  renderCommentMessage,
  serializeToPersist,
  type EditorNode,
  type MentionEditorInstance,
  type MentionEditorOptions,
  type MentionItem,
  type MentionTrigger,
  type MentionUser,
  type TriggerItems,
} from './mention-editor';
import { attachHovercards, type HovercardOptions } from './hovercard';
import { applyTheme, type MentionTheme } from './theme';
import { buildEditorOpts } from './_build-opts';

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
  /** Initial content as `EditorNode[]`. Mutually exclusive with `defaultValue`. */
  defaultNodes?: EditorNode[];
  /** Initial content as a persisted `@{userId}` string. Parsed using the `users` list. */
  defaultValue?: string;
  /**
   * Controlled persisted value (`@{id}` token string). When set, the editor
   * re-syncs whenever `value` changes to something other than its current
   * content — pair it with `onChange` + `serializeToPersist`.
   */
  value?: string;
};

/** @internal Static item lists for non-`@` triggers, for parsing a controlled value. */
function deriveTriggerItems(
  triggers?: MentionTrigger[],
): TriggerItems[] | undefined {
  const arr = triggers
    ?.filter((t) => t.trigger !== '@' && Array.isArray(t.items))
    .map((t) => ({ trigger: t.trigger, items: t.items as MentionItem[] }));
  return arr && arr.length ? arr : undefined;
}

// ─── useMentionEditor ─────────────────────────────────────────────────────────

export interface UseMentionEditorReturn {
  containerRef: Ref<HTMLDivElement>;
  getNodes: () => EditorNode[];
  setNodes: (nodes: EditorNode[], emit?: boolean) => void;
  clear: () => void;
  focus: () => void;
  setPlaceholder: (text: string) => void;
  setDisabled: (value: boolean) => void;
  /** The underlying contentEditable DOM element. */
  readonly el: HTMLElement | null;
}

/**
 * Headless hook — you own the container element.
 * Ideal for MUI, shadcn, Radix, or any wrapper where you control the markup.
 */
export function useMentionEditor(
  opts: MentionBindingOptions,
): UseMentionEditorReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<MentionEditorInstance | null>(null);

  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (!containerRef.current) return;

    const instance = createMentionEditor(
      buildEditorOpts(containerRef.current, opts, {
        getUsers: () => optsRef.current.users,
        onChange: (text, meta) => optsRef.current.onChange?.(text, meta),
        onSubmit: (text, meta) => optsRef.current.onSubmit?.(text, meta),
      }),
    );

    instanceRef.current = instance;

    // Seed initial content from value (controlled), defaultNodes, or defaultValue
    if (opts.value !== undefined) {
      instance.setNodes(
        parsePersist(opts.value, opts.users, deriveTriggerItems(opts.triggers)),
      );
    } else if (opts.defaultNodes?.length) {
      instance.setNodes(opts.defaultNodes);
    } else if (opts.defaultValue) {
      instance.setNodes(parsePersist(opts.defaultValue, opts.users));
    }

    return () => {
      instance.destroy();
      instanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (opts.placeholder !== undefined) {
      instanceRef.current?.setPlaceholder(opts.placeholder);
    }
  }, [opts.placeholder]);

  useEffect(() => {
    instanceRef.current?.setDisabled(!!opts.disabled);
  }, [opts.disabled]);

  // Controlled value — re-seed only on genuine external changes.
  useEffect(() => {
    const inst = instanceRef.current;
    const o = optsRef.current;
    if (!inst || o.value === undefined) return;
    if (serializeToPersist(inst.getNodes()) !== o.value) {
      inst.setNodes(
        parsePersist(o.value, o.users, deriveTriggerItems(o.triggers)),
      );
    }
  }, [opts.value]);

  const getNodes = useCallback(() => instanceRef.current?.getNodes() ?? [], []);
  const setNodes = useCallback(
    (nodes: EditorNode[], emit?: boolean) =>
      instanceRef.current?.setNodes(nodes, emit),
    [],
  );
  const clear = useCallback(() => instanceRef.current?.clear(), []);
  const focus = useCallback(() => instanceRef.current?.focus(), []);
  const setPlaceholder = useCallback(
    (text: string) => instanceRef.current?.setPlaceholder(text),
    [],
  );
  const setDisabled = useCallback(
    (value: boolean) => instanceRef.current?.setDisabled(value),
    [],
  );

  return {
    containerRef,
    getNodes,
    setNodes,
    clear,
    focus,
    setPlaceholder,
    setDisabled,
    get el() {
      return instanceRef.current?.el ?? null;
    },
  };
}

// ─── MentionInput ─────────────────────────────────────────────────────────────

export interface MentionInputProps extends MentionBindingOptions {
  className?: string;
  style?: CSSProperties;
}

/**
 * Drop-in React component. Renders a single unstyled `<div>` — style freely.
 * Forward a ref to get imperative access (`ref.current.clear()`, etc.).
 */
export const MentionInput = forwardRef<
  MentionEditorInstance,
  MentionInputProps
>(
  (
    { className, style, defaultNodes, defaultValue, ...editorOpts },
    forwardedRef,
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<MentionEditorInstance | null>(null);
    const optsRef = useRef(editorOpts);
    optsRef.current = editorOpts;

    useEffect(() => {
      if (!containerRef.current) return;

      const instance = createMentionEditor(
        buildEditorOpts(containerRef.current, editorOpts, {
          getUsers: () => optsRef.current.users,
          onChange: (text, meta) => optsRef.current.onChange?.(text, meta),
          onSubmit: (text, meta) => optsRef.current.onSubmit?.(text, meta),
        }),
      );

      instanceRef.current = instance;

      if (editorOpts.value !== undefined) {
        instance.setNodes(
          parsePersist(
            editorOpts.value,
            editorOpts.users,
            deriveTriggerItems(editorOpts.triggers),
          ),
        );
      } else if (defaultNodes?.length) {
        instance.setNodes(defaultNodes);
      } else if (defaultValue) {
        instance.setNodes(parsePersist(defaultValue, editorOpts.users));
      }

      return () => {
        instance.destroy();
        instanceRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (editorOpts.placeholder !== undefined) {
        instanceRef.current?.setPlaceholder(editorOpts.placeholder);
      }
    }, [editorOpts.placeholder]);

    useEffect(() => {
      instanceRef.current?.setDisabled(!!editorOpts.disabled);
    }, [editorOpts.disabled]);

    // Controlled value — re-seed only on genuine external changes.
    useEffect(() => {
      const inst = instanceRef.current;
      const o = optsRef.current;
      if (!inst || o.value === undefined) return;
      if (serializeToPersist(inst.getNodes()) !== o.value) {
        inst.setNodes(
          parsePersist(o.value, o.users, deriveTriggerItems(o.triggers)),
        );
      }
    }, [editorOpts.value]);

    useImperativeHandle(
      forwardedRef,
      () => ({
        getNodes: () => instanceRef.current?.getNodes() ?? [],
        setNodes: (nodes, emit) => instanceRef.current?.setNodes(nodes, emit),
        focus: () => instanceRef.current?.focus(),
        clear: () => instanceRef.current?.clear(),
        destroy: () => instanceRef.current?.destroy(),
        setPlaceholder: (text) => instanceRef.current?.setPlaceholder(text),
        setDisabled: (value) => instanceRef.current?.setDisabled(value),
        get el() {
          return instanceRef.current?.el as HTMLElement;
        },
      }),
      [],
    );

    return <div ref={containerRef} className={className} style={style} />;
  },
);

MentionInput.displayName = 'MentionInput';

// ─── RenderedMessage ──────────────────────────────────────────────────────────

export interface RenderedMessageProps {
  /** Stored message in `@{userId}` format. */
  message: string;
  /** Users list for resolving mention IDs to names/colors. */
  users: MentionUser[];
  /** Optional custom palette. */
  palette?: string[];
  /**
   * Item lists for non-`@` triggers, so tokens like `#{id}` resolve to names.
   * The `@` trigger resolves from `users`.
   */
  triggerItems?: TriggerItems[];
  /**
   * Enable hover user-info cards on each mention. Pass `true` for defaults or a
   * {@link HovercardOptions} object to configure copy buttons, delays, etc.
   */
  hovercard?: boolean | HovercardOptions;
  /** Theme applied to the chips and (when enabled) the hovercard. */
  theme?: MentionTheme;
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders a stored `@{userId}` message as a React element with styled
 * mention chips. Replaces `dangerouslySetInnerHTML` with a safe, typed component.
 *
 * Pass `hovercard` to pop a user-info card (avatar, meta, copyable fields) when
 * a mention is hovered. Memoize object props (`users`, `hovercard`, `theme`) to
 * avoid re-attaching on every render.
 *
 * @example
 * ```tsx
 * <RenderedMessage message="Hey @{u1}!" users={users} hovercard theme={{ preset: 'dark' }} />
 * ```
 */
export function RenderedMessage({
  message,
  users,
  palette,
  triggerItems,
  hovercard,
  theme,
  className,
  style,
}: RenderedMessageProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.innerHTML = '';
    applyTheme(host, theme);
    const parts = renderCommentMessage(message, users, palette, triggerItems);
    for (const part of parts) {
      host.appendChild(
        typeof part === 'string' ? document.createTextNode(part) : part,
      );
    }
    if (!hovercard) return;
    const hcOpts: HovercardOptions =
      typeof hovercard === 'object' ? { ...hovercard } : {};
    if (theme !== undefined && hcOpts.theme === undefined) hcOpts.theme = theme;
    // Resolve hovercards across all triggers, not just `@`.
    const allItems = [
      ...users,
      ...(triggerItems?.flatMap((t) => t.items) ?? []),
    ];
    return attachHovercards(host, allItems, hcOpts);
  }, [message, users, palette, triggerItems, hovercard, theme]);

  return <span ref={ref} className={className} style={style} />;
}
