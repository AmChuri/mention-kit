import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { attachHovercards } from '../hovercard';
import { renderCommentMessage, type MentionUser } from '../mention-editor';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const rich: MentionUser = {
  id: 'u1',
  name: 'Alice Johnson',
  meta: 'Engineering',
  color: '#7c3aed',
  email: 'alice@example.com',
  details: [
    { label: 'Team', value: 'Platform' },
    { label: 'TZ', value: 'PST', copyable: false },
  ],
};
const USERS = [rich];

const OPEN_DELAY = 180;
const CLOSE_DELAY = 140;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderInto(message = '@{u1}'): {
  container: HTMLElement;
  chip: HTMLElement;
} {
  const container = document.createElement('div');
  for (const part of renderCommentMessage(message, USERS)) {
    container.appendChild(
      typeof part === 'string' ? document.createTextNode(part) : part,
    );
  }
  document.body.appendChild(container);
  const chip = container.querySelector('[data-mention-id]') as HTMLElement;
  return { container, chip };
}

const fire = (el: HTMLElement, type: string): void => {
  el.dispatchEvent(new MouseEvent(type, { bubbles: false }));
};

const card = (): HTMLElement | null => document.querySelector('.mk-hovercard');

// ─── Setup ────────────────────────────────────────────────────────────────────

