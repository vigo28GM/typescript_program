// Kopīgie tipi: tas, ko atgriež Laravel API un JokeAPI, un lietotnes iekšējie dati.
// Šeit ir tikai tipi (nav izpildāmā koda), tāpēc citi faili tos importē ar `import type`.

// ---------- Laravel API ----------

export interface User {
    id: number;
    name: string;
    // Pēc pieslēgšanās atnāk tikai daļa laukus, bet GET /user atgriež visus
    email?: string;
    email_verified_at?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface Post {
    id: number;
    user_id: number;
    title: string;
    body: string;
    post_status_id: number; // 1 = public, 2 = private
    created_at: string;
    updated_at: string;
}

// POST /posts neatgriež post_status_id (datubāzē noklusējums ir 1 = public)
export type CreatedPost = Omit<Post, 'post_status_id'> & { post_status_id?: number };

// PATCH /posts/{id}/status atgriež ierakstu kopā ar statusu
export interface PostWithStatus extends Post {
    status: { id: number; name: string };
}

export interface PostComment {
    id: number;
    post_id: number;
    user_id: number;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface LoginResponse {
    user: User;
    token: string;
}

export interface MessageResponse {
    message: string;
}

// Dati, ko sūta uz serveri
export interface LoginFields {
    email: string;
    password: string;
}

export interface RegisterFields extends LoginFields {
    name: string;
    password_confirmation: string;
}

export interface PostFields {
    title: string;
    body: string;
}

// Laravel kļūdas atbilde: { message, errors: { lauks: ["..."] } }
export interface LaravelErrorBody {
    message?: string;
    errors?: Record<string, string[]>;
}

// ---------- JokeAPI ----------

export type JokeFlag = 'nsfw' | 'religious' | 'political' | 'racist' | 'sexist' | 'explicit';

interface JokeBase {
    id: number;
    category: string;
    flags: Record<JokeFlag, boolean>;
    safe: boolean;
    lang: string;
}

export interface SingleJoke extends JokeBase {
    type: 'single';
    joke: string;
}

export interface TwoPartJoke extends JokeBase {
    type: 'twopart';
    setup: string;
    delivery: string;
}

// Pēc `type` lauka TypeScript zina, kuri lauki ir pieejami
export type Joke = SingleJoke | TwoPartJoke;

export type JokeType = '' | 'single' | 'twopart'; // '' = jebkurš

export interface JokeQuery {
    categories: string[];
    blacklist: string[];
    type: JokeType;
    contains: string;
    lang: string;
    amount: number;
    safeMode: boolean;
}

// ---------- AJAX slānis ----------

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
    signal?: AbortSignal;
}

// Viens pieprasījums, kā to publicē api.ts žurnālam
export interface RequestLogData {
    method: HttpMethod;
    url: string;
    status: number;
    body: unknown;
    data: unknown;
    host: string;
    path: string;
    external: boolean; // vai tas ir cits serviss (nevis mūsu API)
    via: string; // 'fetch' vai 'XHR'
    ms: number;
}

// Žurnāla ieraksts lapā: pieprasījums ar numuru un laiku
export interface RequestLogEntry extends RequestLogData {
    id: number;
    time: string;
}

// ---------- Lietotne ----------

export type ToastType = 'ok' | 'error';

export interface ToastState {
    message: string;
    type: ToastType;
    visible: boolean;
}

// run() atgriež rezultātu; ja serveris neatgrieza saturu (null), tad true; kļūdas gadījumā undefined
export type RunResult<T> = [T] extends [null | undefined | void] ? true | undefined : NonNullable<T> | undefined;

export type RunFn = <T>(task: () => Promise<T>, successMessage?: string) => Promise<RunResult<T>>;
