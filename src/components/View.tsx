import type { ReactNode } from 'react';
import type { ViewName } from '../hooks/useHashView.ts';

interface ViewProps {
    name: ViewName;
    active: boolean;
    narrow?: boolean;
    children: ReactNode;
}

// Viena lapas sadaļa. Visas sadaļas vienmēr ir lapā, neaktīvās ir paslēptas,
// tāpēc to saturs (piemēram, uzrakstīts, bet neizsūtīts teksts) nepazūd, pārslēdzoties.
export default function View({ name, active, narrow = false, children }: ViewProps) {
    return (
        <section className={`view${narrow ? ' narrow' : ''}`} data-view={name} hidden={!active}>
            {children}
        </section>
    );
}
