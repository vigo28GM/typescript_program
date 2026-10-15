import { STATUS_LABELS, statusName } from '../format.ts';

export default function StatusBadge({ id }: { id: number }) {
    const name = statusName(id);
    return <span className={`badge badge-${name}`}>{STATUS_LABELS[name] ?? name}</span>;
}
