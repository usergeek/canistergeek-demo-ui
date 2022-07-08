import * as React from "react";
import {PropsWithChildren, Reducer, useCallback, useReducer, useState} from "react";
import {useCustomCompareCallback, useCustomCompareEffect, useCustomCompareMemo} from "use-custom-compare";
import _ from "lodash"
import {HttpAgent, Identity} from "@dfinity/agent";
import {Principal} from "@dfinity/principal";
import {usePlugAuthProviderContext} from "./plug/PlugAuthProvider";
import {Source, useAuthSourceProviderContext} from "./authSource/AuthSourceProvider";
import {unstable_batchedUpdates} from "react-dom";
import {useInternetIdentityAuthProviderContext} from "./internetIdentity/InternetIdentityAuthProvider";
import {useStoicAuthProviderContext} from "./stoic/StoicAuthProvider";
import {useNFIDInternetIdentityAuthProviderContext} from "./nfid/NFIDAuthProvider";
import {AuthAccount} from "./AuthCommon";

type ContextStatus = {
    inProgress: boolean
    isReady: boolean
    isLoggedIn: boolean
}

type ContextState = {
    identity: Identity | undefined
    accounts: Array<AuthAccount>
    currentAccount: number | undefined
    httpAgent: HttpAgent | undefined
}

type LoginFn = (source: Source) => Promise<boolean>
type LogoutFn = (source: Source) => void
type SwitchAccountFn = (targetAccount: number) => void
type GetCurrentPrincipalFn = () => Principal | undefined
type GetCurrentAccountFn = () => AuthAccount | undefined

interface Context {
    source: Source
    status: ContextStatus
    state: ContextState
    login: LoginFn
    logout: LogoutFn
    switchAccount: SwitchAccountFn
    getCurrentPrincipal: GetCurrentPrincipalFn
    getCurrentAccount: GetCurrentAccountFn
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
        accounts: [],
        currentAccount: undefined,
        httpAgent: undefined,
    },
    login: () => Promise.reject(),
    logout: () => undefined,
    switchAccount: (targetAccount: number) => undefined,
    getCurrentPrincipal: () => undefined,
    getCurrentAccount: () => undefined,
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
    const nfidInternetIdentityAuthProviderContext = useNFIDInternetIdentityAuthProviderContext();

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
                return internetIdentityAuthProviderContext.login(process.env.II_URL)
            }
            case "NFID": {
                return nfidInternetIdentityAuthProviderContext.login(process.env.NFID_II_URL)
            }
            case "Stoic": {
                return stoicAuthProviderContext.login()
            }
        }
        return false
    }, [plugAuthProviderContext.login, internetIdentityAuthProviderContext.login, nfidInternetIdentityAuthProviderContext.login, stoicAuthProviderContext.login,])

    const logout: LogoutFn = useCallback<LogoutFn>(async (source: Source) => {
        switch (source) {
            case "Plug": {
                return plugAuthProviderContext.logout()
            }
            case "II": {
                return internetIdentityAuthProviderContext.logout()
            }
            case "NFID": {
                return nfidInternetIdentityAuthProviderContext.logout()
            }
            case "Stoic": {
                return stoicAuthProviderContext.logout()
            }
        }
    }, [plugAuthProviderContext.logout, internetIdentityAuthProviderContext.logout, nfidInternetIdentityAuthProviderContext.logout, stoicAuthProviderContext.logout,])

    const switchAccount: SwitchAccountFn = useCustomCompareCallback((targetAccount: number) => {
        // console.log("switchAccount: targetAccount", targetAccount);
        // console.log("switchAccount: contextState.accounts", contextState.accounts);
        if (contextState.accounts.length > targetAccount) {
            const newContextState = {
                ...contextState,
                currentAccount: targetAccount
            };
            // console.log("switchAccount: newContextState", newContextState);
            updateContextState(newContextState)
        }
    }, [contextState], _.isEqual)

    const getCurrentPrincipal: GetCurrentPrincipalFn = useCustomCompareCallback(() => {
        // console.log("getCurrentAccount: contextStatus.isReady", contextStatus.isReady);
        // console.log("getCurrentAccount: contextStatus.isLoggedIn", contextStatus.isLoggedIn);
        // console.log("getCurrentAccount: contextState.identity", contextState.identity);
        if (contextStatus.isReady && contextStatus.isLoggedIn && contextState.identity != undefined) {
            return contextState.identity.getPrincipal()
        }
        return undefined
    }, [contextState.identity, contextStatus], _.isEqual)

    const getCurrentAccount: GetCurrentAccountFn = useCustomCompareCallback(() => {
        // console.log("getCurrentAccount: currentAccount", contextState.currentAccount);
        // console.log("switchAccount: contextState.accounts", contextState.accounts);
        if (contextState.currentAccount != undefined && contextState.accounts.length > contextState.currentAccount) {
            return contextState.accounts[contextState.currentAccount]
        }
        return undefined
    }, [contextState], _.isEqual)

    useCustomCompareEffect(() => {
        const source = authSourceProviderContext.source;
        let status: ContextStatus = _.cloneDeep(initialContextValue.status)
        let state: ContextState = _.cloneDeep(initialContextValue.state)
        switch (source) {
            case "Plug": {
                status = plugAuthProviderContext.status
                state = {
                    identity: plugAuthProviderContext.state.identity,
                    accounts: plugAuthProviderContext.state.accounts,
                    currentAccount: 0,
                    httpAgent: plugAuthProviderContext.state.httpAgent,
                }
                break
            }
            case "II": {
                status = internetIdentityAuthProviderContext.status
                state = {
                    identity: internetIdentityAuthProviderContext.state.identity,
                    accounts: internetIdentityAuthProviderContext.state.accounts,
                    currentAccount: 0,
                    httpAgent: undefined,
                }
                break
            }
            case "NFID": {
                status = nfidInternetIdentityAuthProviderContext.status
                state = {
                    identity: nfidInternetIdentityAuthProviderContext.state.identity,
                    accounts: nfidInternetIdentityAuthProviderContext.state.accounts,
                    currentAccount: 0,
                    httpAgent: undefined,
                }
                break
            }
            case "Stoic": {
                status = stoicAuthProviderContext.status
                state = {
                    identity: stoicAuthProviderContext.state.identity,
                    accounts: stoicAuthProviderContext.state.accounts,
                    currentAccount: 0,
                    httpAgent: undefined,
                }
                break
            }
            default: {
                const isReady = _.some([
                    plugAuthProviderContext.status,
                    internetIdentityAuthProviderContext.status,
                    nfidInternetIdentityAuthProviderContext.status,
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
        nfidInternetIdentityAuthProviderContext.status,
        nfidInternetIdentityAuthProviderContext.state,
        stoicAuthProviderContext.status,
        stoicAuthProviderContext.state,
    ], _.isEqual)

    const value = useCustomCompareMemo<Context, [
        Source,
        ContextStatus,
        ContextState,
        LoginFn,
        LogoutFn,
        SwitchAccountFn,
        GetCurrentPrincipalFn,
        GetCurrentAccountFn,
    ]>(() => ({
        source: contextSource,
        status: contextStatus,
        state: contextState,
        login: login,
        logout: logout,
        switchAccount: switchAccount,
        getCurrentPrincipal: getCurrentPrincipal,
        getCurrentAccount: getCurrentAccount,
    }), [
        contextSource,
        contextStatus,
        contextState,
        login,
        logout,
        switchAccount,
        getCurrentPrincipal,
        getCurrentAccount,
    ], _.isEqual)

    return <AuthProviderContext.Provider value={value}>
        {props.children}
    </AuthProviderContext.Provider>
}