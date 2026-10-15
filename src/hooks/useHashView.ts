import { useCallback, useSyncExternalStore } from 'react';

export const VIEWS = ['posts', 'new', 'roles', 'jokes', 'account', 'log'] as const;
export type ViewName = (typeof VIEWS)[number];

// Tipu aizsargs: pārbauda tekstu un TypeScript tālāk zina, ka tā ir sadaļa
function isView(name: string): name is ViewName {
    return (VIEWS as readonly string[]).includes(name);
}

// Adreses daļa pēc # ir "ārējs avots": pārlūka stāvoklis, ko React nepārvalda.
// useSyncExternalStore ir React veids, kā to droši lasīt un sekot izmaiņām.
function subscribe(onChange: () => void): () => void {
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
}

const getSnapshot = (): string => window.location.hash;

// Navigācija bez lapas pārlādes: aktīvo sadaļu nosaka adreses daļa pēc #
export function useHashView(): { view: ViewName; go: (target: ViewName) => void } {
    const name = useSyncExternalStore(subscribe, getSnapshot).slice(1);
    const view: ViewName = isView(name) ? name : 'posts';

    const go = useCallback((target: ViewName) => {
        window.location.hash = target;
    }, []);

    return { view, go };
}
