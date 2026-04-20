/**
 * @file react.tsx
 * @description React bindings for @cursortag/mention-kit.
 *
 * Two integration paths:
 *
 * ## 1. Drop-in component (quick start)
 * ```tsx
 * import { MentionInput } from '@cursortag/mention-kit/react';
 *
 * <MentionInput
 *   users={users}
 *   placeholder="Write a comment…"
 *   onSubmit={(nodes) => save(nodes)}
 *   className="my-editor"        // style with Tailwind / CSS-in-JS / MUI sx
 * />
 * ```
 *
 * ## 2. Hook (BYO container — full control)
 * ```tsx
 * import { useMentionEditor } from '@cursortag/mention-kit/react';
 *
 * function MyEditor() {
 *   const editor = useMentionEditor({ users, onSubmit: save });
 *   return (
 *     // attach containerRef to any element — works with MUI, shadcn, etc.
 *     <Box ref={editor.containerRef} sx={{ border: 1, p: 1, minHeight: 48 }} />
 *   );
 * }
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
  type EditorNode,
  type MentionEditorInstance,
  type MentionEditorOptions,
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
  /**
   * Initial content. Reactive updates after mount must use
   * `editor.setNodes()` / `ref.current.setNodes()`.
   */
  defaultNodes?: EditorNode[];
};

// ─── useMentionEditor ─────────────────────────────────────────────────────────

export interface UseMentionEditorReturn {
  /**
   * Attach to whatever element you want as the editor container.
   * ```tsx
   * <Box ref={editor.containerRef} />          // MUI
   * <div ref={editor.containerRef} />          // plain HTML
   * ```
   */
  containerRef: Ref<HTMLDivElement>;
  getNodes: () => EditorNode[];
  setNodes: (nodes: EditorNode[], emit?: boolean) => void;
  clear: () => void;
  focus: () => void;
  setPlaceholder: (text: string) => void;
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

  // Keep a live ref so callbacks always see the latest props without
  // needing to recreate the editor on every render.
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (!containerRef.current) return;

    const instance = createMentionEditor(
      buildEditorOpts(containerRef.current, opts, {
        getUsers: () => optsRef.current.users,
        onChange: (nodes) => optsRef.current.onChange?.(nodes),
        onSubmit: (nodes) => optsRef.current.onSubmit?.(nodes),
      }),
    );

    instanceRef.current = instance;

    if (opts.defaultNodes?.length) {
      instance.setNodes(opts.defaultNodes);
    }

    return () => {
      instance.destroy();
      instanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync placeholder when the prop changes after mount.
  useEffect(() => {
    if (opts.placeholder !== undefined) {
      instanceRef.current?.setPlaceholder(opts.placeholder);
    }
  }, [opts.placeholder]);

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

  return { containerRef, getNodes, setNodes, clear, focus, setPlaceholder };
}

// ─── MentionInput ─────────────────────────────────────────────────────────────

export interface MentionInputProps extends MentionBindingOptions {
  /** Any Tailwind / CSS-in-JS class. */
  className?: string;
  style?: CSSProperties;
}

/**
 * Drop-in React component. Renders a single unstyled `<div>` — style freely.
 * Forward a ref to get imperative access (`ref.current.clear()`, etc.).
 *
 * @example Tailwind
 * ```tsx
 * <MentionInput users={users} className="rounded border p-2 min-h-[48px]" />
 * ```
 *
 * @example MUI
 * ```tsx
 * const ref = useRef<MentionEditorInstance>(null);
 * <MentionInput ref={ref} users={users} />
 * ref.current?.clear();
 * ```
 */
export const MentionInput = forwardRef<
  MentionEditorInstance,
  MentionInputProps
>(({ className, style, defaultNodes, ...editorOpts }, forwardedRef) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<MentionEditorInstance | null>(null);
  const optsRef = useRef(editorOpts);
  optsRef.current = editorOpts;

  useEffect(() => {
    if (!containerRef.current) return;

    const instance = createMentionEditor(
      buildEditorOpts(containerRef.current, editorOpts, {
        getUsers: () => optsRef.current.users,
        onChange: (nodes) => optsRef.current.onChange?.(nodes),
        onSubmit: (nodes) => optsRef.current.onSubmit?.(nodes),
      }),
    );

    instanceRef.current = instance;

    if (defaultNodes?.length) {
      instance.setNodes(defaultNodes);
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

  useImperativeHandle(
    forwardedRef,
    () => ({
      getNodes: () => instanceRef.current?.getNodes() ?? [],
      setNodes: (nodes, emit) => instanceRef.current?.setNodes(nodes, emit),
      focus: () => instanceRef.current?.focus(),
      clear: () => instanceRef.current?.clear(),
      destroy: () => instanceRef.current?.destroy(),
      setPlaceholder: (text) => instanceRef.current?.setPlaceholder(text),
    }),
    [],
  );

  return <div ref={containerRef} className={className} style={style} />;
});

MentionInput.displayName = 'MentionInput';
