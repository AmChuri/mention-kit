import { describe, it, expect } from 'vitest';
import {
  renderCommentMessage,
  renderCommentMessageToHTML,
} from '../mention-editor';
import { alice, bob, ALL_USERS } from './helpers';

// ─── renderCommentMessage ─────────────────────────────────────────────────────

describe('renderCommentMessage', () => {
  it('returns plain text as-is for messages without mentions', () => {
    const result = renderCommentMessage('hello world', ALL_USERS);
    expect(result).toEqual(['hello world']);
  });

  it('returns empty array entry for empty string', () => {
    const result = renderCommentMessage('', ALL_USERS);
    expect(result).toEqual(['']);
  });

  it('replaces @{userId} with an HTMLElement chip', () => {
    const result = renderCommentMessage('hi @{u1}', ALL_USERS);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0]).toBe('hi ');
    const chip = result.find((r) => r instanceof HTMLElement);
    expect(chip).toBeInstanceOf(HTMLElement);
  });

  it('renders multiple mentions in a single message', () => {
    const result = renderCommentMessage('@{u1} and @{u2} are here', ALL_USERS);
    // "": before first mention, "@{u1}": chip, " and ": text, "@{u2}": chip, " are here": text
    const chips = result.filter((r) => r instanceof HTMLElement);
    expect(chips).toHaveLength(2);
  });

  it('renders "Unknown User" chip for unrecognised user ids', () => {
    const result = renderCommentMessage('hi @{unknown-id}', ALL_USERS);
    const chip = result.find((r) => r instanceof HTMLElement) as HTMLElement;
    expect(chip).toBeTruthy();
    expect(chip.textContent).toContain('Unknown User');
  });

  it('handles consecutive mentions without text between', () => {
    const result = renderCommentMessage('@{u1}@{u2}', ALL_USERS);
    const chips = result.filter((r) => r instanceof HTMLElement);
    expect(chips).toHaveLength(2);
  });

  it('accepts a custom palette', () => {
    const customPalette = ['#ff0000'];
    // Should not throw
    const result = renderCommentMessage('@{u1}', ALL_USERS, customPalette);
    expect(result.filter((r) => r instanceof HTMLElement)).toHaveLength(1);
  });
});

// ─── renderCommentMessageToHTML ───────────────────────────────────────────────

describe('renderCommentMessageToHTML', () => {
  it('returns escaped HTML for plain text', () => {
    const result = renderCommentMessageToHTML('hello world', ALL_USERS);
    expect(result).toBe('hello world');
  });

  it('escapes HTML entities in plain text segments', () => {
    const result = renderCommentMessageToHTML('<b>bold</b>', ALL_USERS);
    expect(result).toContain('&lt;b&gt;');
    expect(result).not.toContain('<b>');
  });

  it('converts newlines to <br> in text', () => {
    const result = renderCommentMessageToHTML('line1\nline2', ALL_USERS);
    expect(result).toContain('<br>');
  });

  it('returns a <span> for mention tokens', () => {
    const result = renderCommentMessageToHTML('hi @{u1}', ALL_USERS);
    expect(result).toContain('<span');
    expect(result).toContain('Alice Johnson');
  });

  it('returns empty string for empty input', () => {
    expect(renderCommentMessageToHTML('', ALL_USERS)).toBe('');
  });

  it('handles unknown user ids gracefully', () => {
    const result = renderCommentMessageToHTML('@{no-such-id}', ALL_USERS);
    expect(result).toContain('Unknown User');
  });

  it('does not produce unbalanced HTML tags', () => {
    const result = renderCommentMessageToHTML('test @{u1} end', ALL_USERS);
    const opens = (result.match(/<span/g) || []).length;
    const closes = (result.match(/<\/span>/g) || []).length;
    expect(opens).toBe(closes);
  });
});
