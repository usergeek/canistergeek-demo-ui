import * as React from "react";
import {PropsWithChildren, Reducer, useCallback, useEffect, useReducer} from "react";
import {unstable_batchedUpdates} from "react-dom";
import {useCustomCompareMemo} from "use-custom-compare";
import _ from "lodash";
import {Source, useAuthSourceProviderContext} from "../authSource/AuthSourceProvider";
import {Identity} from "@dfinity/agent";
import {AuthClientFacade} from "./AuthClientFacade";
import {AuthAccount} from "../AuthCommon";
import {Util} from "../util";

type ContextStatus = {
    inProgress: boolean
    isReady: boolean
    isLoggedIn: boolean
}

type ContextState = {
    identity: Identity | undefined
    accounts: Array<AuthAccount>
}

type LoginFn = (identityProvider: string | undefined) => Promise<boolean>
type LogoutFn = () => void

export interface Context {
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

export const InternetIdentityAuthProviderContext = React.createContext<Context | undefined>(undefined)
export const useInternetIdentityAuthProviderContext = () => {
    const context = React.useContext<Context | undefined>(InternetIdentityAuthProviderContext);
    if (!context) {
        throw new Error("useInternetIdentityAuthProviderContext must be used within a InternetIdentityAuthProviderContext.Provider")
    }
    return context;
};

type Props = {
    context: React.Context<Context | undefined>
    source: Source
}

export const InternetIdentityAuthProvider = (props: PropsWithChildren<Props>) => {

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

    const login: LoginFn = useCallback<LoginFn>(async (identityProvider: string | undefined) => {
        try {
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(props.source)
                updateContextStatus({inProgress: true})
            })
            const authClient = await AuthClientFacade.provideAuthClient();
            if (authClient) {
                const identity: Identity | undefined = await AuthClientFacade.login(authClient, identityProvider, props.source === "II" ? "II" : "NFID")
                if (identity) {
                    const accounts = await getIdentityAccounts(identity, props.source)
                    unstable_batchedUpdates(() => {
                        updateContextStatus({isLoggedIn: true, inProgress: false})
                        updateContextState({identity: identity, accounts: accounts})
                    })
                    return true
                }
            }
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false, inProgress: false})
                updateContextState({identity: undefined, accounts: []})
            })
        } catch (e) {
            console.error("InternetIdentityAuthProvider: login: caught error", e);
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false, inProgress: false})
                updateContextState({identity: undefined, accounts: []})
            })
        }
        return false
    }, [props.source])

    const logout: LogoutFn = useCallback<LogoutFn>(async () => {
        const authClient = await AuthClientFacade.provideAuthClient();
        try {
            if (authClient) {
                await AuthClientFacade.logout(authClient)
            }
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false})
                updateContextState({identity: undefined, accounts: []})
            })
        } catch (e) {
            console.error("InternetIdentityAuthProvider: logout: caught error", e);
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false})
                updateContextState({identity: undefined, accounts: []})
            })
        }

    }, [])

    // EFFECT

    useEffect(() => {
        (async () => {
            try {
                if (authSourceProviderContext.source == props.source) {
                    updateContextStatus({inProgress: true})
                    const authClient = await AuthClientFacade.provideAuthClient();
                    if (authClient) {
                        const identity = await AuthClientFacade.restoreIdentity(authClient)
                        if (identity) {
                            const accounts = await getIdentityAccounts(identity, props.source)
                            unstable_batchedUpdates(() => {
                                updateContextStatus({isReady: true, isLoggedIn: true, inProgress: false})
                                updateContextState({identity: identity, accounts: accounts})
                            })
                            return
                        }
                    }
                    unstable_batchedUpdates(() => {
                        authSourceProviderContext.setSource(undefined)
                        updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                        updateContextState({identity: undefined, accounts: []})
                    })
                }
                unstable_batchedUpdates(() => {
                    if (authSourceProviderContext.source == props.source) {
                        authSourceProviderContext.setSource(undefined)
                    }
                    updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                    updateContextState({identity: undefined, accounts: []})
                })
            } catch (e) {
                console.error("InternetIdentityAuthProvider: useEffect[]: caught error", authSourceProviderContext.source, e);
                unstable_batchedUpdates(() => {
                    if (authSourceProviderContext.source == props.source) {
                        authSourceProviderContext.setSource(undefined)
                    }
                    updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                    updateContextState({identity: undefined, accounts: []})
                })
            }
        })()
    }, [props.source])

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

    return <props.context.Provider value={value}>
        {props.children}
    </props.context.Provider>
}

const getIdentityAccounts = async (identity: Identity, source: Source): Promise<Array<AuthAccount>> => {
    try {
        return [{
            name: source === "II" ? "NNS Main Wallet" : "NFID Main Wallet",
            accountIdentifier: Util.principalToAccountIdentifier(identity.getPrincipal().toText(), 0)
        }]
    } catch (e) {
        return []
    }
}
