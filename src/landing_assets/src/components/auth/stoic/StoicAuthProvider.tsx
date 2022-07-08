import * as React from "react";
import {PropsWithChildren, Reducer, useCallback, useEffect, useReducer} from "react";
import {unstable_batchedUpdates} from "react-dom";
import {useCustomCompareMemo} from "use-custom-compare";
import _ from "lodash";
import {StoicIdentity} from "ic-stoic-identity";
import {useAuthSourceProviderContext} from "../authSource/AuthSourceProvider";
import {Identity} from "@dfinity/agent";
import {AuthAccount} from "../AuthCommon";

type ContextStatus = {
    inProgress: boolean
    isReady: boolean
    isLoggedIn: boolean
}

type ContextState = {
    identity: Identity | undefined
    accounts: Array<AuthAccount>
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
        accounts: []
    },
    login: () => Promise.reject(),
    logout: () => undefined,
}

const StoicAuthProviderContext = React.createContext<Context | undefined>(undefined)
export const useStoicAuthProviderContext = () => {
    const context = React.useContext<Context | undefined>(StoicAuthProviderContext);
    if (!context) {
        throw new Error("useStoicAuthProviderContext must be used within a StoicAuthProviderContext.Provider")
    }
    return context;
};

type Props = {}

export const StoicAuthProvider = (props: PropsWithChildren<Props>) => {
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

    const login: LoginFn = useCallback<LoginFn>(async () => {
        try {
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource("Stoic")
                updateContextStatus({inProgress: true})
            })
            const identity = await StoicIdentity.connect();
            if (identity) {
                const accounts = await getIdentityAccounts(identity)
                unstable_batchedUpdates(() => {
                    updateContextStatus({isLoggedIn: true, inProgress: false})
                    updateContextState({identity: identity, accounts: accounts})
                })
                return true
            }
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false, inProgress: false})
                updateContextState({identity: undefined, accounts: []})
            })
        } catch (e) {
            console.error("StoicAuthProvider: login: caught error", e);
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false, inProgress: false})
                updateContextState({identity: undefined, accounts: []})
            })
        }
        return false
    }, [])

    const logout: LogoutFn = useCallback<LogoutFn>(async () => {
        StoicIdentity.disconnect();
        unstable_batchedUpdates(() => {
            authSourceProviderContext.setSource(undefined)
            updateContextStatus({isLoggedIn: false})
            updateContextState({identity: undefined, accounts: []})
        })
    }, [])

    // EFFECT

    useEffect(() => {
        (async () => {
            try {
                if (authSourceProviderContext.source == "Stoic") {
                    updateContextStatus({inProgress: true})
                    const identity = await StoicIdentity.load();
                    if (identity) {
                        const accounts = await getIdentityAccounts(identity)
                        unstable_batchedUpdates(() => {
                            updateContextStatus({isReady: true, isLoggedIn: true, inProgress: false})
                            updateContextState({identity: identity, accounts: accounts})
                        })
                        return
                    }
                }
                unstable_batchedUpdates(() => {
                    if (authSourceProviderContext.source == "Stoic") {
                        authSourceProviderContext.setSource(undefined)
                    }
                    updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                    updateContextState({identity: undefined, accounts: []})
                })
            } catch (e) {
                console.error("StoicAuthProvider: useEffect[]: caught error", authSourceProviderContext.source, e);
                unstable_batchedUpdates(() => {
                    if (authSourceProviderContext.source == "Stoic") {
                        authSourceProviderContext.setSource(undefined)
                    }
                    updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                    updateContextState({identity: undefined, accounts: []})
                })
            }
        })()
    }, [])

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

    return <StoicAuthProviderContext.Provider value={value}>
        {props.children}
    </StoicAuthProviderContext.Provider>
}

const getIdentityAccounts = async (identity: any): Promise<Array<AuthAccount>> => {
    try {
        const accountsResult = JSON.parse(await identity.accounts())
        const accounts: Array<AuthAccount> = _.map<any, AuthAccount>(accountsResult, v => ({
            name: v.name,
            accountIdentifier: v.address
        }))
        return accounts
    } catch (e) {
        return []
    }
}