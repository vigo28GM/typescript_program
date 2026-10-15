import { useEffect, useEffectEvent, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Api, ApiError } from '../api.ts';
import Button from '../components/Button.tsx';
import JokeCard from '../components/JokeCard.tsx';
import Spinner from '../components/Spinner.tsx';
import Switch from '../components/Switch.tsx';
import View from '../components/View.tsx';
import type { Joke, JokeFlag, JokeQuery, JokeType } from '../types.ts';

// Dark nav šeit: to ieslēdz vai izslēdz atsevišķs slēdzis
const CATEGORIES = ['Programming', 'Misc', 'Pun', 'Spooky', 'Christmas'];

// Joki ar šīm pazīmēm tiek slēpti (JokeAPI parametrs blacklistFlags)
const FLAGS: [JokeFlag, string, string][] = [
    ['nsfw', 'NSFW', 'pieaugušajiem'],
    ['religious', 'reliģiskus', 'par reliģiju'],
    ['political', 'politiskus', 'par politiku'],
    ['racist', 'rasistiskus', 'aizskar rasi vai tautību'],
    ['sexist', 'seksistiskus', 'aizskar dzimumu'],
    ['explicit', 'rupjus', 'rupja valoda'],
];

const TYPES: [JokeType, string][] = [
    ['', 'Jebkurš'],
    ['single', 'Viena rinda'],
    ['twopart', 'Ievads + atbilde'],
];

const LANGUAGES: [string, string][] = [
    ['en', 'English'],
    ['cs', 'Čeština'],
    ['de', 'Deutsch'],
    ['es', 'Español'],
    ['fr', 'Français'],
    ['pt', 'Português'],
];

// Visi JokeAPI filtri + slēdzis, ko JokeAPI nepazīst (Dark rādīšana)
interface Filters extends JokeQuery {
    showDark: boolean;
}

interface JokeResult {
    status: 'idle' | 'loading' | 'ready' | 'error';
    jokes: Joke[];
    message: string;
    noMatch: boolean;
    filterCount: number;
}

const DEFAULT_FILTERS: Filters = {
    categories: [],                         // tukšs = visas kategorijas
    showDark: true,                         // Dark joki ir ieslēgti
    type: '',
    contains: '',
    lang: 'en',
    amount: 3,
    safeMode: false,                        // tikai droši joki
    blacklist: FLAGS.map(([name]) => name), // pēc noklusējuma slēpj visu jutīgo
};

// Sarakstā pievieno vai izņem vērtību
const toggle = <T,>(list: T[], value: T): T[] => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

// JokeAPI drošais režīms nekad neatgriež Dark jokus, tāpēc ar to Dark vienmēr ir izslēgts
const isDarkShown = (filters: Filters) => filters.showDark && !filters.safeMode;

// JokeAPI kļūdas atbilde: { error: true, code: 106, … }
const isNoMatch = (data: unknown): boolean =>
    typeof data === 'object' && data !== null && 'code' in data && data.code === 106;

// Kategorijas, ko sūta uz JokeAPI. Tukšs saraksts nozīmē "Any" (visas, arī Dark).
//  Dark ieslēgts + nekas neatzīmēts   -> visas kategorijas
//  Dark ieslēgts + atzīmētas          -> atzīmētās UN Dark ("arī")
//  Dark izslēgts + nekas neatzīmēts   -> visas, izņemot Dark
//  Dark izslēgts + atzīmētas          -> tikai atzīmētās
function requestCategories(filters: Filters): string[] {
    const { categories } = filters;
    if (isDarkShown(filters)) return categories.length ? [...categories, 'Dark'] : [];
    return categories.length ? categories : CATEGORIES;
}

