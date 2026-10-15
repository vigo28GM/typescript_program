// AJAX slānis: visi pieprasījumi uz Laravel API notiek šeit, bez lapas pārlādes.
// Vienu un to pašu uzdevumu var veikt ar divām metodēm (pārslēdz lapā):
//   1) fetch API ar async/await   2) XMLHttpRequest
// Šis fails neko nezina par React vai lapu: tikai tīkls un JSON.

import type {
    CreatedPost,
    HttpMethod,
    Joke,
    JokeQuery,
    LaravelErrorBody,
    LoginFields,
    LoginResponse,
    MessageResponse,
    Post,
    PostComment,
    PostFields,
    PostWithStatus,
    RegisterFields,
    RequestLogData,
    RequestOptions,
    User,
} from './types.ts';

const DEFAULT_URL = 'http://127.0.0.1:8000/api';

export const store = {
    get<T = unknown>(key: string): T | null {
        try { return JSON.parse(localStorage.getItem(key) ?? 'null') as T | null; } catch { return null; }
    },
    set(key: string, value: unknown): void {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* nav pieejams */ }
    },
    remove(key: string): void {
        try { localStorage.removeItem(key); } catch { /* nav pieejams */ }
    },
};

export class ApiError extends Error {
    status: number;
    data: unknown;

    constructor(message: string, status: number, data: unknown) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

// Abonenti: vairāki komponenti var klausīties vienu un to pašu notikumu, un katrs var atrakstīties.
type Listener<Args extends unknown[] = []> = (...args: Args) => void;

const logListeners = new Set<Listener<[RequestLogData]>>();
const loadingListeners = new Set<Listener<[number]>>();
const settingsListeners = new Set<Listener>();

function subscribe<Args extends unknown[]>(listeners: Set<Listener<Args>>, listener: Listener<Args>): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

function emit<Args extends unknown[]>(listeners: Set<Listener<Args>>, ...args: Args): void {
    listeners.forEach((listener) => listener(...args));
}

// Atcelta pieprasījuma kļūda ir paredzēta darbība (piemēram, atvērta cita lapa), nevis atteice
const abortError = (): DOMException => new DOMException('Pieprasījums atcelts', 'AbortError');

export function isAbortError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';
}

function isHttpUrl(value: string): boolean {
    try {
        const { protocol } = new URL(value);
        return protocol === 'http:' || protocol === 'https:';
    } catch {
        return false;
    }
}

// Saglabātā adrese var būt bojāta (piemēram, ierakstīta ar roku), tāpēc to pārbauda
function getBaseUrl(): string {
    const saved = store.get('apiUrl');
    return typeof saved === 'string' && isHttpUrl(saved) ? saved : DEFAULT_URL;
}

function isUser(value: unknown): value is User {
    if (value === null || typeof value !== 'object') return false;
    const { id, name } = value as Record<string, unknown>;
    return Number.isInteger(id) && typeof name === 'string';
}

// Saglabātais lietotājs arī var būt bojāts; nederīgu ignorē
function getStoredUser(): User | null {
    const saved = store.get('user');
    return isUser(saved) ? saved : null;
}

function setBaseUrl(url: string): void {
    store.set('apiUrl', url.replace(/\/+$/, ''));
}

function getToken(): string | null {
    return store.get<string>('token');
}

function setToken(token: string | null): void {
    if (token) store.set('token', token);
    else store.remove('token');
}

const MODEL_NAMES: Record<string, string> = {
    Post: 'Ieraksts', Comment: 'Komentārs', User: 'Lietotājs', Role: 'Loma', PostStatus: 'Statuss',
};

const FIELD_NAMES: Record<string, string> = {
    title: 'Virsraksts', body: 'Teksts', content: 'Komentārs', name: 'Vārds', email: 'E-pasts',
    password: 'Parole', user_id: 'Lietotāja ID', role_id: 'Loma', post_status_id: 'Statuss',
};

