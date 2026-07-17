import { X } from 'lucide-react';
import styles from './Modal.module.css';

export default function Modal({ title, children, onClose, footer }) {
  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
        {footer ? <footer>{footer}</footer> : null}
      </section>
    </div>
  );
}
