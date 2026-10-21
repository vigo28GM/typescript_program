import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DeleteButton from './DeleteButton.tsx';

describe('DeleteButton', () => {
    it('calls onConfirm when the user confirms', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        const onConfirm = vi.fn();
        render(<DeleteButton confirmText="Dzēst?" onConfirm={onConfirm} />);
        await userEvent.click(screen.getByRole('button', { name: 'Dzēst' }));
        expect(window.confirm).toHaveBeenCalledWith('Dzēst?');
        expect(onConfirm).toHaveBeenCalledOnce();
    });

    it('does nothing when the user cancels', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        const onConfirm = vi.fn();
        render(<DeleteButton confirmText="Dzēst?" onConfirm={onConfirm} />);
        await userEvent.click(screen.getByRole('button', { name: 'Dzēst' }));
        expect(onConfirm).not.toHaveBeenCalled();
    });
});
