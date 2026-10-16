import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';
import { AppContext } from '../AppContext.ts';
import type { AppContextValue } from '../AppContext.ts';
import type { RunFn } from '../types.ts';

// Vienkāršs `run`: atgriež rezultātu (vai true, ja tā nav), kļūdas gadījumā undefined
const run = (async (task: () => Promise<unknown>) => {
    try {
        return (await task()) ?? true;
    } catch {
        return undefined;
    }
}) as RunFn;

export function createContext(overrides: Partial<AppContextValue> = {}): AppContextValue {
    return {
        user: null,
        setSession: vi.fn(),
        run,
        notify: vi.fn(),
        go: vi.fn(),
        posts: {} as AppContextValue['posts'],
        method: 'fetch',
        changeMethod: vi.fn(),
        slow: false,
        changeSlow: vi.fn(),
        ...overrides,
    };
}

// Atver komponenti ar tādu pašu kontekstu, kādu dod App
export function renderWithApp(ui: ReactElement, overrides: Partial<AppContextValue> = {}) {
    const context = createContext(overrides);
    return { context, ...render(<AppContext.Provider value={context}>{ui}</AppContext.Provider>) };
}
