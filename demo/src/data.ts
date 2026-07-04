import type { MentionUser } from '@cursortag/mention-kit';

export const USERS: MentionUser[] = [
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
    details: [{ label: 'Team', value: 'Growth' }],
  },
  {
    id: 'u4',
    name: 'Dan Brown',
    meta: 'Growth Marketer · Marketing',
    color: '#d97706',
    email: 'dan@acme.com',
  },
];
