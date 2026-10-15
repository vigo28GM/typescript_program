import type { CSSProperties } from 'react';

interface AvatarProps {
    label: string;
    id: number | string;
    size?: 'small' | 'large' | '';
}

// Krāsains aplītis ar burtu vai numuru – krāsa atkarīga no lietotāja ID
export default function Avatar({ label, id, size = '' }: AvatarProps) {
    const hue = (Number(id) * 67) % 360;
    // React stila tipi nepazīst CSS mainīgos (--hue), tāpēc nepieciešama tipa norāde
    const style = { '--hue': hue } as CSSProperties;

    return (
        <span className={`avatar ${size}`.trim()} style={style} aria-hidden="true">
            {label}
        </span>
    );
}
