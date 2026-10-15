import type { FormEvent } from 'react';
import { Api } from '../api.ts';
import { useApp } from '../AppContext.ts';
import AuthRequired from '../components/AuthRequired.tsx';
import Button from '../components/Button.tsx';
import View from '../components/View.tsx';
import { readForm } from '../format.ts';
import { useRunner } from '../hooks/useRunner.ts';
import type { PostFields } from '../types.ts';

export default function NewPostView({ active }: { active: boolean }) {
    const { user, posts, go } = useApp();
    const [busy, perform] = useRunner();

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget; // jāsaglabā pirms await
        const fields = readForm<PostFields>(form);
        const created = await perform('submit', () => Api.createPost(fields), 'Ieraksts publicēts.');
        if (!created) return;
        posts.add(created);
        form.reset();
        go('posts');
    };

    return (
        <View name="new" active={active} narrow>
            <header className="page-head">
                <div>
                    <h1>Jauns ieraksts</h1>
                    <p className="lead">Ieraksts tiks publicēts tavā vārdā. Sākotnējais statuss ir <b>public</b>.</p>
                </div>
            </header>

            {user ? (
                <div className="card">
                    <form id="post-form" className="stack" onSubmit={submit}>
                        <label>
                            Virsraksts
                            <input name="title" required maxLength={255} placeholder="Piemēram: Mana pirmā diena skolā" />
                        </label>
                        <label>
                            Teksts
                            <textarea name="body" rows={7} required placeholder="Ko vēlies pastāstīt?" />
                        </label>
                        <div className="form-actions">
                            <a href="#posts" className="button ghost">Atcelt</a>
                            <Button type="submit" className="primary" loading={busy === 'submit'}>Publicēt</Button>
                        </div>
                    </form>
                </div>
            ) : (
                <AuthRequired />
            )}

            <p className="endpoints"><code>POST /api/posts</code> — nepieciešams tokens</p>
        </View>
    );
}
