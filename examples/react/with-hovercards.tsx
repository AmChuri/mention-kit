/**
 * React hovercards + themes example — <RenderedMessage /> (v0.2.0+).
 *
 * Shows:
 *  - Rendering a stored `@{userId}` message with styled mention chips
 *  - `hovercard` — reveal a profile card (avatar, meta, email, details) on hover
 *  - Copyable fields + a "copy user" button (copyUser as a custom function)
 *  - Theming with a `light` / `dark` preset via the `theme` prop
 *  - Enriching MentionUser with `email` and `details[]`
 */

import { useMemo, useState } from 'react';
import {
  RenderedMessage,
  type HovercardOptions,
  type MentionUser,
} from '@cursortag/mention-kit/react';

// ── Sample data ───────────────────────────────────────────────────────────────

const USERS: MentionUser[] = [
  {
    id: 'u1',
    name: 'Alice Johnson',
    meta: 'Staff Engineer · Engineering',
    color: '#7c3aed',
    email: 'alice@acme.com',
    details: [
      { label: 'Team', value: 'Platform' },
      { label: 'Slack', value: '@alice', href: 'https://slack.com' },
    ],
  },
  {
    id: 'u2',
    name: 'Bob Smith',
    meta: 'Product Designer · Design',
    color: '#0891b2',
    email: 'bob@acme.com',
    details: [{ label: 'Team', value: 'Design Systems' }],
  },
  {
    id: 'u3',
    name: 'Carol White',
    meta: 'PM · Product',
    color: '#059669',
    email: 'carol@acme.com',
  },
];

// A message as it would come back from your database.
const STORED =
  'Nice work @{u1}! Can you sync with @{u2} on the new tokens, ' +
  'and loop in @{u3} for the rollout plan?';

// ── Component ─────────────────────────────────────────────────────────────────

export function HovercardsExample() {
  const [dark, setDark] = useState(false);

  // Memoize object props so the hovercard isn't re-attached on every render.
  const hovercard = useMemo<HovercardOptions>(
    () => ({
      copyFields: true,
      copyUser: (u) => `${u.name} <${u.email ?? ''}>`.trim(),
    }),
    [],
  );

  return (
    <div
      style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}
    >
      <h2>@cursortag/mention-kit · React hovercards + themes</h2>

      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <button onClick={() => setDark((d) => !d)} aria-pressed={dark}>
          {dark ? '☀️ Light theme' : '🌙 Dark theme'}
        </button>
        <span style={{ fontSize: 12, color: '#6b7280' }}>
          hover a mention → profile card with copyable fields
        </span>
      </div>

      {/* A read-only rendered comment. Hover any chip to open its card. */}
      <div
        style={{
          border: '1px solid',
          borderColor: dark ? '#1e293b' : '#d1d5db',
          borderRadius: 8,
          padding: '12px 14px',
          lineHeight: 1.7,
          fontSize: 14,
          background: dark ? '#0b1220' : '#fff',
          color: dark ? '#e2e8f0' : '#111827',
        }}
      >
        <RenderedMessage
          message={STORED}
          users={USERS}
          hovercard={hovercard}
          theme={{ preset: dark ? 'dark' : 'light' }}
        />
      </div>

      <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
        The card, chips, copy buttons and links all restyle from{' '}
        <code>--mk-*</code> CSS variables — set them in your own CSS, or pass a{' '}
        <code>theme</code> object as shown above.
      </p>
    </div>
  );
}
