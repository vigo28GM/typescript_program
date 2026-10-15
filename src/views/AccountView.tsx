import { Fragment, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Api } from '../api.ts';
import { useApp } from '../AppContext.ts';
import Avatar from '../components/Avatar.tsx';
import Button from '../components/Button.tsx';
import View from '../components/View.tsx';
import { readForm } from '../format.ts';
import { useRunner } from '../hooks/useRunner.ts';
import type { LoginFields, RegisterFields, User } from '../types.ts';

function Profile({ me }: { me: User }) {
    return (
        <>
            <div className="profile">
                <Avatar label={me.name.charAt(0).toUpperCase()} id={me.id} size="large" />
                <div>
                    <p className="profile-name">{me.name}</p>
                    <p className="muted">{`${me.email} · lietotāja ID ${me.id}`}</p>
                </div>
            </div>
            <dl className="details">
                {Object.entries(me).map(([key, value]) => (
                    <Fragment key={key}>
                        <dt>{key}</dt>
                        <dd>{String(value ?? '—')}</dd>
                    </Fragment>
                ))}
            </dl>
        </>
    );
}

// Pieprasa no servera datus par lietotāju, kuram pieder tokens. Komponente parādās tikai tad, kad
// konta sadaļa ir atvērta, tāpēc ielāde sākas atverot un tiek atcelta, kad lapa tiek pamesta.
function ProfileCard() {
    const { run } = useApp();
    const [me, setMe] = useState<User | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        run(() => Api.me({ signal: controller.signal })).then((result) => {
            if (result) setMe(result);
        });
        return () => controller.abort();
    }, [run]);

    return me ? <Profile me={me} /> : <p className="muted">Ielādē…</p>;
}

export default function AccountView({ active }: { active: boolean }) {
    const { user, setSession, notify, go } = useApp();
    const [tab, setTab] = useState<'login' | 'register'>('login');
    const [busy, perform] = useRunner();

    // Vispirms pāriet uz ierakstu sadaļu un tikai tad iestata lietotāju, lai profila karte,
    // kas pieder šai sadaļai, nemēģina ielādēties, kad sadaļa jau tiek pamesta.
    const login = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const fields = readForm<LoginFields>(form);
        const data = await perform('login', () => Api.login(fields));
        if (!data) return;
        go('posts');
        setSession(data.user, data.token);
        form.reset();
        notify(`Sveiks, ${data.user.name}!`);
    };

    const register = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const fields = readForm<RegisterFields>(form);
        const data = await perform('register', () => Api.register(fields));
        if (!data) return;
        go('posts');
        setSession(data.user, data.token);
        form.reset();
        notify(`Konts izveidots. Sveiks, ${data.user.name}!`);
    };

    const logout = async () => {
        // Lokāli izrakstāmies arī tad, ja serveris tokenu vairs neatpazīst
        await perform('logout', () => Api.logout(), 'Tu esi izrakstījies.');
        go('posts');
        setSession(null, null);
    };

    return (
        <View name="account" active={active} narrow>
            {!user ? (
                <div id="auth-box">
                    <header className="page-head">
                        <div>
                            <h1>Pieslēgties</h1>
                            <p className="lead">
                                Pēc pieslēgšanās serveris izsniedz <b>tokenu</b>, ar kuru tiek sūtīti visi turpmākie pieprasījumi.
                            </p>
                        </div>
                    </header>

                    <div className="card">
                        <div className="tabs" role="tablist">
                            <Button className={`tab${tab === 'login' ? ' active' : ''}`} data-tab="login-form" onClick={() => setTab('login')}>
                                Man ir konts
                            </Button>
                            <Button className={`tab${tab === 'register' ? ' active' : ''}`} data-tab="register-form" onClick={() => setTab('register')}>
                                Izveidot kontu
                            </Button>
                        </div>

                        <form id="login-form" className="stack" onSubmit={login} hidden={tab !== 'login'}>
                            <label>
                                E-pasts
                                <input name="email" type="email" required autoComplete="email" placeholder="vards@epasts.lv" />
                            </label>
                            <label>
                                Parole
                                <input name="password" type="password" required autoComplete="current-password" />
                            </label>
                            <Button type="submit" className="primary block" loading={busy === 'login'}>Pieslēgties</Button>
                        </form>

                        <form id="register-form" className="stack" onSubmit={register} hidden={tab !== 'register'}>
                            <label>
                                Vārds
                                <input name="name" required maxLength={255} autoComplete="name" />
                            </label>
                            <label>
                                E-pasts
                                <input name="email" type="email" required autoComplete="email" placeholder="vards@epasts.lv" />
                            </label>
                            <div className="grid-2">
                                <label>
                                    Parole
                                    <input name="password" type="password" required autoComplete="new-password" />
                                </label>
                                <label>
                                    Parole atkārtoti
                                    <input name="password_confirmation" type="password" required autoComplete="new-password" />
                                </label>
                            </div>
                            <Button type="submit" className="primary block" loading={busy === 'register'}>Izveidot kontu</Button>
                        </form>
                    </div>
                    <p className="endpoints"><code>POST /api/login</code> <code>POST /api/register</code></p>
                </div>
            ) : (
                <div id="profile-box">
                    <header className="page-head">
                        <div>
                            <h1>Mans konts</h1>
                            <p className="lead">Dati, ko serveris atgriež par lietotāju, kuram pieder tokens.</p>
                        </div>
                        <Button id="logout-btn" className="danger" loading={busy === 'logout'} onClick={logout}>Iziet</Button>
                    </header>
                    <div className="card">
                        <div id="me-output">
                            {active && <ProfileCard />}
                        </div>
                    </div>
                    <p className="endpoints"><code>GET /api/user</code> <code>POST /api/logout</code></p>
                </div>
            )}
        </View>
    );
}
