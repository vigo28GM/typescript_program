import Button from './Button.tsx';

interface DeleteButtonProps {
    /** Teksts apstiprinājuma logā */
    confirmText: string;
    loading?: boolean;
    onConfirm: () => void;
    children?: string;
}

// Dzēšanas poga: pirms izpildes vienmēr jautā apstiprinājumu
export default function DeleteButton({ confirmText, loading = false, onConfirm, children = 'Dzēst' }: DeleteButtonProps) {
    const click = () => {
        if (window.confirm(confirmText)) onConfirm();
    };
    return (
        <Button className="ghost danger" data-action="delete" loading={loading} onClick={click}>
            {children}
        </Button>
    );
}
