import * as React from "react";
import {PropsWithChildren, Reducer, useCallback, useReducer, useState} from "react";
import {useCustomCompareEffect, useCustomCompareMemo} from "use-custom-compare";
import _ from "lodash"
import {Identity} from "@dfinity/agent";
import {usePlugAuthProviderContext} from "./plug/PlugAuthProvider";
import {Source, useAuthSourceProviderContext} from "./authSource/AuthSourceProvider";
import {unstable_batchedUpdates} from "react-dom";
import {useInternetIdentityAuthProviderContext} from "./internetIdentity/InternetIdentityAuthProvider";
import {useStoicAuthProviderContext} from "./stoic/StoicAuthProvider";

type ContextStatus = {
    inProgress: boolean
    isReady: boolean
    isLoggedIn: boolean
}

type ContextState = {
    identity: Identity | undefined
}

type LoginFn = (source: Source) => Promise<boolean>
type LogoutFn = (source: Source) => void

interface Context {
    source: Source
    status: ContextStatus
    state: ContextState
    login: LoginFn
    logout: LogoutFn
}

const initialContextValue: Context = {
    source: undefined,
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


const AuthProviderContext = React.createContext<Context | undefined>(undefined)

export const useAuthProviderContext = () => {
    const context = React.useContext<Context | undefined>(AuthProviderContext)
    if (!context) {
        throw new Error("useAuthProviderContext must be used within a AuthProviderContext.Provider")
    }
    return context;
};

export const AuthProvider = (props: PropsWithChildren<any>) => {
    const authSourceProviderContext = useAuthSourceProviderContext();
    const plugAuthProviderContext = usePlugAuthProviderContext();
    const stoicAuthProviderContext = useStoicAuthProviderContext()
    const internetIdentityAuthProviderContext = useInternetIdentityAuthProviderContext();

    const [contextSource, setContextSource] = useState<Source>(() => {
        return authSourceProviderContext.source
    })

    const [contextStatus, updateContextStatus] = useReducer<Reducer<ContextStatus, Partial<ContextStatus>>>(
        (state, newState) => ({...state, ...newState}),
        _.cloneDeep(initialContextValue.status)
    )

    const [contextState, updateContextState] = useReducer<Reducer<ContextState, Partial<ContextState>>>(
        (state, newState) => ({...state, ...newState}),
        _.cloneDeep(initialContextValue.state)
    )

    const login: LoginFn = useCallback<LoginFn>(async (source: Source) => {
        switch (source) {
            case "Plug": {
                return plugAuthProviderContext.login()
            }
            case "II": {
                return internetIdentityAuthProviderContext.login()
            }
            case "Stoic": {
                return stoicAuthProviderContext.login()
            }
        }
        return false
    }, [plugAuthProviderContext.login, internetIdentityAuthProviderContext.login, stoicAuthProviderContext.login,])

    const logout: LogoutFn = useCallback<LogoutFn>(async (source: Source) => {
        switch (source) {
            case "Plug": {
                return plugAuthProviderContext.logout()
            }
            case "II": {
                return internetIdentityAuthProviderContext.logout()
            }
            case "Stoic": {
                return stoicAuthProviderContext.logout()
            }
        }
    }, [plugAuthProviderContext.logout, internetIdentityAuthProviderContext.logout, stoicAuthProviderContext.logout,])


    useCustomCompareEffect(() => {
        const source = authSourceProviderContext.source;
        let status: ContextStatus = _.cloneDeep(initialContextValue.status)
        let state: ContextState = _.cloneDeep(initialContextValue.state)
        switch (source) {
            case "Plug": {
                status = plugAuthProviderContext.status
                state = plugAuthProviderContext.state
                break
            }
            case "II": {
                status = internetIdentityAuthProviderContext.status
                state = internetIdentityAuthProviderContext.state
                break
            }
            case "Stoic": {
                status = stoicAuthProviderContext.status
                state = stoicAuthProviderContext.state
                break
            }
            default: {
                const isReady = _.some([
                    plugAuthProviderContext.status,
                    internetIdentityAuthProviderContext.status,
                    stoicAuthProviderContext.status,
                ], value => {
                    return value.isReady
                });
                status.isReady = isReady
            }
        }
        unstable_batchedUpdates(() => {
            setContextSource(source)
            updateContextStatus(status)
            updateContextState(state)
        })
    }, [
        authSourceProviderContext.source,
        plugAuthProviderContext.status,
        plugAuthProviderContext.state,
        internetIdentityAuthProviderContext.status,
        internetIdentityAuthProviderContext.state,
        stoicAuthProviderContext.status,
        stoicAuthProviderContext.state,
    ], (prevDeps, nextDeps) => {
        return _.isEqual(prevDeps, nextDeps)
    })

    const value = useCustomCompareMemo<Context, [
        Source,
        ContextStatus,
        ContextState,
        LoginFn,
        LogoutFn,
    ]>(() => ({
        source: contextSource,
        status: contextStatus,
        state: contextState,
        login: login,
        logout: logout,
    }), [
        contextSource,
        contextStatus,
        contextState,
        login,
        logout,
    ], (prevDeps, nextDeps) => {
        return _.isEqual(prevDeps, nextDeps)
    })

    return <AuthProviderContext.Provider value={value}>
        {props.children}
    </AuthProviderContext.Provider>
}