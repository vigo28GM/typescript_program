import { useCallback, useEffect, useRef, useState } from 'react';
import { Api } from '../api.ts';
import type { RequestLogEntry } from '../types.ts';
import type { ViewName } from './useHashView.ts';

const MAX_LOG_ITEMS = 100;

// Katrs AJAX pieprasījums nonāk šeit (sadaļa "Pieprasījumi").
// `unseen` ir jauno pieprasījumu skaits, kamēr žurnāls nav atvērts.
export function useRequestLog(view: ViewName) {
    const [entries, setEntries] = useState<RequestLogEntry[]>([]);
    const [seenId, setSeenId] = useState(-1); // jaunākā ieraksta numurs, ko lietotājs jau redzējis
    const nextId = useRef(0);

    useEffect(() => Api.subscribeLog((entry) => {
        const item: RequestLogEntry = { ...entry, id: nextId.current++, time: new Date().toLocaleTimeString('lv-LV') };
        setEntries((list) => [item, ...list].slice(0, MAX_LOG_ITEMS));
    }), []);

    // Atverot žurnālu, viss tiek uzskatīts par redzētu. Stāvokli drīkst pielāgot renderēšanas laikā,
    // ja tas ir ierobežots ar nosacījumu (tā nav bezgalīga cilpa) un nav jāizmanto efekts.
    const newestId = entries.length > 0 ? entries[0].id : seenId;
    if (view === 'log' && seenId !== newestId) setSeenId(newestId);

    const unseen = view === 'log' ? 0 : entries.filter((entry) => entry.id > seenId).length;
    const clear = useCallback(() => setEntries([]), []);

    return { entries, unseen, clear };
}
