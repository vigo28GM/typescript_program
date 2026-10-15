// Mazas palīgfunkcijas datu attēlošanai (nav saistītas ar React).

export const STATUSES: Record<number, string> = { 1: 'public', 2: 'private' };
export const STATUS_LABELS: Record<string, string> = { public: 'Publisks', private: 'Privāts' };

export function formatDate(iso: string | null | undefined): string {
    return iso ? new Date(iso).toLocaleString('lv-LV', { dateStyle: 'medium', timeStyle: 'short' }) : '';
}

export function statusName(id: number): string {
    return STATUSES[id] ?? `#${id}`;
}

// Žurnālā paroles netiek rādītas
export function hidePasswords(body: unknown): unknown {
    if (body === null || typeof body !== 'object') return body;
    const copy: Record<string, unknown> = { ...(body as Record<string, unknown>) };
    for (const key of Object.keys(copy)) {
        if (key.startsWith('password')) copy[key] = '••••••';
    }
    return copy;
}

// Nolasa formas laukus kā objektu. Tipu `T` norāda tas, kas funkciju izsauc: pārlūks formas datus
// vienmēr atdod kā tekstu, tāpēc tipu nevar pārbaudīt, tikai norādīt.
export function readForm<T>(form: HTMLFormElement): T {
    return Object.fromEntries(new FormData(form)) as T;
}
