import * as React from "react";
import {PropsWithChildren, useCallback, useState} from "react";
import {useCustomCompareMemo} from "use-custom-compare";
import _ from "lodash"
import {KeyValueStoreFacade} from "canistergeek-ic-js";

const keyValueStore = KeyValueStoreFacade.createStore("canistergeek__");

export type Source = "II" | "Plug" | "Stoic" | undefined

type SetSourceFn = (source: Source) => void

interface Context {
    source: Source
    setSource: SetSourceFn
}

const AuthSourceProviderContext = React.createContext<Context | undefined>(undefined)
export const useAuthSourceProviderContext = () => {
    const context = React.useContext<Context | undefined>(AuthSourceProviderContext)
    if (!context) {
        throw new Error("useAuthSourceProviderContext must be used within a AuthSourceProviderContext.Provider")
    }
    return context;
};

const LOCAL_STORAGE__KEY__SOURCE = "key__source";
const initialSourceInLocalStorage = keyValueStore.get(LOCAL_STORAGE__KEY__SOURCE)

export const AuthSourceProvider = (props: PropsWithChildren<any>) => {
    // RESULT
    const [source, setSource] = useState<Source>(initialSourceInLocalStorage ? initialSourceInLocalStorage as Source : undefined)

    const setSourceFn: SetSourceFn = useCallback<SetSourceFn>((source: Source) => {
        if (source) {
            keyValueStore.set(LOCAL_STORAGE__KEY__SOURCE, source)
        } else {
            keyValueStore.remove(LOCAL_STORAGE__KEY__SOURCE)
        }
        setSource(source)
    }, [])

    const value = useCustomCompareMemo<Context, [
        Source,
        SetSourceFn
    ]>(() => ({
        source: source,
        setSource: setSourceFn
    }), [
        source,
        setSource,
    ], (prevDeps, nextDeps) => {
        return _.isEqual(prevDeps[0], nextDeps[0])
    })

    return <AuthSourceProviderContext.Provider value={value}>
        {props.children}
    </AuthSourceProviderContext.Provider>
}