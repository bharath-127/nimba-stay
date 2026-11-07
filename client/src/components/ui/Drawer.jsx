import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon.jsx';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Horizontal progress indicator for multi-step panels. */
function Stepper({ steps, current }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold tnum transition-colors ${
                done
                  ? 'bg-brand-600 text-white'
                  : active
                    ? 'bg-brand-700 text-white ring-4 ring-brand-100'
                    : 'border border-sand-300 bg-white text-ink-400'
              }`}
              aria-hidden="true"
            >
              {done ? <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.4} /> : i + 1}
            </span>
            <span className={`text-xs font-medium ${active ? 'text-ink-900' : done ? 'text-brand-700' : 'text-ink-400'}`}>
              <span className="sr-only">{done ? 'Completed: ' : active ? 'Current: ' : 'Upcoming: '}</span>
              {label}
            </span>
            {i < steps.length - 1 && <span className={`mx-1 h-px w-6 sm:w-8 ${done ? 'bg-brand-400' : 'bg-sand-300'}`} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Accessible side panel (modal dialog). Full-screen on phones, a right-hand
 * panel from `sm` up.
 *  - role="dialog" + aria-modal, labelled by its title
 *  - optional stepper (`steps` + `step`) in the header
 *  - focus moves in on open (to [data-autofocus] or the first control),
 *    is trapped while open, and returns to the trigger on close
 *  - Escape and backdrop click close it, unless `closeDisabled`
 *    (e.g. while a booking request is in flight)
 *  - the page behind is made inert and stops scrolling
 */
export default function Drawer({ open, onClose, title, description, children, footer, closeDisabled = false, steps = null, step = 0 }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  // Refs so the open/close effect does not re-run (and steal focus) on every render.
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);
  onCloseRef.current = onClose;
  closeDisabledRef.current = closeDisabled;

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    const root = document.getElementById('root');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    root?.setAttribute('inert', '');

    const panel = panelRef.current;
    const initial = panel?.querySelector('[data-autofocus]') ?? panel?.querySelector(FOCUSABLE) ?? panel;
    initial?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (!closeDisabledRef.current) {
          event.stopPropagation();
          onCloseRef.current();
        }
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll(FOCUSABLE));
      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      root?.removeAttribute('inert');
      if (previouslyFocused && typeof previouslyFocused.focus === 'function' && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="drawer-backdrop absolute inset-0 bg-ink-900/45 backdrop-blur-[2px]"
        aria-hidden="true"
        onClick={() => {
          if (!closeDisabled) onClose();
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="drawer-panel relative flex h-full w-full flex-col bg-white focus:outline-none sm:max-w-lg sm:border-l sm:border-sand-200"
        style={{ boxShadow: 'var(--shadow-lift)' }}
      >
        <header className="border-b divider-sand bg-sand-50 px-5 pb-4 pt-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              {steps && (
                <div className="mb-3">
                  <Stepper steps={steps} current={step} />
                </div>
              )}
              <h2 id={titleId} className="font-display text-xl font-semibold leading-tight text-ink-900">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-sm text-ink-500">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={closeDisabled}
              aria-label="Close panel"
              className="-mr-1.5 -mt-1 rounded-lg p-2 text-ink-500 transition hover:bg-sand-100 hover:text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="x" className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">{children}</div>

        {footer && <footer className="sticky bottom-0 border-t divider-sand bg-white/95 px-5 py-4 backdrop-blur sm:px-6">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}
