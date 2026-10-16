import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary.tsx';

function Bomb({ explode }: { explode: boolean }) {
    if (explode) throw new Error('Bumba!');
    return <p>Viss kārtībā</p>;
}

describe('ErrorBoundary', () => {
    it('renders its children when nothing is wrong', () => {
        render(<ErrorBoundary><Bomb explode={false} /></ErrorBoundary>);
        expect(screen.getByText('Viss kārtībā')).toBeInTheDocument();
    });

    it('shows a readable message instead of a blank page', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        render(<ErrorBoundary><Bomb explode /></ErrorBoundary>);
        expect(screen.getByRole('alert')).toHaveTextContent('Kaut kas nogāja greizi');
        expect(screen.getByText('Bumba!')).toBeInTheDocument();
    });

    it('recovers with "try again" once the cause is gone', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        function Harness() {
            const [explode, setExplode] = useState(true);
            return (
                <>
                    <button type="button" onClick={() => setExplode(false)}>Salabot</button>
                    <ErrorBoundary><Bomb explode={explode} /></ErrorBoundary>
                </>
            );
        }
        render(<Harness />);
        expect(screen.getByRole('alert')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Salabot' }));
        await userEvent.click(screen.getByRole('button', { name: 'Mēģināt vēlreiz' }));
        expect(screen.getByText('Viss kārtībā')).toBeInTheDocument();
    });
});