// Laravel angļu valodas teksti -> saprotami latviešu teksti
function humanize(message: string): string | null {
    let match = message.match(/No query results for model \[App\\Models\\(\w+)\](?: (\S+))?/);
    if (match) {
        const name = MODEL_NAMES[match[1]] ?? 'Ieraksts';
        return `${name}${match[2] ? ` #${match[2]}` : ''} netika atrasts. Iespējams, tas ir izdzēsts vai ID ir nepareizs.`;
    }
    match = message.match(/^The (.+?) field is required\.$/);
    if (match) return `Lauks „${fieldName(match[1])}” ir obligāts.`;
    match = message.match(/^The (.+?) field must be a valid email address\.$/);
    if (match) return 'Ievadi derīgu e-pasta adresi.';
    match = message.match(/^The (.+?) has already been taken\.$/);
    if (match) return `${fieldName(match[1])} jau ir aizņemts. Izvēlies citu.`;
    match = message.match(/^The (.+?) field confirmation does not match\.$/);
    if (match) return 'Paroles nesakrīt.';
    match = message.match(/^The (.+?) field must not be greater than (\d+) characters\.$/);
    if (match) return `„${fieldName(match[1])}” nedrīkst būt garāks par ${match[2]} rakstzīmēm.`;
    match = message.match(/^The selected (.+?) is invalid\.$/);
    if (match) return match[1] === 'email'
        ? 'Šāds e-pasts nav reģistrēts.'
        : `Izvēlētā vērtība („${fieldName(match[1])}”) nav derīga.`;

    const known: Record<string, string> = {
        'Unauthenticated.': 'Šai darbībai jāpieslēdzas savam kontam.',
        'You do not have the required role.': 'Šo darbību var veikt tikai administrators.',
        'This action is unauthorized.': 'Tev nav tiesību veikt šo darbību. Tu vari mainīt tikai savus ierakstus.',
        'The provided creadentials are incorrect.': 'Nepareizs e-pasts vai parole.',
        'The provided credentials are incorrect.': 'Nepareizs e-pasts vai parole.',
        'Too Many Attempts.': 'Pārāk daudz mēģinājumu. Uzgaidi mirkli un mēģini vēlreiz.',
        'Server Error': 'Servera kļūda. Mēģini vēlreiz vēlāk.',
    };
    return known[message] ?? null;
}

function fieldName(name: string): string {
    return FIELD_NAMES[name.replace(/ /g, '_')] ?? name;
}

function statusMessage(status: number): string {
    if (status === 0) return 'Neizdevās sazināties ar serveri. Vai API ir palaists?';
    if (status === 401) return 'Šai darbībai jāpieslēdzas savam kontam.';
    if (status === 403) return 'Tev nav tiesību veikt šo darbību.';
    if (status === 404) return 'Meklētais netika atrasts.';
    if (status === 422) return 'Ievadītie dati nav pareizi.';
    if (status === 429) return 'Pārāk daudz pieprasījumu. Uzgaidi mirkli.';
    if (status >= 500) return 'Servera kļūda. Mēģini vēlreiz vēlāk.';
    return `Kaut kas nogāja greizi (kods ${status}).`;
}

// Laravel validācijas kļūdas: { message, errors: { lauks: ["..."] } }
function errorMessage(data: unknown, status: number): string {
    if (data !== null && typeof data === 'object') {
        const body = data as LaravelErrorBody;
        if (body.errors) {
            const messages = Object.values(body.errors).flat().map((m) => humanize(m) ?? m);
            return [...new Set(messages)].join(' ');
        }
        if (body.message) return humanize(body.message) ?? statusMessage(status);
    }
    return statusMessage(status);
}

// ---------- Transporta metodes: abas saņem vienādus datus un atgriež vienādu rezultātu ----------

interface TransportRequest {
    method: HttpMethod;
    url: string;
    headers: Record<string, string>;
    body: string | undefined;
    signal: AbortSignal | undefined;
}

