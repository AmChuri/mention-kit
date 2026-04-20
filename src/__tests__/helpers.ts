import type { EditorNode, MentionUser } from '../mention-editor';

// ── Fixtures ──────────────────────────────────────────────────────────────────

export const alice: MentionUser = {
  id: 'u1',
  name: 'Alice Johnson',
  meta: 'Engineering',
  color: '#7c3aed',
};

export const bob: MentionUser = {
  id: 'u2',
  name: 'Bob Smith',
  meta: 'Design',
};

export const carol: MentionUser = {
  id: 'u3',
  name: 'Carol White',
  meta: 'Product',
  color: '#059669',
};

export const ALL_USERS: MentionUser[] = [alice, bob, carol];

// ── Node builders ─────────────────────────────────────────────────────────────

export const text = (t: string): EditorNode => ({ type: 'text', text: t });

export const mention = (
  user: MentionUser,
  displayName?: string,
): EditorNode => ({
  type: 'mention',
  user,
  displayName: displayName ?? user.name,
});
