import type { ViewName } from '../hooks/useHashView.ts';
import type { User } from '../types.ts';
import Avatar from './Avatar.tsx';
import ProgressBar from './ProgressBar.tsx';

const LINKS: { view: ViewName; label: string }[] = [
    { view: 'posts', label: 'Ieraksti' },
    { view: 'new', label: 'Jauns ieraksts' },
    { view: 'roles', label: 'Lomas' },
    { view: 'jokes', label: 'Jokes' },
];

interface NavBarProps {
    view: ViewName;
    user: User | null;
    unseen: number;
    loading: boolean;
    menuOpen: boolean;
    onToggleMenu: () => void;
}

export default function NavBar({ view, user, unseen, loading, menuOpen, onToggleMenu }: NavBarProps) {
    const active = (name: ViewName) => (view === name ? 'active' : undefined);

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <a href="#posts" className="brand">
                    <span className="brand-logo" aria-hidden="true">B</span>
                    <span>Blogs <small>API klients</small></span>
                </a>

                <button
                    type="button"
                    className="nav-toggle"
                    id="nav-toggle"
                    aria-expanded={menuOpen}
                    aria-controls="nav-menu"
                    onClick={onToggleMenu}
                >
                    <span className="sr-only">Izvēlne</span>
                    <span className="burger" aria-hidden="true" />
                </button>

                <div className="nav-menu" id="nav-menu">
                    <ul className="nav-links">
                        {LINKS.map((link) => (
                            <li key={link.view}>
                                <a href={`#${link.view}`} data-nav={link.view} className={active(link.view)}>
                                    {link.label}
                                </a>
                            </li>
                        ))}
                        <li>
                            <a href="#log" data-nav="log" className={active('log')}>
                                Pieprasījumi{' '}
                                <span className={`count${unseen > 0 ? ' has-new' : ''}`} id="log-count">{unseen}</span>
                            </a>
                        </li>
                    </ul>

                    <div className="nav-user" id="nav-user">
                        {user ? (
                            <a href="#account" className={`user-chip${view === 'account' ? ' active' : ''}`} data-nav="account" title="Mans konts">
                                <Avatar label={user.name.charAt(0).toUpperCase()} id={user.id} size="small" />
                                <span>{user.name}</span>
                            </a>
                        ) : (
                            <a href="#account" className={`button primary small${view === 'account' ? ' active' : ''}`} data-nav="account">
                                Pieslēgties
                            </a>
                        )}
                    </div>
                </div>
            </div>
            <ProgressBar loading={loading} />
        </nav>
    );
}