interface TransportResponse {
    status: number;
    text: string;
}

interface Transport {
    label: string;
    send: (request: TransportRequest) => Promise<TransportResponse>;
}

// ---------- 1. metode: fetch API ar async/await ----------

async function sendWithFetch({ method, url, headers, body, signal }: TransportRequest): Promise<TransportResponse> {
    const response = await fetch(url, { method, headers, body, signal });
    const text = await response.text();
    return { status: response.status, text };
}

// ---------- 2. metode: XMLHttpRequest (ar notikumiem, ietīts Promise) ----------

function sendWithXhr({ method, url, headers, body, signal }: TransportRequest): Promise<TransportResponse> {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(abortError());
            return;
        }
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        for (const [name, value] of Object.entries(headers)) {
            xhr.setRequestHeader(name, value);
        }
        xhr.timeout = 15000;
        xhr.onload = () => resolve({ status: xhr.status, text: xhr.responseText });
        xhr.onerror = () => reject(new Error('Tīkla kļūda'));
        xhr.ontimeout = () => reject(new Error('Serveris neatbild'));
        // fetch atceļ ar signal pats; XMLHttpRequest jāatceļ ar roku
        signal?.addEventListener('abort', () => {
            xhr.abort();
            reject(abortError());
        }, { once: true });
        xhr.send(body);
    });
}

const TRANSPORTS = {
    fetch: { label: 'fetch', send: sendWithFetch },
    xhr: { label: 'XHR', send: sendWithXhr },
} satisfies Record<string, Transport>;

export type AjaxMethod = keyof typeof TRANSPORTS; // 'fetch' | 'xhr'

// Object.hasOwn skatās tikai paša objekta atslēgas (`'toString' in TRANSPORTS` būtu true)
function isAjaxMethod(value: unknown): value is AjaxMethod {
    return typeof value === 'string' && Object.hasOwn(TRANSPORTS, value);
}

// ---------- Iestatījumi: metode un lēnā tīkla simulācija ----------

const SLOW_DELAY_MS = 1500;

function getMethod(): AjaxMethod {
    const saved = store.get('ajaxMethod');
    return isAjaxMethod(saved) ? saved : 'fetch';
}

function setMethod(name: AjaxMethod): void {
    if (isAjaxMethod(name)) {
        store.set('ajaxMethod', name);
        emit(settingsListeners);
    }
}

function isSlow(): boolean {
    return store.get('slowMode') === true;
}

function setSlow(value: boolean): void {
    store.set('slowMode', Boolean(value));
    emit(settingsListeners);
}

// ---------- Ielādes indikators: skaita, cik pieprasījumu vēl gaida atbildi ----------

let pending = 0;

