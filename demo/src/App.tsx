import { useState } from 'react';
import { ReactComponentDemo } from './demos/ReactComponentDemo';
import { ReactHookDemo } from './demos/ReactHookDemo';
import { VueComponentDemo } from './demos/VueComponentDemo';
import { VueComposableDemo } from './demos/VueComposableDemo';
import {
  REACT_COMPONENT_SNIPPET,
  REACT_HOOK_SNIPPET,
  VUE_COMPONENT_SNIPPET,
  VUE_COMPOSABLE_SNIPPET,
} from './snippets';

// ── CodeBlock ─────────────────────────────────────────────────────────────────

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="code-block">
      <button className="copy-btn" onClick={copy} aria-label="Copy code">
        {copied ? '✓ copied' : 'copy'}
      </button>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ── DemoSection ───────────────────────────────────────────────────────────────

interface DemoSectionProps {
  id: string;
  badge: string;
  badgeColor: 'blue' | 'green';
  title: string;
  description: string;
  demo: React.ReactNode;
  snippet: string;
}

function DemoSection({
  id,
  badge,
  badgeColor,
  title,
  description,
  demo,
  snippet,
}: DemoSectionProps) {
  return (
    <section id={id} className="section">
      <div className="section-header">
        <span className={`badge badge-${badgeColor}`}>{badge}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="section-body">
        <div className="panel panel-demo">{demo}</div>
        <div className="panel panel-code">
          <CodeBlock code={snippet} />
        </div>
      </div>
    </section>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'react-component', label: 'React · Component' },
  { id: 'react-hook', label: 'React · Hook' },
  { id: 'vue-component', label: 'Vue · Component' },
  { id: 'vue-composable', label: 'Vue · Composable' },
] as const;

export function App() {
  const scrollTo = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="header">
        <div className="container">
          <div className="header-top">
            <div>
              <h1 className="logo">
                <span className="logo-at">@</span>mention-kit
              </h1>
              <p className="tagline">
                Headless zero-dependency TypeScript mention editor for React,
                Vue 3, and vanilla JS.
              </p>
            </div>
            <div className="header-badges">
              <a
                className="badge badge-gray"
                href="https://github.com/amchuri/mention-kit"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              <a
                className="badge badge-gray"
                href="https://www.npmjs.com/package/@cursortag/mention-kit"
                target="_blank"
                rel="noreferrer"
              >
                npm
              </a>
            </div>
          </div>

          <div className="install-block">
            <code>npm install @cursortag/mention-kit</code>
          </div>

          <div className="feature-grid">
            {[
              ['⚡', 'Zero deps', 'No framework required for the core'],
              [
                '🎨',
                'Headless',
                'Bring your own styles — Tailwind, MUI, shadcn',
              ],
              [
                '⌨️',
                'Keyboard-first',
                '@ to open, arrows to navigate, Enter to select',
              ],
              [
                '📦',
                'Tree-shakeable',
                'ESM + CJS, React and Vue are separate entry points',
              ],
            ].map(([icon, title, desc]) => (
              <div key={title} className="feature-card">
                <span className="feature-icon">{icon}</span>
                <strong>{title}</strong>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="nav">
        <div className="container">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className="nav-link"
              onClick={() => scrollTo(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Demos ───────────────────────────────────────────────────────── */}
      <main className="main">
        <div className="container">
          <DemoSection
            id="react-component"
            badge="React"
            badgeColor="blue"
            title="MentionInput component"
            description="Drop-in component. Forward a ref to get imperative access — clear, setNodes, focus."
            demo={<ReactComponentDemo />}
            snippet={REACT_COMPONENT_SNIPPET}
          />

          <DemoSection
            id="react-hook"
            badge="React"
            badgeColor="blue"
            title="useMentionEditor hook"
            description="Attach containerRef to any element — a plain div, a MUI Box, a shadcn wrapper — the library takes over its contents."
            demo={<ReactHookDemo />}
            snippet={REACT_HOOK_SNIPPET}
          />

          <DemoSection
            id="vue-component"
            badge="Vue 3"
            badgeColor="green"
            title="MentionInput component"
            description="Drop-in component with @submit and @change emits. Access methods imperatively via a template ref."
            demo={<VueComponentDemo />}
            snippet={VUE_COMPONENT_SNIPPET}
          />

          <DemoSection
            id="vue-composable"
            badge="Vue 3"
            badgeColor="green"
            title="useMentionEditor composable"
            description="Pass a reactive getter for users — filter the list and the dropdown updates instantly without remounting."
            demo={<VueComposableDemo />}
            snippet={VUE_COMPOSABLE_SNIPPET}
          />
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="footer">
        <div className="container">
          <p>
            MIT License &nbsp;·&nbsp;{' '}
            <a
              href="https://github.com/amchuri/mention-kit"
              target="_blank"
              rel="noreferrer"
            >
              github.com/amchuri/mention-kit
            </a>
            &nbsp;·&nbsp; by{' '}
            <a
              href="https://github.com/amchuri"
              target="_blank"
              rel="noreferrer"
            >
              Amay Churi
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
