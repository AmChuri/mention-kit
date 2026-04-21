import { describe, it, expect } from 'vitest';
import { serializeToPersist, parsePersist } from '../mention-editor';
import { text, mention, alice, bob, ALL_USERS } from './helpers';

// ─── serializeToPersist ───────────────────────────────────────────────────────

describe('serializeToPersist', () => {
  it('returns empty string for empty array', () => {
    expect(serializeToPersist([])).toBe('');
  });

  it('passes text through unchanged', () => {
    expect(serializeToPersist([text('hello')])).toBe('hello');
  });

  it('serialises mentions as @{userId}', () => {
    expect(serializeToPersist([mention(alice)])).toBe('@{u1}');
  });

  it('serialises mixed content', () => {
    const nodes = [text('Hey '), mention(alice), text(', meet '), mention(bob)];
    expect(serializeToPersist(nodes)).toBe('Hey @{u1}, meet @{u2}');
  });

  it('produces format consumable by parsePersist', () => {
    const nodes = [text('Hello '), mention(alice), text(' world')];
    const persisted = serializeToPersist(nodes);
    const parsed = parsePersist(persisted, ALL_USERS);
    expect(parsed).toHaveLength(3);
    expect(parsed[0]).toEqual({ type: 'text', text: 'Hello ' });
    expect(parsed[1]).toMatchObject({
      type: 'mention',
      displayName: 'Alice Johnson',
    });
    expect(parsed[2]).toEqual({ type: 'text', text: ' world' });
  });
});

// ─── parsePersist ─────────────────────────────────────────────────────────────

describe('parsePersist', () => {
  it('returns empty array for empty string', () => {
    expect(parsePersist('', ALL_USERS)).toEqual([]);
  });

  it('parses plain text as a single text node', () => {
    const result = parsePersist('hello', ALL_USERS);
    expect(result).toEqual([{ type: 'text', text: 'hello' }]);
  });

  it('parses @{userId} into a mention node', () => {
    const result = parsePersist('@{u1}', ALL_USERS);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: 'mention',
      user: { id: 'u1', name: 'Alice Johnson' },
      displayName: 'Alice Johnson',
    });
  });

  it('parses mixed text and mentions', () => {
    const result = parsePersist('Hey @{u1}, meet @{u2}', ALL_USERS);
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({ type: 'text', text: 'Hey ' });
    expect(result[1]).toMatchObject({
      type: 'mention',
      displayName: 'Alice Johnson',
    });
    expect(result[2]).toEqual({ type: 'text', text: ', meet ' });
    expect(result[3]).toMatchObject({
      type: 'mention',
      displayName: 'Bob Smith',
    });
  });

  it('returns "Unknown User" for unrecognised user IDs', () => {
    const result = parsePersist('@{unknown-id}', ALL_USERS);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: 'mention',
      user: { id: 'unknown-id', name: 'Unknown User' },
      displayName: 'Unknown User',
    });
  });

  it('handles consecutive mentions', () => {
    const result = parsePersist('@{u1}@{u2}', ALL_USERS);
    const mentions = result.filter((n) => n.type === 'mention');
    expect(mentions).toHaveLength(2);
  });

  it('round-trips with serializeToPersist', () => {
    const original = 'Hi @{u1} and @{u3}!';
    const nodes = parsePersist(original, ALL_USERS);
    const roundTripped = serializeToPersist(nodes);
    expect(roundTripped).toBe(original);
  });
});
