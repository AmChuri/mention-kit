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
  type EditorNode,
  type MentionEditorInstance,
  type MentionEditorOptions,
  type MentionUser,
} from './mention-editor';
import { buildEditorOpts } from './_build-opts';

// ─── Re-exports ───────────────────────────────────────────────────────────────

export type {
  EditorCallbackMeta,
  EditorNode,
  MentionEditorInstance,
  MentionEditorOptions,
  MentionNode,
  MentionUser,
  TextNode,
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

// ─── Shared types ─────────────────────────────────────────────────────────────

export type MentionBindingOptions = Omit<MentionEditorOptions, 'container'> & {
  /** Initial content as `EditorNode[]`. Mutually exclusive with `defaultValue`. */
  defaultNodes?: EditorNode[];
  /** Initial content as a persisted `@{userId}` string. Parsed using the `users` list. */
  defaultValue?: string;
};

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

    // Seed initial content from defaultNodes or defaultValue
    if (opts.defaultNodes?.length) {
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

      if (defaultNodes?.length) {
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
  className?: string;
  style?: CSSProperties;
}

/**
 * Renders a stored `@{userId}` message as a React element with styled
 * mention chips. Replaces `dangerouslySetInnerHTML` with a safe, typed component.
 *
 * @example
 * ```tsx
 * <RenderedMessage message="Hey @{u1}!" users={users} />
 * ```
 */
export function RenderedMessage({
  message,
  users,
  palette,
  className,
  style,
}: RenderedMessageProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';
    const parts = renderCommentMessage(message, users, palette);
    for (const part of parts) {
      ref.current.appendChild(
        typeof part === 'string' ? document.createTextNode(part) : part,
      );
    }
  }, [message, users, palette]);

  return <span ref={ref} className={className} style={style} />;
}
