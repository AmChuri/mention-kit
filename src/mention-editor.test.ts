import { describe, it, expect } from 'vitest';
import { MentionEditor } from './mention-editor';

describe('MentionEditor', () => {
  it('should create an instance', () => {
    const editor = new MentionEditor();
    expect(editor).toBeInstanceOf(MentionEditor);
  });
});
