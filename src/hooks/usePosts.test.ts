import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { RunFn } from '../types.ts';
import { usePosts } from './usePosts.ts';

const run = vi.fn() as unknown as RunFn;
const post = (id: number) => ({ id, user_id: 1, title: `T${id}`, body: 'b', post_status_id: 1, created_at: '', updated_at: '' });

describe('usePosts order', () => {
    it('shows newest first by default and oldest first when switched', () => {
        const { result } = renderHook(() => usePosts(run));
        act(() => { result.current.add(post(1)); });
        act(() => { result.current.add(post(2)); });
        expect(result.current.visible.map((p) => p.id)).toEqual([2, 1]);
        act(() => { result.current.setOrder('oldest'); });
        expect(result.current.visible.map((p) => p.id)).toEqual([1, 2]);
    });

    it('remembers the chosen order between visits', () => {
        const first = renderHook(() => usePosts(run));
        act(() => { first.result.current.setOrder('oldest'); });
        first.unmount();
        const second = renderHook(() => usePosts(run));
        expect(second.result.current.order).toBe('oldest');
    });
});
