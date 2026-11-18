# Build a Modal / Dialog System

```javascript
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
```

## Requirements
- Reusable modal: open/close, title, body, footer with actions
- Backdrop click to close, Escape key to close
- Focus trap inside modal, prevent body scroll
- Support stacked modals, confirmation dialogs

## Implementation
```javascript
function Modal({ isOpen, onClose, title, children, footer }) {
  const modalRef = useRef();
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;

      const focusable = modalRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) {
        event.preventDefault();
        modalRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    modalRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="modal" ref={modalRef} tabIndex={-1} role="dialog" aria-modal="true"
           aria-labelledby={titleId}>
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

// Confirmation dialog helper
function useConfirm() {
  const [state, setState] = useState({ isOpen: false, message: '', resolve: null });
  const confirm = (message) => new Promise(resolve => setState({ isOpen: true, message, resolve }));
  const handleClose = (result) => {
    state.resolve?.(result);
    setState({ isOpen: false, message: '', resolve: null });
  };
  return { confirm, ConfirmDialog: () => (
    <Modal isOpen={state.isOpen} onClose={() => handleClose(false)} title="Confirm">
      <p>{state.message}</p>
      <button onClick={() => handleClose(true)}>Yes</button>
      <button onClick={() => handleClose(false)}>No</button>
    </Modal>
  )};
}
```

## Key Patterns
- **Portal** (`createPortal`): render modal outside component tree, at document.body
- **Focus trap**: keep Tab cycling within modal (use `focus-trap-react` in production)
- **Escape key** + backdrop click to close
- **Prevent scroll**: `body.style.overflow = 'hidden'`
- **Accessible**: `role="dialog"`, `aria-modal="true"`, `aria-label`
- Restore focus and the prior body overflow value on close; do not blindly reset global styles.
- For nested dialogs, centralize scroll locking and focus management so closing one dialog does not unlock another.
