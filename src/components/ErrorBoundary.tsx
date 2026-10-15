import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Api } from '../api.ts';

// Saglabātie iestatījumi, kas var būt bojāti un radīt kļūdu jau pie palaišanas
const STORED_KEYS = ['apiUrl', 'user', 'token', 'ajaxMethod', 'slowMode'];

interface Props {
    children: ReactNode;
}

interface State {
    error: unknown; // kļūda, ko React notvēra (null = viss kārtībā)
}

// Ja kāds komponents renderēšanas laikā izmet kļūdu, React citādi noņem VISU lapu (paliek tukša lapa).
// Šis komponents to notver un parāda saprotamu ziņojumu ar iespēju atgūties.
// Kļūdu robežas notver kļūdas renderēšanā; kļūdas notikumu apstrādātājos un async kodā tās nenotver.
// (Tāpēc tā ir klase: React pagaidām atbalsta kļūdu robežas tikai klašu komponentēm.)
export default class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: unknown): State {
        return { error };
    }

    componentDidCatch(error: unknown, info: ErrorInfo): void {
        console.error('React kļūda:', error, info.componentStack);
    }

    tryAgain = (): void => {
        this.setState({ error: null });
    };

    clearAndReload = (): void => {
        STORED_KEYS.forEach((key) => Api.store.remove(key));
        window.location.reload();
    };

    render() {
        const { error } = this.state;
        if (!error) return this.props.children;

        // Izmest var jebko (arī tekstu), tāpēc ziņojumu ņem tikai no īstas kļūdas
        const message = error instanceof Error ? error.message : String(error);

        return (
            <main className="container">
                <div className="card error-screen" role="alert">
                    <h1>Kaut kas nogāja greizi</h1>
                    <p className="lead">Lapā notika neparedzēta kļūda. Dati serverī nav bojāti.</p>
                    <pre className="error-details">{message}</pre>
                    <div className="form-actions">
                        <button type="button" onClick={this.tryAgain}>Mēģināt vēlreiz</button>
                        <button type="button" className="primary" onClick={this.clearAndReload}>
                            Notīrīt saglabātos iestatījumus un pārlādēt
                        </button>
                    </div>
                </div>
            </main>
        );
    }
}