let writeText: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('attachHovercards', () => {
  it('opens a card on hover after the open delay', () => {
    const { container, chip } = renderInto();
    const cleanup = attachHovercards(container, USERS);

    fire(chip, 'mouseenter');
    expect(card()).toBeNull(); // not yet — delay pending
    vi.advanceTimersByTime(OPEN_DELAY + 20);

    const c = card();
    expect(c).toBeTruthy();
    expect(c!.style.visibility).toBe('visible');
    expect(c!.textContent).toContain('Alice Johnson');
    cleanup();
  });

  it('renders avatar, meta, email and detail rows', () => {
    const { container, chip } = renderInto();
    const cleanup = attachHovercards(container, USERS);
    fire(chip, 'mouseenter');
    vi.advanceTimersByTime(OPEN_DELAY + 20);

    const c = card()!;
    expect(c.querySelector('.mk-hovercard__avatar')?.textContent).toBe('AJ');
    expect(c.textContent).toContain('Engineering');
    expect(c.textContent).toContain('alice@example.com');
    expect(c.textContent).toContain('Platform');
    cleanup();
  });

  it('copies a field value to the clipboard', () => {
    const { container, chip } = renderInto();
    const cleanup = attachHovercards(container, USERS);
    fire(chip, 'mouseenter');
    vi.advanceTimersByTime(OPEN_DELAY + 20);

    const btn = card()!.querySelector(
      '[data-mk-copy="Platform"]',
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn.click();
    expect(writeText).toHaveBeenCalledWith('Platform');
    cleanup();
  });

  it('copies a formatted user summary via the copy-user button', () => {
    const { container, chip } = renderInto();
    const cleanup = attachHovercards(container, USERS);
    fire(chip, 'mouseenter');
    vi.advanceTimersByTime(OPEN_DELAY + 20);

    const btn = card()!.querySelector(
      '.mk-hovercard__copy-user',
    ) as HTMLButtonElement;
    btn.click();
    expect(writeText).toHaveBeenCalledWith('Alice Johnson <alice@example.com>');
    cleanup();
  });

  it('omits row copy buttons when copyFields is false', () => {
    const { container, chip } = renderInto();
    const cleanup = attachHovercards(container, USERS, { copyFields: false });
    fire(chip, 'mouseenter');
    vi.advanceTimersByTime(OPEN_DELAY + 20);

    const c = card()!;
    // copy-user button remains, but no per-row copy buttons
    expect(c.querySelectorAll('.mk-hovercard__copy--compact')).toHaveLength(0);
    expect(c.querySelector('.mk-hovercard__copy-user')).toBeTruthy();
    cleanup();
  });

  it('omits the copy-user button when copyUser is false', () => {
    const { container, chip } = renderInto();
    const cleanup = attachHovercards(container, USERS, { copyUser: false });
    fire(chip, 'mouseenter');
    vi.advanceTimersByTime(OPEN_DELAY + 20);

    expect(card()!.querySelector('.mk-hovercard__copy-user')).toBeNull();
    cleanup();
  });

  it('honors a custom copyUser text function', () => {
    const { container, chip } = renderInto();
    const cleanup = attachHovercards(container, USERS, {
      copyUser: (u) => `@${u.id}`,
    });
    fire(chip, 'mouseenter');
    vi.advanceTimersByTime(OPEN_DELAY + 20);

    (card()!.querySelector('.mk-hovercard__copy-user') as HTMLElement).click();
    expect(writeText).toHaveBeenCalledWith('@u1');
    cleanup();
  });

  it('uses a custom render function for the body', () => {
    const { container, chip } = renderInto();
    const cleanup = attachHovercards(container, USERS, {
      render: (u) => {
        const el = document.createElement('div');
        el.className = 'custom-body';
        el.textContent = `custom:${u.name}`;
        return el;
      },
    });
    fire(chip, 'mouseenter');
    vi.advanceTimersByTime(OPEN_DELAY + 20);

    const c = card()!;
    expect(c.querySelector('.custom-body')?.textContent).toBe(
      'custom:Alice Johnson',
    );
    cleanup();
  });

  it('applies theme vars to the card', () => {
    const { container, chip } = renderInto();
    const cleanup = attachHovercards(container, USERS, {
      theme: { preset: 'dark', accent: '#f472b6' },
    });
    fire(chip, 'mouseenter');
    vi.advanceTimersByTime(OPEN_DELAY + 20);

    const c = card()!;
    expect(c.style.getPropertyValue('--mk-card-bg')).toBe('#1e293b');
    expect(c.style.getPropertyValue('--mk-accent')).toBe('#f472b6');
    cleanup();
  });

  it('hides the card after the pointer leaves', () => {
    const { container, chip } = renderInto();
    const cleanup = attachHovercards(container, USERS);
    fire(chip, 'mouseenter');
    vi.advanceTimersByTime(OPEN_DELAY + 20);
    expect(card()!.style.visibility).toBe('visible');

    fire(chip, 'mouseleave');
    vi.advanceTimersByTime(CLOSE_DELAY + 20);
    expect(card()!.style.visibility).toBe('hidden');
    cleanup();
  });

  it('keeps the card open while it is itself hovered', () => {
    const { container, chip } = renderInto();
    const cleanup = attachHovercards(container, USERS);
    fire(chip, 'mouseenter');
    vi.advanceTimersByTime(OPEN_DELAY + 20);
    const c = card()!;

    fire(chip, 'mouseleave');
    fire(c, 'mouseenter'); // pointer moved onto the card
    vi.advanceTimersByTime(CLOSE_DELAY + 20);
    expect(c.style.visibility).toBe('visible');
    cleanup();
  });

  it('does nothing for a mention id absent from the users list', () => {
    const { container, chip } = renderInto('@{ghost}');
    const cleanup = attachHovercards(container, USERS);
    fire(chip, 'mouseenter');
    vi.advanceTimersByTime(OPEN_DELAY + 20);
    expect(card()).toBeNull();
    cleanup();
  });

  it('removes the card and listeners on cleanup', () => {
    const { container, chip } = renderInto();
    const cleanup = attachHovercards(container, USERS);
    fire(chip, 'mouseenter');
    vi.advanceTimersByTime(OPEN_DELAY + 20);
    expect(card()).toBeTruthy();

    cleanup();
    expect(card()).toBeNull();

    // further hovers are inert
    fire(chip, 'mouseenter');
    vi.advanceTimersByTime(OPEN_DELAY + 20);
    expect(card()).toBeNull();
  });
});
