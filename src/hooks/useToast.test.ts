import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToast } from './useToast.ts';

describe('useToast', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('shows a message and hides it after 4 seconds', () => {
        const { result } = renderHook(() => useToast());
        expect(result.current.toast.visible).toBe(false);

        act(() => result.current.notify('Saglabāts'));
        expect(result.current.toast).toMatchObject({ message: 'Saglabāts', type: 'ok', visible: true });

        act(() => { vi.advanceTimersByTime(4000); });
        expect(result.current.toast.visible).toBe(false);
    });

    it('a new message restarts the timer', () => {
        const { result } = renderHook(() => useToast());
        act(() => result.current.notify('Pirmais'));
        act(() => { vi.advanceTimersByTime(3000); });
        act(() => result.current.notify('Otrais', 'error'));
        act(() => { vi.advanceTimersByTime(3000); });
        expect(result.current.toast).toMatchObject({ message: 'Otrais', type: 'error', visible: true });
    });
});
