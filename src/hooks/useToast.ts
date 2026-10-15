import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToastState, ToastType } from '../types.ts';

// Īslaicīgs paziņojums apakšā ("Ieraksts publicēts.", kļūdu teksti…)
export function useToast() {
    const [toast, setToast] = useState<ToastState>({ message: '', type: 'ok', visible: false });
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const notify = useCallback((message: string, type: ToastType = 'ok') => {
        clearTimeout(timer.current);
        setToast({ message, type, visible: true });
        timer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 4000);
    }, []);

    useEffect(() => () => clearTimeout(timer.current), []);

    return { toast, notify };
}
