import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Api } from '../api.ts';
import { renderWithApp } from '../test/renderWithApp.tsx';
import type { AppContextValue } from '../AppContext.ts';
import PostsView from './PostsView.tsx';

const post = (id: number, userId: number) => ({ id, user_id: userId, title: `T${id}`, body: 'b', post_status_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '' });

function setup(visible = [post(1, 1), post(2, 2), post(3, 1)]) {
    const remove = vi.fn();
    const posts = { visible, total: visible.length, status: 'ready', filterId: null, highlightId: null, remove, load: vi.fn(), showOne: vi.fn() } as unknown as AppContextValue['posts'];
    const user = { id: 1, name: 'Anna', email: 'a@b.lv' };
    renderWithApp(<PostsView active />, { user, posts });
    return { remove };
}

describe('PostsView delete all mine', () => {
    it('deletes only the logged-in user\'s posts after confirmation', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        const del = vi.spyOn(Api, 'deletePost').mockResolvedValue({ message: 'ok' });
        const { remove } = setup();
        await userEvent.click(screen.getByRole('button', { name: 'Dzēst visus manus' }));
        await vi.waitFor(() => expect(remove).toHaveBeenCalledTimes(2));
        expect(del.mock.calls.map((c) => c[0])).toEqual([1, 3]);
    });

    it('does nothing when the confirmation is cancelled', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        const del = vi.spyOn(Api, 'deletePost');
        setup();
        await userEvent.click(screen.getByRole('button', { name: 'Dzēst visus manus' }));
        expect(del).not.toHaveBeenCalled();
    });
});
