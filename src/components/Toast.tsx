import type { ToastState } from '../types.ts';

export default function Toast({ toast }: { toast: ToastState }) {
    return (
        <div
            id="toast"
            className={`toast toast-${toast.type}`}
            role="status"
            aria-live="polite"
            hidden={!toast.visible}
        >
            <span className="toast-icon">{toast.type === 'ok' ? '✓' : '!'}</span>
            {toast.message}
        </div>
    );
}
