import type { FormEvent } from 'react';
import { Api } from '../api.ts';
import { useApp } from '../AppContext.ts';
import AuthRequired from '../components/AuthRequired.tsx';
import Button from '../components/Button.tsx';
import View from '../components/View.tsx';
import { readForm } from '../format.ts';
import { useRunner } from '../hooks/useRunner.ts';

type RoleAction = 'assign' | 'remove';

export default function RolesView({ active }: { active: boolean }) {
    const { user, notify } = useApp();
    const [busy, perform] = useRunner();

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // submitter ir poga, ar kuru forma nosūtīta. Tas var nebūt zināms (piemēram, nosūtot ar kodu),
        // un tad izvēlas drošo darbību (piešķirt), nevis dzēšanu.
        const { submitter } = event.nativeEvent as SubmitEvent;
        const action: RoleAction = submitter instanceof HTMLButtonElement && submitter.value === 'remove' ? 'remove' : 'assign';
        const { user_id: userId, role_id: roleId } = readForm<{ user_id: string; role_id: string }>(event.currentTarget);
        const call = action === 'remove' ? Api.removeRole : Api.assignRole;
        const result = await perform(action, () => call(userId, Number(roleId)));
        if (result?.message) notify(result.message);
    };

    return (
        <View name="roles" active={active} narrow>
            <header className="page-head">
                <div>
                    <h1>Lietotāju lomas</h1>
                    <p className="lead">Piešķir vai noņem lietotājam lomu. Lietotāja ID redzams pie katra ieraksta („autors #…”).</p>
                </div>
            </header>

            {user ? (
                <div className="card">
                    <form id="role-form" className="stack" onSubmit={submit}>
                        <div className="grid-2">
                            <label>
                                Lietotāja ID
                                <input name="user_id" type="number" min="1" required placeholder="1" />
                            </label>
                            <label>
                                Loma
                                <select name="role_id" defaultValue="1">
                                    <option value="1">guest</option>
                                    <option value="2">admin</option>
                                </select>
                            </label>
                        </div>
                        <div className="form-actions">
                            <Button type="submit" value="remove" className="danger" loading={busy === 'remove'}>Noņemt lomu</Button>
                            <Button type="submit" value="assign" className="primary" loading={busy === 'assign'}>Piešķirt lomu</Button>
                        </div>
                    </form>
                </div>
            ) : (
                <AuthRequired />
            )}

            <p className="endpoints">
                <code>POST /api/users/{'{id}'}/assign-role</code> <code>POST /api/users/{'{id}'}/remove-role</code>
            </p>
        </View>
    );
}