// Cilvēkam saprotams saraksts ar visiem ieslēgtajiem filtriem: [nosaukums, vērtība]
function describeFilters(filters: Filters): [string, string][] {
    const items: [string, string][] = [];
    const dark = isDarkShown(filters);
    if (filters.categories.length) {
        items.push(['Kategorijas', [...filters.categories, ...(dark ? ['Dark'] : [])].join(', ')]);
    }
    if (!dark) items.push(['Dark joki', 'slēpti']);
    if (filters.type) items.push(['Veids', TYPES.find(([value]) => value === filters.type)?.[1] ?? filters.type]);
    if (filters.lang !== 'en') items.push(['Valoda', LANGUAGES.find(([code]) => code === filters.lang)?.[1] ?? filters.lang]);
    if (filters.contains.trim()) items.push(['Teksts', `„${filters.contains.trim()}”`]);
    if (filters.safeMode) items.push(['Tikai droši joki', 'jā']);
    if (filters.blacklist.length) {
        items.push(['Slēpj', filters.blacklist.map((name) => FLAGS.find(([flag]) => flag === name)?.[1] ?? name).join(', ')]);
    }
    return items;
}

export default function JokesView({ active }: { active: boolean }) {
    const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
    const [result, setResult] = useState<JokeResult>({ status: 'idle', jokes: [], message: '', noMatch: false, filterCount: 0 });
    const sequence = useRef(0);
    const loadedOnce = useRef(false);

    const update = (changes: Partial<Filters>) => setFilters((current) => ({ ...current, ...changes }));
    const activeFilters = describeFilters(filters);
    const darkShown = isDarkShown(filters);

    const search = async () => {
        const mine = ++sequence.current;
        const filterCount = describeFilters(filters).length; // cik filtru bija ieslēgti šajā meklēšanā
        setResult((current) => ({ ...current, status: 'loading' }));
        try {
            const jokes = await Api.getJokes({ ...filters, categories: requestCategories(filters) });
            if (mine === sequence.current) setResult({ status: 'ready', jokes, message: '', noMatch: false, filterCount });
        } catch (error) {
            if (mine === sequence.current) {
                // JokeAPI kods 106 nozīmē "serviss strādā, bet neviens joks neatbilst filtriem"
                const noMatch = error instanceof ApiError && isNoMatch(error.data);
                const message = error instanceof Error ? error.message : 'Nezināma kļūda.';
                setResult({ status: 'error', jokes: [], message, noMatch, filterCount });
            }
        }
    };

    // Pirmoreiz atverot sadaļu, uzreiz parāda dažus jokus. useEffectEvent ļauj efektā izsaukt
    // `search` ar pašreizējiem filtriem, nepadarot efektu atkarīgu no katras filtra maiņas.
    const searchOnFirstOpen = useEffectEvent(() => search());
    useEffect(() => {
        if (active && !loadedOnce.current) {
            loadedOnce.current = true;
            searchOnFirstOpen();
        }
    }, [active]);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        search();
    };

    const loading = result.status === 'loading';

    return (
        <View name="jokes" active={active}>
            <header className="page-head">
                <div>
                    <h1>Jokes</h1>
                    <p className="lead">
                        Joki no ārēja API (<b>JokeAPI</b>). Ieslēdz vai izslēdz filtrus un spied „Atrast jokus”: filtrus apstrādā pats serviss.
                    </p>
                </div>
            </header>

            <div className="card">
                <form id="joke-form" className="stack" onSubmit={submit}>
                    <fieldset className="filter-group">
                        <legend>Kategorijas <span className="muted">(atzīmētās ir ieslēgtas; ja nekas nav atzīmēts, tiek meklēts visās)</span></legend>
                        <div className="chips">
                            {CATEGORIES.map((name) => (
                                <label key={name} className="chip">
                                    <input
                                        type="checkbox"
                                        name="category"
                                        value={name}
                                        checked={filters.categories.includes(name)}
                                        onChange={() => update({ categories: toggle(filters.categories, name) })}
                                    />
                                    <span>{name}</span>
                                </label>
                            ))}
                        </div>
                        <Switch
                            name="dark"
                            value="dark"
                            checked={darkShown}
                            disabled={filters.safeMode}
                            onChange={(event) => update({ showDark: event.target.checked })}
                            label="Rādīt arī Dark jokus"
                            hint={filters.safeMode
                                ? 'Izslēgts, jo ir ieslēgts „Tikai droši joki”: drošajā režīmā JokeAPI Dark jokus neatgriež.'
                                : 'Tumšais humors: joki par nāvi un citām smagām tēmām. Ieslēgts = tiek pievienoti arī atzīmētajām kategorijām.'}
                        />
                    </fieldset>

                    <div className="grid-2">
                        <fieldset className="filter-group">
                            <legend>Veids</legend>
                            <div className="segmented">
                                {TYPES.map(([value, label]) => (
                                    <label key={value || 'any'}>
                                        <input
                                            type="radio"
                                            name="joke-type"
                                            value={value}
                                            checked={filters.type === value}
                                            onChange={() => update({ type: value })}
                                        />
                                        <span>{label}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <label>
                            Valoda
                            <select name="lang" value={filters.lang} onChange={(event) => update({ lang: event.target.value })}>
                                {LANGUAGES.map(([code, label]) => (
                                    <option key={code} value={code}>{label}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="grid-2">
                        <label>
                            Meklēt tekstā
                            <input
                                name="contains"
                                placeholder="piemēram: bug"
                                value={filters.contains}
                                onChange={(event) => update({ contains: event.target.value })}
                            />
                        </label>
                        <label>
                            Daudzums (1–10)
                            <input
                                name="amount"
                                type="number"
                                min="1"
                                max="10"
                                value={filters.amount}
                                onChange={(event) => update({ amount: Math.min(10, Math.max(1, Number(event.target.value) || 1)) })}
                            />
                        </label>
                    </div>

                    <fieldset className="filter-group">
                        <legend>Drošība</legend>
                        <Switch
                            name="safe"
                            value="safe-mode"
                            checked={filters.safeMode}
                            onChange={(event) => update({ safeMode: event.target.checked })}
                            label="Tikai droši joki"
                            hint="JokeAPI atgriež tikai jokus ar atzīmi „Drošs”."
                        />
                    </fieldset>

                    <fieldset className="filter-group">
                        <legend>Slēpt jokus, kas ir <span className="muted">(ieslēgts = šādi joki netiks rādīti)</span></legend>
                        <div className="switch-grid">
                            {FLAGS.map(([name, label, hint]) => (
                                <Switch
                                    key={name}
                                    name="blacklist"
                                    value={name}
                                    checked={filters.blacklist.includes(name)}
                                    onChange={() => update({ blacklist: toggle(filters.blacklist, name) })}
                                    label={`Slēpt ${label}`}
                                    hint={hint}
                                />
                            ))}
                        </div>
                    </fieldset>

                    <div className="active-filters" id="active-filters" aria-live="polite">
                        <p className="active-filters-title">
                            {activeFilters.length > 0
                                ? `Ieslēgtie filtri: ${activeFilters.length}`
                                : 'Neviens filtrs nav ieslēgts: tiks rādīti jebkādi joki.'}
                        </p>
                        {activeFilters.length > 0 && (
                            <ul className="filter-tags">
                                {activeFilters.map(([name, value]) => (
                                    <li key={name} className="filter-tag"><b>{name}:</b> {value}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="form-actions">
                        <Button className="ghost" onClick={() => setFilters(DEFAULT_FILTERS)}>Atiestatīt filtrus</Button>
                        <Button type="submit" className="primary" loading={loading}>Atrast jokus</Button>
                    </div>
                </form>
            </div>

            <div id="jokes" className="jokes">
                {result.status === 'loading' && <Spinner text="Meklē jokus…" />}

                {result.status === 'error' && (
                    <div className="empty-state">
                        <p className="empty-title">{result.noMatch ? 'Nekas netika atrasts' : 'Jokus neizdevās ielādēt'}</p>
                        <p>{result.message}</p>
                    </div>
                )}

                {result.status === 'ready' && (
                    <>
                        <p className="muted" id="jokes-summary">
                            {`Atrasti ${result.jokes.length} ${result.jokes.length === 1 ? 'joks' : 'joki'}`}
                            {` · ieslēgti filtri: ${result.filterCount}`}
                        </p>
                        {result.jokes.map((joke) => <JokeCard key={`${joke.id}-${joke.lang}`} joke={joke} />)}
                    </>
                )}
            </div>

            <p className="endpoints">
                <code>GET https://v2.jokeapi.dev/joke/{'{kategorijas}'}?blacklistFlags=…&amp;type=…&amp;contains=…&amp;lang=…&amp;amount=…&amp;safe-mode</code>
            </p>
        </View>
    );
}
