import { useEffect, useRef, useState } from 'react';
import type { AnimationEvent, ChangeEvent, FormEvent } from 'react';
import { Api } from '../api.ts';
import { useApp } from '../AppContext.ts';
import { STATUSES, STATUS_LABELS, formatDate, readForm } from '../format.ts';
import { useRunner } from '../hooks/useRunner.ts';
import type { Post, PostComment, PostFields } from '../types.ts';
import Avatar from './Avatar.tsx';
import Button from './Button.tsx';
import Comments from './Comments.tsx';
import DeleteButton from './DeleteButton.tsx';
import StatusBadge from './StatusBadge.tsx';

interface CommentsState {
    open: boolean;
    loading: boolean;
    items: PostComment[];
}

const COMMENTS_CLOSED: CommentsState = { open: false, loading: false, items: [] };

interface PostCardProps {
    post: Post;
    highlight: boolean;
}

// Viens ieraksts. Komentāru, rediģēšanas un dzēšanas stāvoklis pieder pašai kartītei.
export default function PostCard({ post, highlight }: PostCardProps) {
    const { user, run, posts } = useApp();
    const { remove, replace } = posts;
    const [busy, perform] = useRunner();

    const own = user !== null && user.id === post.user_id;
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    const [removing, setRemoving] = useState(false);
    const [comments, setComments] = useState<CommentsState>(COMMENTS_CLOSED);
    const [draft, setDraft] = useState('');
    const [focusTick, setFocusTick] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Pēc komentāru atvēršanas vai pievienošanas ievades lauks saņem fokusu
    useEffect(() => {
        if (focusTick > 0) inputRef.current?.focus();
    }, [focusTick]);

    // Pēc dzēšanas kartīte izbalē; ja animācija nenotiek, tomēr noņem to
    useEffect(() => {
        if (!removing) return undefined;
        const timer = setTimeout(() => remove(post.id), 600);
        return () => clearTimeout(timer);
    }, [removing, post.id, remove]);

    // ---------- Komentāri ----------

    const toggleComments = async () => {
        if (comments.open) {
            setComments((c) => ({ ...c, open: false }));
            return;
        }
        setComments({ open: true, loading: true, items: [] });
        const items = await perform('comments', () => Api.getComments(post.id));
        if (!items) {
            setComments(COMMENTS_CLOSED);
            return;
        }
        setComments({ open: true, loading: false, items });
        setFocusTick((t) => t + 1);
    };

    const reloadComments = async () => {
        const items = await run(() => Api.getComments(post.id));
        if (items) setComments((c) => ({ ...c, items }));
    };

    const addComment = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const created = await perform('comment', () => Api.createComment(post.id, draft), 'Komentārs pievienots.');
        if (!created) return;
        setDraft('');
        await reloadComments();
        setFocusTick((t) => t + 1);
    };

    const deleteComment = async (commentId: number) => {
        const ok = await perform(`delete-${commentId}`, () => Api.deleteComment(post.id, commentId), 'Komentārs izdzēsts.');
        if (ok) await reloadComments();
    };

    // ---------- Statuss, rediģēšana, dzēšana ----------

    const changeStatus = async (event: ChangeEvent<HTMLSelectElement>) => {
        const statusId = Number(event.target.value);
        const updated = await perform('status', () => Api.setPostStatus(post.id, statusId), 'Statuss nomainīts.');
        if (updated) replace({ ...post, post_status_id: updated.post_status_id });
    };

    const startEdit = () => {
        setComments(COMMENTS_CLOSED);
        setMode('edit');
    };

    const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const fields = readForm<PostFields>(event.currentTarget);
        const updated = await perform('save', () => Api.updatePost(post.id, fields), 'Izmaiņas saglabātas.');
        if (!updated) return;
        replace(updated);
        setMode('view');
    };

    const deletePost = async () => {
        const ok = await perform('delete', () => Api.deletePost(post.id), 'Ieraksts izdzēsts.');
        if (ok) setRemoving(true);
    };

    const onAnimationEnd = (event: AnimationEvent<HTMLElement>) => {
        if (event.target === event.currentTarget && event.animationName === 'fade-out') remove(post.id);
    };

    // ---------- Attēlojums ----------

    if (mode === 'edit') {
        return (
            <article className="post card editing" data-id={post.id}>
                <p className="editing-label">{`Rediģē ierakstu #${post.id}`}</p>
                <form className="edit-form stack" onSubmit={saveEdit}>
                    <label>
                        Virsraksts
                        <input name="title" defaultValue={post.title} required maxLength={255} autoFocus />
                    </label>
                    <label>
                        Teksts
                        <textarea name="body" rows={5} defaultValue={post.body} required />
                    </label>
                    <div className="form-actions">
                        <Button className="ghost" data-action="cancel-edit" onClick={() => setMode('view')}>Atcelt</Button>
                        <Button type="submit" className="primary" loading={busy === 'save'}>Saglabāt izmaiņas</Button>
                    </div>
                </form>
            </article>
        );
    }

    const classes = ['post', 'card', highlight ? 'highlight' : '', removing ? 'removing' : ''].filter(Boolean).join(' ');

    return (
        <article className={classes} data-id={post.id} onAnimationEnd={onAnimationEnd}>
            <header className="post-head">
                <Avatar label={`#${post.user_id}`} id={post.user_id} />
                <div className="post-author">
                    <strong>{own ? 'Tu' : `Lietotājs #${post.user_id}`}</strong>
                    <span className="muted">{`${formatDate(post.created_at)} · ieraksts #${post.id}`}</span>
                </div>
                <StatusBadge id={post.post_status_id} />
            </header>

            <h2 className="post-title">{post.title}</h2>
            <p className="post-body">{post.body}</p>

            <footer className="post-actions">
                <Button
                    className="ghost"
                    data-action="toggle-comments"
                    aria-expanded={comments.open}
                    loading={busy === 'comments'}
                    onClick={toggleComments}
                >
                    💬 Komentāri
                </Button>

                {own && (
                    <>
                        <span className="spacer" />
                        <select
                            data-action="status"
                            aria-label="Mainīt statusu"
                            value={post.post_status_id}
                            disabled={busy === 'status'}
                            onChange={changeStatus}
                        >
                            {Object.entries(STATUSES).map(([id, name]) => (
                                <option key={id} value={id}>{STATUS_LABELS[name]}</option>
                            ))}
                        </select>
                        <Button className="ghost" data-action="edit" onClick={startEdit}>✎ Rediģēt</Button>
                        <DeleteButton
                            confirmText={`Vai tiešām dzēst ierakstu „${post.title}”?`}
                            loading={busy === 'delete'}
                            onConfirm={deletePost}
                        />
                    </>
                )}
            </footer>

            {comments.open && (
                <Comments
                    loading={comments.loading}
                    items={comments.items}
                    user={user}
                    busy={busy}
                    draft={draft}
                    onDraftChange={setDraft}
                    onSubmit={addComment}
                    onDelete={deleteComment}
                    inputRef={inputRef}
                />
            )}
        </article>
    );
}
