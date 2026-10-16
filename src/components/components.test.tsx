import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Joke } from '../types.ts';
import AuthRequired from './AuthRequired.tsx';
import Button from './Button.tsx';
import JokeCard from './JokeCard.tsx';
import StatusBadge from './StatusBadge.tsx';
import Switch from './Switch.tsx';
import Toast from './Toast.tsx';

const flags = { nsfw: false, religious: false, political: false, racist: false, sexist: false, explicit: false };

describe('Button', () => {
    it('calls onClick', async () => {
        const onClick = vi.fn();
        render(<Button onClick={onClick}>Saglabāt</Button>);
        await userEvent.click(screen.getByRole('button', { name: 'Saglabāt' }));
        expect(onClick).toHaveBeenCalledOnce();
    });

    it('is disabled and marked as loading while loading', async () => {
        const onClick = vi.fn();
        render(<Button loading onClick={onClick}>Saglabāt</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveClass('loading');
        await userEvent.click(button);
        expect(onClick).not.toHaveBeenCalled();
    });

    it('is type="button" unless told otherwise', () => {
        render(<Button>Ok</Button>);
        expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });
});

describe('StatusBadge', () => {
    it('shows the Latvian label', () => {
        render(<StatusBadge id={1} />);
        expect(screen.getByText('Publisks')).toHaveClass('badge-public');
    });

    it('shows private posts as private', () => {
        render(<StatusBadge id={2} />);
        expect(screen.getByText('Privāts')).toHaveClass('badge-private');
    });
});

describe('Switch', () => {
    it('always says whether it is on or off', () => {
        const { rerender } = render(<Switch checked={false} onChange={() => {}} label="Tikai droši joki" />);
        expect(screen.getByText('Izslēgts')).toBeInTheDocument();
        rerender(<Switch checked onChange={() => {}} label="Tikai droši joki" />);
        expect(screen.getByText('Ieslēgts')).toBeInTheDocument();
    });

    it('calls onChange when clicked', async () => {
        const onChange = vi.fn();
        render(<Switch checked={false} onChange={onChange} label="Rādīt Dark" />);
        await userEvent.click(screen.getByRole('switch', { name: /Rādīt Dark/ }));
        expect(onChange).toHaveBeenCalledOnce();
    });

    it('cannot be changed while disabled', async () => {
        const onChange = vi.fn();
        render(<Switch checked={false} disabled onChange={onChange} label="Rādīt Dark" />);
        await userEvent.click(screen.getByRole('switch'));
        expect(onChange).not.toHaveBeenCalled();
    });
});

describe('JokeCard', () => {
    const single: Joke = { id: 1, type: 'single', joke: 'Viens joks', category: 'Misc', flags, safe: true, lang: 'en' };
    const twopart: Joke = {
        id: 2, type: 'twopart', setup: 'Ievads?', delivery: 'Atbilde!', category: 'Pun', flags, safe: false, lang: 'en',
    };

    it('shows a single joke at once', () => {
        render(<JokeCard joke={single} />);
        expect(screen.getByText('Viens joks')).toBeInTheDocument();
        expect(screen.getByText('Drošs')).toBeInTheDocument();
    });

    it('hides the answer of a two-part joke until it is revealed', async () => {
        render(<JokeCard joke={twopart} />);
        expect(screen.getByText('Ievads?')).toBeInTheDocument();
        expect(screen.queryByText('Atbilde!')).not.toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Rādīt atbildi' }));
        expect(screen.getByText('Atbilde!')).toBeInTheDocument();
    });

    it('shows the flags that are set', () => {
        render(<JokeCard joke={{ ...single, safe: false, flags: { ...flags, nsfw: true } }} />);
        expect(screen.getByText('nsfw')).toBeInTheDocument();
        expect(screen.queryByText('Drošs')).not.toBeInTheDocument();
    });
});

describe('Toast', () => {
    it('is hidden until it has something to show', () => {
        render(<Toast toast={{ message: 'Sveiks', type: 'ok', visible: false }} />);
        expect(screen.getByRole('status', { hidden: true })).not.toBeVisible();
    });

    it('shows the message and marks errors', () => {
        render(<Toast toast={{ message: 'Kļūda!', type: 'error', visible: true }} />);
        expect(screen.getByRole('status')).toHaveTextContent('Kļūda!');
        expect(screen.getByRole('status')).toHaveClass('toast-error');
    });
});

describe('AuthRequired', () => {
    it('links to the account page', () => {
        render(<AuthRequired />);
        expect(screen.getByRole('link', { name: 'Pieslēgties' })).toHaveAttribute('href', '#account');
    });
});
