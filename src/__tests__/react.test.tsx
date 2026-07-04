import { describe, it, expect, afterEach } from 'vitest';
import { createRef } from 'react';
import { render, cleanup } from '@testing-library/react';
import {
  MentionInput,
  serializeToPersist,
  type MentionEditorInstance,
  type MentionUser,
} from '../react';

const USERS: MentionUser[] = [
  { id: 'u1', name: 'Alice' },
  { id: 'u2', name: 'Bob' },
];

afterEach(cleanup);

// ─── Controlled value (#5) ──────────────────────────────────────────────────────

describe('MentionInput controlled value', () => {
  it('seeds from the value prop on mount', () => {
    const ref = createRef<MentionEditorInstance>();
    render(<MentionInput ref={ref} users={USERS} value="hi @{u1}" />);
    expect(serializeToPersist(ref.current!.getNodes())).toBe('hi @{u1}');
  });

  it('re-syncs when value changes externally', () => {
    const ref = createRef<MentionEditorInstance>();
    const { rerender } = render(
      <MentionInput ref={ref} users={USERS} value="hi @{u1}" />,
    );
    expect(serializeToPersist(ref.current!.getNodes())).toBe('hi @{u1}');

    rerender(<MentionInput ref={ref} users={USERS} value="bye @{u2}" />);
    expect(serializeToPersist(ref.current!.getNodes())).toBe('bye @{u2}');
  });

  it('does not re-seed when value already matches the content', () => {
    const ref = createRef<MentionEditorInstance>();
    const { rerender } = render(
      <MentionInput ref={ref} users={USERS} value="hi @{u1}" />,
    );
    rerender(<MentionInput ref={ref} users={USERS} value="hi @{u1}" />);
    const nodes = ref.current!.getNodes();
    expect(serializeToPersist(nodes)).toBe('hi @{u1}');
    expect(nodes.filter((n) => n.type === 'mention')).toHaveLength(1);
  });
});
