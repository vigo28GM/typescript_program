import { createContext, useContext } from 'react';
import type { AjaxMethod } from './api.ts';
import type { PostsState } from './hooks/usePosts.ts';
import type { ViewName } from './hooks/useHashView.ts';
import type { RunFn, ToastType, User } from './types.ts';

// Viss, ko vajag vairākiem komponentiem (lietotājs, ieraksti, paziņojumi…),
// tiek nodots caur šo kontekstu, nevis cauri katram komponentam ar props.
export interface AppContextValue {
    user: User | null;
    setSession: (user: User | null, token: string | null) => void;
    run: RunFn;
    notify: (message: string, type?: ToastType) => void;
    go: (view: ViewName) => void;
    posts: PostsState;
    method: AjaxMethod;
    changeMethod: (name: AjaxMethod) => void;
    slow: boolean;
    changeSlow: (value: boolean) => void;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
    const value = useContext(AppContext);
    // Ja komponente ir ārpus <AppContext.Provider>, labāk uzreiz saprotama kļūda nekā null
    if (value === null) throw new Error('useApp jālieto komponentē, kas atrodas iekš <AppContext.Provider>');
    return value;
}
