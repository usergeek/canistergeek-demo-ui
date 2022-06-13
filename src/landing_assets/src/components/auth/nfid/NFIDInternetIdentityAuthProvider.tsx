import * as React from "react";
import {PropsWithChildren, Reducer, useCallback, useEffect, useReducer} from "react";
import {unstable_batchedUpdates} from "react-dom";
import {useCustomCompareMemo} from "use-custom-compare";
import _ from "lodash";
import {Source, useAuthSourceProviderContext} from "../authSource/AuthSourceProvider";
import {Identity} from "@dfinity/agent";
import {NFIDAuthClientFacade as AuthClientFacade} from "./NFIDAuthClientFacade";

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

const NFIDInternetIdentityAuthProviderContext = React.createContext<Context | undefined>(undefined)
export const useNFIDInternetIdentityAuthProviderContext = () => {
    const context = React.useContext<Context | undefined>(NFIDInternetIdentityAuthProviderContext);
    if (!context) {
        throw new Error("useNFIDInternetIdentityAuthProviderContext must be used within a NFIDInternetIdentityAuthProviderContext.Provider")
    }
    return context;
};

const PROVIDER_SOURCE: Source = "NFID"

export const NFIDInternetIdentityAuthProvider = (props: PropsWithChildren<any>) => {

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
                authSourceProviderContext.setSource(PROVIDER_SOURCE)
                updateContextStatus({inProgress: true})
            })
            const authClient = await AuthClientFacade.provideAuthClient();
            if (authClient) {
                const identity: Identity | undefined = await AuthClientFacade.login(authClient)
                if (identity) {
                    unstable_batchedUpdates(() => {
                        updateContextStatus({isLoggedIn: true, inProgress: false})
                        updateContextState({identity: identity})
                    })
                    return true
                }
            }
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false, inProgress: false})
                updateContextState({identity: undefined})
            })
        } catch (e) {
            console.error("NFIDInternetIdentityAuthProvider: login: caught error", e);
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false, inProgress: false})
                updateContextState({identity: undefined})
            })
        }
        return false
    }, [])

    const logout: LogoutFn = useCallback<LogoutFn>(async () => {
        const authClient = await AuthClientFacade.provideAuthClient();
        try {
            if (authClient) {
                await AuthClientFacade.logout(authClient)
            }
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false})
                updateContextState({identity: undefined})
            })
        } catch (e) {
            console.error("NFIDInternetIdentityAuthProvider: logout: caught error", e);
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false})
                updateContextState({identity: undefined})
            })
        }

    }, [])

    // EFFECT

    useEffect(() => {
        (async () => {
            try {
                if (authSourceProviderContext.source == PROVIDER_SOURCE) {
                    updateContextStatus({inProgress: true})
                    const authClient = await AuthClientFacade.provideAuthClient();
                    if (authClient) {
                        const identity = await AuthClientFacade.restoreIdentity(authClient)
                        if (identity) {
                            unstable_batchedUpdates(() => {
                                updateContextStatus({isReady: true, isLoggedIn: true, inProgress: false})
                                updateContextState({identity: identity})
                            })
                            return
                        }
                    }
                    unstable_batchedUpdates(() => {
                        authSourceProviderContext.setSource(undefined)
                        updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                        updateContextState({identity: undefined})
                    })
                }
                unstable_batchedUpdates(() => {
                    if (authSourceProviderContext.source == PROVIDER_SOURCE) {
                        authSourceProviderContext.setSource(undefined)
                    }
                    updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                    updateContextState({identity: undefined})
                })
            } catch (e) {
                console.error("NFIDInternetIdentityAuthProvider: useEffect[]: caught error", authSourceProviderContext.source, e);
                unstable_batchedUpdates(() => {
                    if (authSourceProviderContext.source == PROVIDER_SOURCE) {
                        authSourceProviderContext.setSource(undefined)
                    }
                    updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                    updateContextState({identity: undefined})
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

    return <NFIDInternetIdentityAuthProviderContext.Provider value={value}>
        {props.children}
    </NFIDInternetIdentityAuthProviderContext.Provider>
}

