import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Api, ApiError } from './api.ts';
import type { AjaxMethod } from './api.ts';
import { AppContext } from './AppContext.ts';
import type { AppContextValue } from './AppContext.ts';
import NavBar from './components/NavBar.tsx';
import Toast from './components/Toast.tsx';
import { useHashView } from './hooks/useHashView.ts';
import { useLoadingBar } from './hooks/useLoadingBar.ts';
import { usePosts } from './hooks/usePosts.ts';
import { useRequestLog } from './hooks/useRequestLog.ts';
import { useToast } from './hooks/useToast.ts';
import type { RunResult, User } from './types.ts';
import AccountView from './views/AccountView.tsx';
import JokesView from './views/JokesView.tsx';
import LogView from './views/LogView.tsx';
import NewPostView from './views/NewPostView.tsx';
import PostsView from './views/PostsView.tsx';
import RolesView from './views/RolesView.tsx';

const METHOD_NAMES: Record<AjaxMethod, string> = { fetch: 'fetch (async/await)', xhr: 'XMLHttpRequest' };

export default function App() {
    const { view, go } = useHashView();
    const { toast, notify } = useToast();
    const loading = useLoadingBar();
    const log = useRequestLog(view);

    const [user, setUser] = useState<User | null>(Api.getStoredUser);

    // Mobilā izvēlne ir atvērta tikai tai sadaļai, kurā to atvēra, tāpēc, pārejot citur, tā aizveras
    // pati (nevajag efektu, kas izsauc setState).
    const [menu, setMenu] = useState({ open: false, view });
    const menuOpen = menu.open && menu.view === view;

    // AJAX iestatījumus glabā api.js (un localStorage). React tos lasa kā ārēju avotu,
    // tāpēc nav divu atsevišķu "patiesības avotu".
    const method = useSyncExternalStore(Api.subscribeSettings, Api.getMethod);
    const slow = useSyncExternalStore(Api.subscribeSettings, Api.isSlow);

    // ---------- Sesija ----------

    const setSession = useCallback((nextUser: User | null, token: string | null) => {
        Api.setToken(token);
        if (nextUser) Api.store.set('user', nextUser);
        else Api.store.remove('user');
        setUser(nextUser);
    }, []);

    // Izpilda API izsaukumu un parāda paziņojumu par rezultātu.
    // Kļūdas gadījumā atgriež undefined, veiksmē: rezultātu (vai true, ja tā nav).
    const run = useCallback(async <T,>(task: () => Promise<T>, successMessage?: string): Promise<RunResult<T>> => {
        try {
            const result = await task();
            if (successMessage) notify(successMessage, 'ok');
            return (result ?? true) as RunResult<T>;
        } catch (error) {
            if (Api.isAbortError(error)) return undefined; // atcelts pieprasījums nav kļūda
            if (error instanceof ApiError && error.status === 401 && Api.getToken()) {
                setSession(null, null);
                notify('Sesija beigusies, pieslēdzies no jauna.', 'error');
            } else {
                notify(error instanceof Error ? error.message : 'Nezināma kļūda.', 'error');
            }
            return undefined;
        }
    }, [notify, setSession]);

    const posts = usePosts(run);

    // Saraksts atkarīgs no lietotāja: privātos ierakstus redz tikai to autors,
    // un pogas "Rediģēt"/"Dzēst" parādās tikai pašu ierakstiem. Tāpēc to ielādē
    // lapas atvēršanā un pēc katras pieslēgšanās vai izrakstīšanās.
    // Sakopšana atceļ pieprasījumu, ja efekts tiek atsākts vai komponente pazūd.
    const { load, cancel } = posts;
    const userId = user?.id ?? null;
    useEffect(() => {
        load();
        return cancel;
    }, [load, cancel, userId]);

    // Pārejot uz citu sadaļu, lapa ritinās uz augšu (darbība ar pārlūku ārpus React)
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [view]);

    // ---------- AJAX iestatījumi ----------

    const changeMethod = (name: AjaxMethod) => {
        Api.setMethod(name);
        notify(`Pieprasījumi tagad tiek sūtīti ar: ${METHOD_NAMES[name]}`);
        load(); // tas pats uzdevums, cita metode
    };

    const changeSlow = (value: boolean) => {
        Api.setSlow(value);
        notify(value ? 'Lēnā savienojuma simulācija ieslēgta.' : 'Lēnā savienojuma simulācija izslēgta.');
    };

    const context: AppContextValue = { user, setSession, run, notify, go, posts, method, changeMethod, slow, changeSlow };

    return (
        <AppContext.Provider value={context}>
            <div className={menuOpen ? 'menu-open' : undefined}>
                <NavBar
                    view={view}
                    user={user}
                    unseen={log.unseen}
                    loading={loading}
                    menuOpen={menuOpen}
                    onToggleMenu={() => setMenu({ open: !menuOpen, view })}
                />

                <main className="container">
                    <PostsView active={view === 'posts'} />
                    <NewPostView active={view === 'new'} />
                    <RolesView active={view === 'roles'} />
                    <JokesView active={view === 'jokes'} />
                    <AccountView active={view === 'account'} />
                    <LogView active={view === 'log'} entries={log.entries} onClear={log.clear} />
                </main>

                <Toast toast={toast} />
            </div>
        </AppContext.Provider>
    );
}
