import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Api, ApiError } from '../api.ts';
import { renderWithApp } from '../test/renderWithApp.tsx';
import type { User } from '../types.ts';
import AccountView from './AccountView.tsx';

const user: User = {
    id: 5, name: 'Anna', email: 'anna@epasts.lv', email_verified_at: null,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
};

async function fillLogin() {
    await userEvent.type(screen.getByLabelText('E-pasts', { selector: '#login-form input' }), 'anna@epasts.lv');
    await userEvent.type(screen.getByLabelText('Parole', { selector: '#login-form input' }), 'parole123');
    await userEvent.click(screen.getByRole('button', { name: 'Pieslēgties' }));
}

describe('AccountView', () => {
    it('logs in: sends the form, stores the session and goes to the posts', async () => {
        const login = vi.spyOn(Api, 'login').mockResolvedValue({ user, token: 'abc' });
        const { context } = renderWithApp(<AccountView active />);

        await fillLogin();

        await waitFor(() => expect(context.setSession).toHaveBeenCalledWith(user, 'abc'));
        expect(login).toHaveBeenCalledWith({ email: 'anna@epasts.lv', password: 'parole123' });
        expect(context.go).toHaveBeenCalledWith('posts');
        expect(context.notify).toHaveBeenCalledWith('Sveiks, Anna!');
    });

    it('does not start a session when the login fails', async () => {
        vi.spyOn(Api, 'login').mockRejectedValue(new ApiError('Nepareizs e-pasts vai parole.', 422, null));
        const { context } = renderWithApp(<AccountView active />);

        await fillLogin();

        await waitFor(() => expect(Api.login).toHaveBeenCalled());
        expect(context.setSession).not.toHaveBeenCalled();
        expect(context.go).not.toHaveBeenCalled();
    });

    it('switches to the register form', async () => {
        renderWithApp(<AccountView active />);
        expect(document.getElementById('register-form')).not.toBeVisible();
        await userEvent.click(screen.getByRole('button', { name: 'Izveidot kontu' }));
        expect(document.getElementById('register-form')).toBeVisible();
        expect(document.getElementById('login-form')).not.toBeVisible();
    });

    it('shows the profile and a logout button when signed in', async () => {
        vi.spyOn(Api, 'me').mockResolvedValue(user);
        renderWithApp(<AccountView active />, { user });
        expect(await screen.findByText('Anna', { selector: '.profile-name' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Iziet' })).toBeInTheDocument();
    });

    it('logs out: goes to the posts and clears the session', async () => {
        vi.spyOn(Api, 'me').mockResolvedValue(user);
        vi.spyOn(Api, 'logout').mockResolvedValue({ message: 'ok' });
        const { context } = renderWithApp(<AccountView active />, { user });

        await userEvent.click(screen.getByRole('button', { name: 'Iziet' }));

        await waitFor(() => expect(context.setSession).toHaveBeenCalledWith(null, null));
        expect(context.go).toHaveBeenCalledWith('posts');
    });
});
