import { useState } from 'react';
import type { FormEvent } from 'react';
import { Api } from '../api.ts';
import type { AjaxMethod } from '../api.ts';
import { useApp } from '../AppContext.ts';
import Button from '../components/Button.tsx';
import PostCard from '../components/PostCard.tsx';
import Spinner from '../components/Spinner.tsx';
import View from '../components/View.tsx';
import { useRunner } from '../hooks/useRunner.ts';

const METHODS: [AjaxMethod, string][] = [
    ['fetch', 'fetch (async/await)'],
    ['xhr', 'XMLHttpRequest'],
];

export default function PostsView({ active }: { active: boolean }) {
    const { posts, method, changeMethod, slow, changeSlow } = useApp();
    const [findId, setFindId] = useState('');
    const [reloading, setReloading] = useState(false);
    const [busy, perform] = useRunner();

    const find = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const post = await perform('find', () => Api.getPost(findId));
        if (post) posts.showOne(post);
    };

    const reload = async () => {
        setFindId('');
        setReloading(true);
        await posts.load();
        setReloading(false);
    };

    let summary = '';
    if (posts.status === 'ready') {
        summary = posts.filterId !== null
            ? `Atrasts ieraksts #${posts.filterId}`
            : `${posts.total} ${posts.total === 1 ? 'ieraksts' : 'ieraksti'}`;
    }

    return (
        <View name="posts" active={active}>
            <header className="page-head">
                <div>
                    <h1>Ieraksti</h1>
                    <p className="lead">Visi bloga ieraksti. Atver komentārus, rediģē vai dzēs savus ierakstus.</p>
                </div>
                <a href="#new" className="button primary">+ Jauns ieraksts</a>
            </header>

            <div className="toolbar">
                <form id="find-form" className="search" onSubmit={find}>
                    <input
                        name="id"
                        type="number"
                        min="1"
                        placeholder="Meklēt pēc ID…"
                        aria-label="Ieraksta ID"
                        required
                        value={findId}
                        onChange={(event) => setFindId(event.target.value)}
                    />
                    <Button type="submit" loading={busy === 'find'}>Atrast</Button>
                </form>
                <Button id="reload-btn" className="ghost" loading={reloading} onClick={reload}>↻ Rādīt visus</Button>
                <span className="muted" id="posts-summary">{summary}</span>
            </div>

            <div className="ajax-options" role="group" aria-label="AJAX iestatījumi">
                <span className="muted">AJAX metode:</span>
                <div className="segmented">
                    {METHODS.map(([value, label]) => (
                        <label key={value}>
                            <input
                                type="radio"
                                name="ajax-method"
                                value={value}
                                checked={method === value}
                                onChange={() => changeMethod(value)}
                            />
                            <span>{label}</span>
                        </label>
                    ))}
                </div>
                <label className="check">
                    <input type="checkbox" id="slow-mode" checked={slow} onChange={(event) => changeSlow(event.target.checked)} />
                    <span>Simulēt lēnu savienojumu (+1,5 s), lai redzētu ielādes indikatorus</span>
                </label>
            </div>

            <div id="posts" className="posts">
                {posts.status === 'loading' && <Spinner text="Ielādē ierakstus…" />}

                {posts.status === 'error' && (
                    <div className="empty-state">
                        <p className="empty-title">Neizdevās ielādēt ierakstus</p>
                        <p>Pārbaudi, vai API darbojas, un adresi sadaļā „Pieprasījumi”.</p>
                    </div>
                )}

                {posts.status === 'ready' && posts.visible.length === 0 && (
                    <div className="empty-state">
                        <p className="empty-title">Ierakstu vēl nav</p>
                        <p>Esi pirmais, kas kaut ko uzraksta!</p>
                        <a href="#new" className="button primary">+ Jauns ieraksts</a>
                    </div>
                )}

                {posts.status === 'ready' && posts.visible.map((post) => (
                    <PostCard key={post.id} post={post} highlight={post.id === posts.highlightId} />
                ))}
            </div>

            <p className="endpoints">
                <code>GET /api/posts</code> <code>GET /api/posts/{'{id}'}</code> <code>PUT /api/posts/{'{id}'}</code>
                <code>DELETE /api/posts/{'{id}'}</code> <code>PATCH /api/posts/{'{id}'}/status</code>
                <code>GET|POST|DELETE /api/posts/{'{id}'}/comments</code>
            </p>
        </View>
    );
}
