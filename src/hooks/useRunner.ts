import { useCallback, useState } from 'react';
import { useApp } from '../AppContext.ts';
import type { RunResult } from '../types.ts';

// Izpilda API izsaukumu un atceras, kura poga to gaida (lai tai parādītu spinneri).
//   const [busy, perform] = useRunner();
//   await perform('submit', () => Api.login(data), 'Veiksmīgi!');
//   <Button loading={busy === 'submit'}>…</Button>
export function useRunner() {
    const { run } = useApp();
    const [busy, setBusy] = useState<string | null>(null);

    const perform = useCallback(async <T>(
        key: string,
        task: () => Promise<T>,
        successMessage?: string,
    ): Promise<RunResult<T>> => {
        setBusy(key);
        try {
            return await run(task, successMessage);
        } finally {
            setBusy(null);
        }
    }, [run]);

    return [busy, perform] as const;
}
