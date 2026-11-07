import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible side panel (modal dialog). Full-screen on phones, a right-hand
 * panel from `sm` up.
 *  - role="dialog" + aria-modal, labelled by its title
 *  - focus moves in on open (to [data-autofocus] or the first control),
 *    is trapped while open, and returns to the trigger on close
 *  - Escape and backdrop click close it, unless `closeDisabled`
 *    (e.g. while a booking request is in flight)
 *  - the page behind is made inert and stops scrolling
 */
export default function Drawer({ open, onClose, title, description, children, footer, closeDisabled = false }) {
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
        className="drawer-backdrop absolute inset-0 bg-slate-900/40"
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
        className="drawer-panel relative flex h-full w-full flex-col bg-white shadow-2xl focus:outline-none sm:max-w-lg sm:border-l sm:border-sand-200"
      >
        <header className="flex items-start justify-between gap-4 border-b border-sand-200 bg-sand-50 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-0.5 text-sm text-slate-500">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Close panel"
            className="-mr-1 rounded-md p-1.5 text-slate-500 transition hover:bg-sand-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer && <footer className="border-t border-sand-200 bg-white px-5 py-4">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}
