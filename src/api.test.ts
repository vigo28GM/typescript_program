import { describe, expect, it, vi } from 'vitest';
import { Api, ApiError, isAbortError } from './api.ts';

describe('isAbortError', () => {
    it('recognises an aborted request', () => {
        expect(isAbortError(new DOMException('cancelled', 'AbortError'))).toBe(true);
    });

    it('ignores other errors and values', () => {
        expect(isAbortError(new Error('boom'))).toBe(false);
        expect(isAbortError(null)).toBe(false);
        expect(isAbortError('AbortError')).toBe(false);
    });
});

describe('ApiError', () => {
    it('keeps the status and the server data', () => {
        const error = new ApiError('Nav atrasts', 404, { message: 'x' });
        expect(error).toBeInstanceOf(Error);
        expect(error.status).toBe(404);
        expect(error.data).toEqual({ message: 'x' });
        expect(error.message).toBe('Nav atrasts');
    });
});

describe('Api.getJokes', () => {
    const okResponse = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));
    const joke = { id: 1, type: 'single', joke: 'x', category: 'Misc', flags: {}, safe: true, lang: 'en' };

    it('sends the safe-mode flag without a value and never sends the Laravel token', async () => {
        Api.setToken('laravel-secret');
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() => okResponse(joke));

        await Api.getJokes({ safeMode: true, categories: ['Programming', 'Pun'], blacklist: ['nsfw', 'racist'], amount: 1 });

        const [url, init] = fetchMock.mock.calls[0];
        expect(String(url)).toBe(
            'https://v2.jokeapi.dev/joke/Programming,Pun?blacklistFlags=nsfw%2Cracist&amount=1&safe-mode',
        );
        expect(JSON.stringify(init?.headers)).not.toContain('laravel-secret');
    });

    it('searches every category when none are chosen', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() => okResponse(joke));
        await Api.getJokes({});
        expect(String(fetchMock.mock.calls[0][0])).toContain('/joke/Any?');
    });

    it('returns a list for one joke and for many jokes', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementationOnce(() => okResponse(joke));
        expect(await Api.getJokes({ amount: 1 })).toHaveLength(1);

        vi.spyOn(globalThis, 'fetch').mockImplementationOnce(() => okResponse({ error: false, jokes: [joke, joke, joke] }));
        expect(await Api.getJokes({ amount: 3 })).toHaveLength(3);
    });

    it('throws an ApiError with the server data when nothing matches (code 106)', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(() => okResponse({ error: true, code: 106, message: 'No matching joke found' }, 400));
        await expect(Api.getJokes({ contains: 'zzzz' })).rejects.toMatchObject({ status: 400, data: { code: 106 } });
    });
});

describe('Api requests to Laravel', () => {
    it('adds the saved token as a Bearer header', async () => {
        Api.setToken('abc123');
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(new Response('[]', { status: 200 })));
        await Api.getPosts();
        const headers = fetchMock.mock.calls[0][1]?.headers as Record<string, string>;
        expect(headers.Authorization).toBe('Bearer abc123');
    });

    it('turns a Laravel validation error into readable Latvian', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(
            new Response(JSON.stringify({ message: 'x', errors: { email: ['The email field is required.'] } }), { status: 422 }),
        ));
        await expect(Api.login({ email: '', password: '' })).rejects.toMatchObject({
            status: 422,
            message: 'Lauks „E-pasts” ir obligāts.',
        });
    });

    it('explains a 404 from Laravel in Latvian', async () => {
        vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(
            new Response(JSON.stringify({ message: 'No query results for model [App\\Models\\Post] 2' }), { status: 404 }),
        ));
        await expect(Api.getPost(2)).rejects.toMatchObject({ status: 404, message: expect.stringContaining('Ieraksts #2 netika atrasts') });
    });

    it('reports an unreachable server', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
        await expect(Api.getPosts()).rejects.toMatchObject({ status: 0 });
    });
});
