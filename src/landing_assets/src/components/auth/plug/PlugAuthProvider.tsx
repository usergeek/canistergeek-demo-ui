import * as React from "react";
import {PropsWithChildren, Reducer, useCallback, useEffect, useReducer} from "react";
import {unstable_batchedUpdates} from "react-dom";
import {useCustomCompareCallback, useCustomCompareMemo} from "use-custom-compare";
import _ from "lodash";
import {useAuthSourceProviderContext} from "../authSource/AuthSourceProvider";
import {PlugHelper} from "./plugHelper";
import {Identity} from "@dfinity/agent";
import {useConfigurationContext} from "canistergeek-ic-js";
import {Configuration} from "canistergeek-ic-js/lib/es5/dataProvider/ConfigurationProvider";

type ContextStatus = {
    inProgress: boolean
    isReady: boolean
    isLoggedIn: boolean
}

type ContextState = {
    identity: Identity | undefined
}

type LoginFn = () => Promise<boolean>
type LogoutFn = () => void

interface Context {
    status: ContextStatus
    state: ContextState
    login: LoginFn
    logout: LogoutFn
}

const initialContextValue: Context = {
    status: {
        inProgress: false,
        isReady: false,
        isLoggedIn: false,
    },
    state: {
        identity: undefined,
    },
    login: () => Promise.reject(),
    logout: () => undefined,
}

const PlugAuthProviderContext = React.createContext<Context | undefined>(undefined)
export const usePlugAuthProviderContext = () => {
    const context = React.useContext<Context | undefined>(PlugAuthProviderContext);
    if (!context) {
        throw new Error("usePlugAuthProviderContext must be used within a PlugAuthProviderContext.Provider")
    }
    return context;
};

type Props = {}

export const PlugAuthProvider = (props: PropsWithChildren<Props>) => {
    const configurationContext = useConfigurationContext();
    const authSourceProviderContext = useAuthSourceProviderContext();

    // STATE

    const [contextStatus, updateContextStatus] = useReducer<Reducer<ContextStatus, Partial<ContextStatus>>>(
        (state, newState) => ({...state, ...newState}),
        _.cloneDeep(initialContextValue.status)
    )

    const [contextState, updateContextState] = useReducer<Reducer<ContextState, Partial<ContextState>>>(
        (state, newState) => ({...state, ...newState}),
        _.cloneDeep(initialContextValue.state)
    )

    const login: LoginFn = useCustomCompareCallback<LoginFn, [Configuration]>(async () => {
        try {
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource("Plug")
                updateContextStatus({inProgress: true})
            })
            const identity = await PlugHelper.login(configurationContext.configuration.canisters.map(v => v.canisterId))
            if (identity) {
                unstable_batchedUpdates(() => {
                    updateContextStatus({isLoggedIn: true, inProgress: false})
                    updateContextState({identity: identity})
                })
                return true
            }
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false, inProgress: false})
                updateContextState({identity: undefined})
            })
        } catch (e) {
            console.error("PlugAuthProvider: login: caught error", e);
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false, inProgress: false})
                updateContextState({identity: undefined})
            })
        }
        return false
    }, [configurationContext.configuration], (prevDeps, nextDeps) => {
        return _.isEqual(prevDeps, nextDeps)
    })

    const logout: LogoutFn = useCallback<LogoutFn>(async () => {
        unstable_batchedUpdates(() => {
            authSourceProviderContext.setSource(undefined)
            updateContextStatus({isLoggedIn: false})
            updateContextState({identity: undefined})
        })
    }, [])

    // EFFECT

    useEffect(() => {
        (async () => {
            try {
                if (authSourceProviderContext.source == "Plug") {
                    updateContextStatus({inProgress: true})
                    const identity = await PlugHelper.getLoggedInIdentity(configurationContext.configuration.canisters.map(v => v.canisterId))
                    if (identity) {
                        unstable_batchedUpdates(() => {
                            updateContextStatus({isReady: true, isLoggedIn: true, inProgress: false})
                            updateContextState({identity: identity})
                        })
                        return
                    }
                }
                unstable_batchedUpdates(() => {
                    if (authSourceProviderContext.source == "Plug") {
                        authSourceProviderContext.setSource(undefined)
                    }
                    updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                    updateContextState({identity: undefined})
                })
            } catch (e) {
                console.error("PlugAuthProvider: useEffect[]: caught error", authSourceProviderContext.source, e);
                unstable_batchedUpdates(() => {
                    if (authSourceProviderContext.source == "Plug") {
                        authSourceProviderContext.setSource(undefined)
                    }
                    updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                    updateContextState({identity: undefined})
                })
            }
        })()
    }, [])

    useEffect(() => {
        (async () => {
            if (contextStatus.isLoggedIn) {
                await login()
            }
        })()

    }, [configurationContext.configuration, contextStatus.isLoggedIn])

    // RESULT

    const value = useCustomCompareMemo<Context, [
        ContextStatus,
        ContextState,
        LoginFn,
        LogoutFn,
    ]>(() => ({
        status: contextStatus,
        state: contextState,
        login: login,
        logout: logout,
    }), [
        contextStatus,
        contextState,
        login,
        logout,
    ], (prevDeps, nextDeps) => {
        return _.isEqual(prevDeps, nextDeps)
    })

    return <PlugAuthProviderContext.Provider value={value}>
        {props.children}
    </PlugAuthProviderContext.Provider>
}