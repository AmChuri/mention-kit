import { useState } from 'react';
import { RenderedMessage } from '@cursortag/mention-kit/react';
import { USERS } from '../data';

const STORED =
  'Nice work @{u1}! Can you sync with @{u2} on the new tokens, ' +
  'and loop in @{u3} for the rollout plan?';

export function HovercardDemo() {
  const [dark, setDark] = useState(false);

  return (
    <div className="demo-live">
      <div className="demo-actions" style={{ marginBottom: 12 }}>
        <button
          className="btn-ghost"
          onClick={() => setDark((d) => !d)}
          aria-pressed={dark}
        >
          {dark ? '☀️ Light theme' : '🌙 Dark theme'}
        </button>
        <span className="output-label">hover a mention →</span>
      </div>

      <div
        className="demo-editor"
        style={{
          lineHeight: 1.7,
          background: dark ? '#0b1220' : undefined,
          color: dark ? '#e2e8f0' : undefined,
          borderColor: dark ? '#1e293b' : undefined,
        }}
      >
        <RenderedMessage
          message={STORED}
          users={USERS}
          hovercard
          theme={dark ? { preset: 'dark' } : { preset: 'light' }}
        />
      </div>

      <div className="demo-output">
        <span className="output-label">stored</span>
        <code>{STORED}</code>
      </div>
    </div>
  );
}
