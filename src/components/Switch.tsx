import type { ChangeEventHandler } from 'react';

interface SwitchProps {
    checked: boolean;
    onChange: ChangeEventHandler<HTMLInputElement>;
    label: string;
    hint?: string;
    name?: string;
    value?: string;
    disabled?: boolean;
    onText?: string;
    offText?: string;
}

// Ieslēdzams / izslēdzams slēdzis, kas vienmēr tekstā parāda, vai filtrs ir ieslēgts vai izslēgts.
// Tas ir parasts izvēles rūtiņas elements (tastatūra un lasītāji to saprot), tikai citādi izskatās.
export default function Switch({
    checked, onChange, label, hint, name, value, disabled = false, onText = 'Ieslēgts', offText = 'Izslēgts',
}: SwitchProps) {
    const classes = ['switch', checked ? 'on' : '', disabled ? 'disabled' : ''].filter(Boolean).join(' ');

    return (
        <label className={classes}>
            <input type="checkbox" role="switch" name={name} value={value} checked={checked} disabled={disabled} onChange={onChange} />
            <span className="switch-track" aria-hidden="true">
                <span className="switch-knob" />
            </span>
            <span className="switch-body">
                <span className="switch-label">{label}</span>
                {hint && <span className="switch-hint">{hint}</span>}
            </span>
            <span className="switch-state">{checked ? onText : offText}</span>
        </label>
    );
}