function trackLoading(change: number): void {
    pending += change;
    emit(loadingListeners, pending);
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// ---------- Kopīgā pieprasījuma funkcija ----------

interface ExecuteOptions {
    method: HttpMethod;
    url: string;
    headers: Record<string, string>;
    body?: unknown;
    signal?: AbortSignal;
}

interface ExecuteResult {
    status: number;
    data: unknown;
    networkError: boolean;
    aborted: boolean;
}

// Kopīgais kodols jebkuram pieprasījumam (arī uz citām vietnēm): nosūta ar izvēlēto metodi
// (fetch / XHR), skaita gaidošos pieprasījumus un raksta žurnālu. Tokenu šeit nepievieno —
// galvenes sagatavo tas, kas funkciju izsauc.
async function execute({ method, url, headers, body, signal }: ExecuteOptions): Promise<ExecuteResult> {
    const transport: Transport = TRANSPORTS[getMethod()];
    let status = 0;
    let data: unknown = null;
    let networkError = false;
    let aborted = false;
    let started = performance.now();

    trackLoading(1);
    try {
        if (isSlow()) await sleep(SLOW_DELAY_MS);
        if (signal?.aborted) throw abortError();
        started = performance.now();

        const response = await transport.send({
            method,
            url,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal,
        });
        status = response.status;
        if (response.text) {
            try { data = JSON.parse(response.text); } catch { data = response.text; }
        }
    } catch (error) {
        if (isAbortError(error)) aborted = true; // atcelts: nav kļūda un netiek rakstīts žurnālā
        else networkError = true; // serveris nav sasniedzams (abām metodēm vienāda apstrāde)
    } finally {
        trackLoading(-1);
        if (!aborted) {
            emit(logListeners, {
                method, url, status, body, data,
                ...describeTarget(url),
                via: transport.label,
                ms: Math.round(performance.now() - started),
            });
        }
    }

    return { status, data, networkError, aborted };
}

// Žurnālam: kurš serveris un ceļš, un vai tas ir cits serviss (nevis mūsu API).
// To aprēķina šeit, nevis komponentē renderēšanas laikā, lai komponente paliek tīra.
function describeTarget(url: string): Pick<RequestLogData, 'host' | 'path' | 'external'> {
    try {
        const target = new URL(url);
        return {
            host: target.host,
            path: target.pathname + target.search,
            external: target.host !== new URL(getBaseUrl()).host,
        };
    } catch {
        return { host: '', path: url, external: false };
    }
}

// Pieprasījums uz mūsu Laravel API (ar tokenu un latviešu kļūdu tekstiem).
// `T` ir tas, ko serveris atgriež veiksmes gadījumā.
async function request<T>(method: HttpMethod, path: string, body?: unknown, { signal }: RequestOptions = {}): Promise<T> {
    const url = getBaseUrl() + path;
    // Accept: application/json liek Laravel atgriezt kļūdas JSON formātā, nevis HTML
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const { status, data, networkError, aborted } = await execute({ method, url, headers, body, signal });

    if (aborted) throw abortError();
    if (networkError) throw new ApiError(statusMessage(0), 0, null);

    // /login atgriež kļūdu ar statusu 200, tāpēc pārbaudām arī "errors" lauku
    const hasErrors = typeof data === 'object' && data !== null && Boolean((data as LaravelErrorBody).errors);
    if (status < 200 || status >= 300 || hasErrors) throw new ApiError(errorMessage(data, status), status, data);
    return data as T;
}

// ---------- JokeAPI (ārējs serviss: https://v2.jokeapi.dev) ----------

const JOKE_API = 'https://v2.jokeapi.dev';

interface JokeApiBody {
    error?: boolean;
    code?: number;
    message?: string;
    causedBy?: string[];
    jokes?: Joke[];
}

function jokeErrorMessage(data: unknown, status: number): string {
    const body = (typeof data === 'object' && data !== null ? data : {}) as JokeApiBody;
    if (body.error) {
        if (body.code === 106) return 'Pēc šiem filtriem joki netika atrasti. Mēģini mazāk ierobežot filtrus.';
        const reason = Array.isArray(body.causedBy) ? body.causedBy.join(' ') : body.message;
        if (reason) return `JokeAPI kļūda: ${reason}`;
    }
    if (status === 429) return 'JokeAPI atļauj 120 pieprasījumus minūtē. Uzgaidi mirkli.';
    if (status >= 500) return 'JokeAPI serveris šobrīd nedarbojas. Mēģini vēlāk.';
    return `JokeAPI atbildēja ar kļūdu (kods ${status}).`;
}

// Joku meklēšana ar filtriem. Šeit NAV Authorization galvenes: mūsu Laravel token
// nedrīkst nonākt pie trešās puses servisa. Atgriež joku masīvu.
async function getJokes({
    categories = [], blacklist = [], type = '', contains = '', lang = 'en', amount = 1, safeMode = false,
}: Partial<JokeQuery> = {}): Promise<Joke[]> {
    const params = new URLSearchParams();
    if (blacklist.length) params.set('blacklistFlags', blacklist.join(','));
    if (type) params.set('type', type);
    if (contains.trim()) params.set('contains', contains.trim());
    if (lang !== 'en') params.set('lang', lang);
    params.set('amount', String(amount));

    // JokeAPI atpazīst "safe-mode" tikai bez vērtības. URLSearchParams uzrakstītu "safe-mode=",
    // un tad serviss filtru ignorē (pārbaudīts: atgriež arī nedrošus jokus), tāpēc to pievieno ar roku.
    const query = [params.toString(), safeMode ? 'safe-mode' : ''].filter(Boolean).join('&');

    const category = categories.length ? categories.join(',') : 'Any';
    const url = `${JOKE_API}/joke/${category}?${query}`;

    const { status, data, networkError } = await execute({
        method: 'GET',
        url,
        headers: { Accept: 'application/json' },
    });

    if (networkError) throw new ApiError('Neizdevās sazināties ar JokeAPI. Pārbaudi interneta savienojumu.', 0, null);
    const body = (typeof data === 'object' && data !== null ? data : {}) as JokeApiBody;
    if (status < 200 || status >= 300 || body.error) throw new ApiError(jokeErrorMessage(data, status), status, data);

    // Viens joks nāk kā objekts, vairāki — kā { jokes: [...] }
    return Array.isArray(body.jokes) ? body.jokes : [data as Joke];
}

export const Api = {
    ApiError,
    store,
    isAbortError,
    getBaseUrl,
    setBaseUrl,
    getToken,
    setToken,
    getStoredUser,
    getMethod,
    setMethod,
    isSlow,
    setSlow,

    // Abonēšana (katra funkcija atgriež atrakstīšanās funkciju): žurnāls, ielāde, iestatījumi
    subscribeLog: (listener: Listener<[RequestLogData]>) => subscribe(logListeners, listener),
    subscribeLoading: (listener: Listener<[number]>) => subscribe(loadingListeners, listener),
    subscribeSettings: (listener: Listener) => subscribe(settingsListeners, listener),

    // Autentifikācija
    register: (fields: RegisterFields) => request<LoginResponse>('POST', '/register', fields),
    login: (fields: LoginFields) => request<LoginResponse>('POST', '/login', fields),
    logout: () => request<MessageResponse>('POST', '/logout'),
    me: (options?: RequestOptions) => request<User>('GET', '/user', undefined, options),

    // Ieraksti (ID no meklēšanas lauka ir teksts, tāpēc der gan skaitlis, gan teksts)
    getPosts: (options?: RequestOptions) => request<Post[]>('GET', '/posts', undefined, options),
    getPost: (id: number | string) => request<Post>('GET', `/posts/${id}`),
    createPost: (fields: PostFields) => request<CreatedPost>('POST', '/posts', fields),
    updatePost: (id: number, fields: PostFields) => request<Post>('PUT', `/posts/${id}`, fields),
    deletePost: (id: number) => request<MessageResponse>('DELETE', `/posts/${id}`),
    setPostStatus: (id: number, statusId: number) =>
        request<PostWithStatus>('PATCH', `/posts/${id}/status`, { post_status_id: statusId }),

    // Komentāri (ligzdotie maršruti). Dzēšana atgriež 204 bez satura.
    getComments: (postId: number) => request<PostComment[]>('GET', `/posts/${postId}/comments`),
    createComment: (postId: number, content: string) =>
        request<PostComment>('POST', `/posts/${postId}/comments`, { content }),
    deleteComment: (postId: number, commentId: number) =>
        request<null>('DELETE', `/posts/${postId}/comments/${commentId}`),

    // Joki (ārējais JokeAPI)
    getJokes,

    // Lomas
    assignRole: (userId: number | string, roleId: number) =>
        request<MessageResponse>('POST', `/users/${userId}/assign-role`, { role_id: roleId }),
    removeRole: (userId: number | string, roleId: number) =>
        request<MessageResponse>('POST', `/users/${userId}/remove-role`, { role_id: roleId }),
};
