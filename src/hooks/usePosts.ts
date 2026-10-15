import { useCallback, useRef, useState } from 'react';
import { Api } from '../api.ts';
import type { CreatedPost, Post, RunFn } from '../types.ts';

type LoadStatus = 'loading' | 'ready' | 'error';

// Ierakstu saraksts un tā stāvoklis. `run` ir kopīgā funkcija, kas izpilda API izsaukumu
// un parāda kļūdas paziņojumu (skat. App.jsx).
export function usePosts(run: RunFn) {
    const [posts, setPosts] = useState<Post[]>([]);              // tādā secībā, kā atnāk no API
    const [status, setStatus] = useState<LoadStatus>('loading');
    const [filterId, setFilterId] = useState<number | null>(null); // ja nav null, rāda tikai šo ierakstu
    const [highlightId, setHighlightId] = useState<number | null>(null);
    const sequence = useRef(0);
    const abortRef = useRef<AbortController | null>(null);

    // Atceļ ielādi, kas vēl notiek (piemēram, kad komponente pazūd vai sākas jauna ielāde)
    const cancel = useCallback(() => {
        abortRef.current?.abort();
    }, []);

    // Ielādē visus ierakstus no servera. Jauna ielāde atceļ iepriekšējo, un ja atbilde tomēr
    // atnāk novēloti, tā tiek ignorēta.
    const load = useCallback(async () => {
        const mine = ++sequence.current;
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setStatus('loading');
        const loaded = await run(() => Api.getPosts({ signal: controller.signal }));
        if (mine !== sequence.current || controller.signal.aborted) return;
        if (!loaded) {
            setStatus('error');
            return;
        }
        setPosts(loaded);
        setFilterId(null);
        setHighlightId(null);
        setStatus('ready');
    }, [run]);

    // Pievieno ierakstu vai nomaina esošo ar tādu pašu ID
    const upsert = useCallback((post: Post) => {
        setPosts((list) => (list.some((p) => p.id === post.id)
            ? list.map((p) => (p.id === post.id ? post : p))
            : [...list, post]));
    }, []);

    // "Atrast pēc ID": parāda tikai šo ierakstu
    const showOne = useCallback((post: Post) => {
        upsert(post);
        setFilterId(post.id);
        setStatus('ready');
    }, [upsert]);

    // Jauns ieraksts. POST atbildē nav post_status_id, bet datubāzē noklusējums ir 1 (public)
    const add = useCallback((created: CreatedPost) => {
        upsert({ post_status_id: 1, ...created });
        setFilterId(null);
        setHighlightId(created.id);
        setStatus('ready');
    }, [upsert]);

    const remove = useCallback((id: number) => {
        setPosts((list) => list.filter((p) => p.id !== id));
        setFilterId((current) => (current === id ? null : current));
    }, []);

    // Jaunākie ieraksti augšā
    const visible = filterId === null
        ? [...posts].reverse()
        : posts.filter((p) => p.id === filterId);

    return {
        visible, total: posts.length, status, filterId, highlightId,
        load, cancel, showOne, add, replace: upsert, remove,
    };
}

export type PostsState = ReturnType<typeof usePosts>;
