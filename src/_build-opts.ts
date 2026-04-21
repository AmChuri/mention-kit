/**
 * @internal
 * Builds a MentionEditorOptions object without passing `undefined` for
 * optional properties — required by `exactOptionalPropertyTypes: true`.
 */

import {
  type EditorCallbackMeta,
  type EditorNode,
  type MentionEditorOptions,
  type MentionUser,
} from './mention-editor';

export interface BindingCallbacks {
  getUsers: () => MentionUser[];
  onChange: (text: string, meta: EditorCallbackMeta) => void;
  onSubmit: (text: string, meta: EditorCallbackMeta) => void;
}

export type LooseOpts = Omit<
  MentionEditorOptions,
  'container' | 'users' | 'onChange' | 'onSubmit'
> & {
  defaultNodes?: EditorNode[];
  defaultValue?: string;
};

export function buildEditorOpts(
  container: HTMLElement,
  opts: LooseOpts,
  cb: BindingCallbacks,
): MentionEditorOptions {
  const result: MentionEditorOptions = {
    container,
    get users() {
      return cb.getUsers();
    },
    onChange: cb.onChange,
    onSubmit: cb.onSubmit,
  };

  if (opts.placeholder !== undefined) result.placeholder = opts.placeholder;
  if (opts.maxSuggestions !== undefined)
    result.maxSuggestions = opts.maxSuggestions;
  if (opts.disabled !== undefined) result.disabled = opts.disabled;
  if (opts.palette !== undefined) result.palette = opts.palette;
  if (opts.popoverPosition !== undefined)
    result.popoverPosition = opts.popoverPosition;
  if (opts.renderUser !== undefined) result.renderUser = opts.renderUser;
  if (opts.onFocus !== undefined) result.onFocus = opts.onFocus;
  if (opts.onBlur !== undefined) result.onBlur = opts.onBlur;

  return result;
}
