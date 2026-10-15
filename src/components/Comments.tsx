import type { FormEventHandler, RefObject } from 'react';
import { formatDate } from '../format.ts';
import type { PostComment, User } from '../types.ts';
import Avatar from './Avatar.tsx';
import Button from './Button.tsx';
import Spinner from './Spinner.tsx';

interface CommentItemProps {
    comment: PostComment;
    user: User | null;
    busy: string | null;
    onDelete: (commentId: number) => void;
}

function CommentItem({ comment, user, busy, onDelete }: CommentItemProps) {
    const own = user !== null && user.id === comment.user_id;

    return (
        <li className="comment" data-comment-id={comment.id}>
            <Avatar label={`#${comment.user_id}`} id={comment.user_id} size="small" />
            <div className="comment-main">
                <p className="comment-meta">
                    <strong>{own ? 'Tu' : `Lietotājs #${comment.user_id}`}</strong>
                    <span className="muted">{formatDate(comment.created_at)}</span>
                    {own && (
                        <Button
                            className="link danger"
                            data-action="delete-comment"
                            loading={busy === `delete-${comment.id}`}
                            onClick={() => onDelete(comment.id)}
                        >
                            dzēst
                        </Button>
                    )}
                </p>
                <p className="comment-text">{comment.content}</p>
            </div>
        </li>
    );
}

interface CommentsProps {
    loading: boolean;
    items: PostComment[];
    user: User | null;
    busy: string | null;
    draft: string;
    onDraftChange: (value: string) => void;
    onSubmit: FormEventHandler<HTMLFormElement>;
    onDelete: (commentId: number) => void;
    inputRef: RefObject<HTMLInputElement | null>;
}

// Viena ieraksta komentāru lodziņš: saraksts un jauna komentāra forma
export default function Comments({
    loading, items, user, busy, draft, onDraftChange, onSubmit, onDelete, inputRef,
}: CommentsProps) {
    if (loading) {
        return (
            <div className="comments">
                <Spinner text="Ielādē komentārus…" />
            </div>
        );
    }

    return (
        <div className="comments">
            {items.length > 0 ? (
                <ul className="comment-list">
                    {items.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} user={user} busy={busy} onDelete={onDelete} />
                    ))}
                </ul>
            ) : (
                <p className="muted">Komentāru vēl nav.</p>
            )}

            {user ? (
                <form className="comment-form" onSubmit={onSubmit}>
                    <input
                        ref={inputRef}
                        name="content"
                        required
                        placeholder="Raksti komentāru…"
                        aria-label="Komentārs"
                        value={draft}
                        onChange={(event) => onDraftChange(event.target.value)}
                    />
                    <Button type="submit" className="primary" loading={busy === 'comment'}>Sūtīt</Button>
                </form>
            ) : (
                <p className="muted"><a href="#account">Pieslēdzies</a>, lai komentētu.</p>
            )}
        </div>
    );
}
