import { describe, it, expect } from 'vitest';
import { serializeToText, serializeToMarkdown } from '../mention-editor';
import { text, mention, alice, bob } from './helpers';

// ─── serializeToText ──────────────────────────────────────────────────────────

describe('serializeToText', () => {
  it('returns empty string for empty array', () => {
    expect(serializeToText([])).toBe('');
  });

  it('serialises a single text node', () => {
    expect(serializeToText([text('hello')])).toBe('hello');
  });

  it('serialises a single mention as @displayName', () => {
    expect(serializeToText([mention(alice)])).toBe('@Alice Johnson');
  });

  it('joins mixed text and mentions', () => {
    const nodes = [text('Hi '), mention(alice), text(', meet '), mention(bob)];
    expect(serializeToText(nodes)).toBe('Hi @Alice Johnson, meet @Bob Smith');
  });

  it('handles consecutive mentions with no text between', () => {
    const nodes = [mention(alice), mention(bob)];
    expect(serializeToText(nodes)).toBe('@Alice Johnson@Bob Smith');
  });

  it('preserves whitespace in text nodes', () => {
    expect(serializeToText([text('  spaces  ')])).toBe('  spaces  ');
  });

  it('preserves newlines in text nodes', () => {
    expect(serializeToText([text('line1\nline2')])).toBe('line1\nline2');
  });

  it('uses displayName not user.name when they differ', () => {
    expect(serializeToText([mention(alice, 'Alice')])).toBe('@Alice');
  });

  it('handles special characters in text', () => {
    expect(serializeToText([text('<script>alert("xss")</script>')])).toBe(
      '<script>alert("xss")</script>',
    );
  });
});

// ─── serializeToMarkdown ──────────────────────────────────────────────────────

describe('serializeToMarkdown', () => {
  it('returns empty string for empty array', () => {
    expect(serializeToMarkdown([])).toBe('');
  });

  it('passes through plain text unchanged', () => {
    expect(serializeToMarkdown([text('hello')])).toBe('hello');
  });

  it('serialises a mention as @[displayName](userId)', () => {
    expect(serializeToMarkdown([mention(alice)])).toBe('@[Alice Johnson](u1)');
  });

  it('serialises mixed content', () => {
    const nodes = [text('Hey '), mention(bob), text(' check this')];
    expect(serializeToMarkdown(nodes)).toBe('Hey @[Bob Smith](u2) check this');
  });

  it('uses displayName not user.name in markdown', () => {
    expect(serializeToMarkdown([mention(alice, 'AJ')])).toBe('@[AJ](u1)');
  });

  it('handles multiple mentions', () => {
    const nodes = [mention(alice), text(' and '), mention(bob)];
    expect(serializeToMarkdown(nodes)).toBe(
      '@[Alice Johnson](u1) and @[Bob Smith](u2)',
    );
  });
});
