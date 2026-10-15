import { hidePasswords } from '../format.ts';
import type { RequestLogEntry } from '../types.ts';

// Viens AJAX pieprasījums žurnālā: metode, adrese, statuss, laiks un nosūtītie/saņemtie dati.
// Komponente ir tīra: viss, kas jāparāda (arī serveris un ceļš), jau ir ierakstā.
export default function LogEntry({ entry }: { entry: RequestLogEntry }) {
    const { method, host, path, external, status, body, data, ms, via, time } = entry;
    const ok = status >= 200 && status < 300;

    return (
        <li className={ok ? 'ok' : 'fail'}>
            <details>
                <summary>
                    <span className={`method method-${method.toLowerCase()}`}>{method}</span>
                    {/* Pieprasījumiem uz citu serveri (piemēram, JokeAPI) parāda arī serveri un filtrus */}
                    <span className="url">{external ? host : ''}{path}</span>
                    <span className={`via via-${via.toLowerCase()}`} title="Ar kuru metodi nosūtīts">{via}</span>
                    <span className="status">{status || 'nav savienojuma'}</span>
                    <span className="muted">{`${ms} ms`}</span>
                    <span className="muted time">{time}</span>
                </summary>
                <div className="log-body">
                    {body !== undefined && (
                        <div>
                            <p className="log-label">Nosūtīts</p>
                            <pre>{JSON.stringify(hidePasswords(body), null, 2)}</pre>
                        </div>
                    )}
                    <div>
                        <p className="log-label">Saņemts</p>
                        <pre>{typeof data === 'string' ? data : JSON.stringify(data, null, 2)}</pre>
                    </div>
                </div>
            </details>
        </li>
    );
}
