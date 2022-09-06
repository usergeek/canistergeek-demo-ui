import * as React from "react";
import {PropsWithChildren, Reducer, useCallback, useReducer, useState} from "react";
import {useCustomCompareCallback, useCustomCompareEffect, useCustomCompareMemo} from "use-custom-compare";
import _ from "lodash"
import {Actor, ActorConfig, ActorSubclass, HttpAgent, HttpAgentOptions, Identity} from "@dfinity/agent";
import {IDL} from '@dfinity/candid';
import {Principal} from "@dfinity/principal";
import {usePlugAuthProviderContext} from "./plug/PlugAuthProvider";
import {Source, useAuthSourceProviderContext} from "./authSource/AuthSourceProvider";
import {unstable_batchedUpdates} from "react-dom";
import {useInternetIdentityAuthProviderContext} from "./internetIdentity/InternetIdentityAuthProvider";
import {useStoicAuthProviderContext} from "./stoic/StoicAuthProvider";
import {useNFIDInternetIdentityAuthProviderContext} from "./nfid/NFIDAuthProvider";
import {AuthAccount} from "./AuthCommon";
import {useInfinityWalletAuthProviderContext} from "./infinityWallet/InfinityWalletAuthProvider";

type ContextStatus = {
    inProgress: boolean
    isReady: boolean
    isLoggedIn: boolean
}

type ContextState = {
    identity: Identity | undefined
    principal: Principal | undefined
    accounts: Array<AuthAccount>
    currentAccount: number | undefined
}

type LoginFn = (source: Source) => Promise<boolean>
type LogoutFn = (source: Source) => void
type SwitchAccountFn = (targetAccount: number) => void
type GetCurrentPrincipalFn = () => Principal | undefined
type GetCurrentAccountFn = () => AuthAccount | undefined

export type CreateActorOptions = { agentOptions?: HttpAgentOptions; actorOptions?: ActorConfig }
export type CreateActorFn = <T>(canisterId: string, idlFactory: IDL.InterfaceFactory, options?: CreateActorOptions) => Promise<ActorSubclass<T> | undefined>

interface Context {
    source: Source
    status: ContextStatus
    state: ContextState
    login: LoginFn
    logout: LogoutFn
    switchAccount: SwitchAccountFn
    getCurrentPrincipal: GetCurrentPrincipalFn
    getCurrentAccount: GetCurrentAccountFn
    createActor: CreateActorFn
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
        principal: undefined,
        accounts: [],
        currentAccount: undefined,
    },
    login: () => Promise.reject(),
    logout: () => undefined,
    switchAccount: (targetAccount: number) => undefined,
    getCurrentPrincipal: () => undefined,
    getCurrentAccount: () => undefined,
    createActor: () => Promise.resolve(undefined),
}


const AuthProviderContext = React.createContext<Context | undefined>(undefined)

export const useAuthProviderContext = () => {
    const context = React.useContext<Context | undefined>(AuthProviderContext)
    if (!context) {
        throw new Error("useAuthProviderContext must be used within a AuthProviderContext.Provider")
    }
    return context;
};

type Props = {
    onLogout?: () => void
}
export const AuthProvider = (props: PropsWithChildren<Props>) => {
    const authSourceProviderContext = useAuthSourceProviderContext();
    const plugAuthProviderContext = usePlugAuthProviderContext();
    const stoicAuthProviderContext = useStoicAuthProviderContext()
    const internetIdentityAuthProviderContext = useInternetIdentityAuthProviderContext();
    const nfidInternetIdentityAuthProviderContext = useNFIDInternetIdentityAuthProviderContext();
    const infinityWalletAuthProviderContext = useInfinityWalletAuthProviderContext();

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
            case "InfinityWallet": {
                return infinityWalletAuthProviderContext.login()
            }
        }
        return false
    }, [plugAuthProviderContext.login, internetIdentityAuthProviderContext.login,
        nfidInternetIdentityAuthProviderContext.login, stoicAuthProviderContext.login,
        infinityWalletAuthProviderContext.login])

    const logout: LogoutFn = useCallback<LogoutFn>(async (source: Source) => {
        switch (source) {
            case "Plug": {
                await plugAuthProviderContext.logout()
                break
            }
            case "II": {
                await internetIdentityAuthProviderContext.logout()
                break
            }
            case "NFID": {
                await nfidInternetIdentityAuthProviderContext.logout()
                break
            }
            case "Stoic": {
                await stoicAuthProviderContext.logout()
                break
            }
            case "InfinityWallet": {
                await infinityWalletAuthProviderContext.logout()
                break
            }
        }
        if (props.onLogout && typeof props.onLogout === "function") {
            props.onLogout()
        }
    }, [plugAuthProviderContext.logout, internetIdentityAuthProviderContext.logout,
        nfidInternetIdentityAuthProviderContext.logout, stoicAuthProviderContext.logout,
        infinityWalletAuthProviderContext.logout, props.onLogout])

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
        if (contextStatus.isReady && contextStatus.isLoggedIn && contextState.principal != undefined) {
            return contextState.principal
        }
        return undefined
    }, [contextState.principal, contextStatus], _.isEqual)

    const getCurrentAccount: GetCurrentAccountFn = useCustomCompareCallback(() => {
        // console.log("getCurrentAccount: currentAccount", contextState.currentAccount);
        // console.log("switchAccount: contextState.accounts", contextState.accounts);
        if (contextState.currentAccount != undefined && contextState.accounts.length > contextState.currentAccount) {
            return contextState.accounts[contextState.currentAccount]
        }
        return undefined
    }, [contextState], _.isEqual)

    const createActor: CreateActorFn = useCustomCompareCallback(async (canisterId: string, idlFactory: IDL.InterfaceFactory, options?: CreateActorOptions) => {
        let actor: ActorSubclass<any> | undefined = undefined
        if (contextStatus.isLoggedIn) {
            switch (contextSource) {
                case "Plug": {
                    actor = await plugAuthProviderContext.createActor(canisterId, idlFactory, options)
                    break;
                }
                case "II": {
                    actor = await internetIdentityAuthProviderContext.createActor(canisterId, idlFactory, options)
                    break;
                }
                case "NFID": {
                    actor = await nfidInternetIdentityAuthProviderContext.createActor(canisterId, idlFactory, options)
                    break;
                }
                case "Stoic": {
                    actor = await stoicAuthProviderContext.createActor(canisterId, idlFactory, options)
                    break;
                }
                case "InfinityWallet": {
                    actor = await infinityWalletAuthProviderContext.createActor(canisterId, idlFactory, options)
                    break;
                }
            }
        } else {
            actor = createActorGeneric(canisterId, idlFactory, options)
        }
        return actor
    }, [contextSource, contextStatus.isLoggedIn], _.isEqual)

    useCustomCompareEffect(() => {
        const source = authSourceProviderContext.source;
        let status: ContextStatus = _.cloneDeep(initialContextValue.status)
        let state: ContextState = _.cloneDeep(initialContextValue.state)
        switch (source) {
            case "Plug": {
                status = plugAuthProviderContext.status
                state = {
                    identity: plugAuthProviderContext.state.identity,
                    principal: plugAuthProviderContext.state.principal,
                    accounts: plugAuthProviderContext.state.accounts,
                    currentAccount: 0,
                }
                break
            }
            case "II": {
                status = internetIdentityAuthProviderContext.status
                state = {
                    identity: internetIdentityAuthProviderContext.state.identity,
                    principal: internetIdentityAuthProviderContext.state.principal,
                    accounts: internetIdentityAuthProviderContext.state.accounts,
                    currentAccount: 0,
                }
                break
            }
            case "NFID": {
                status = nfidInternetIdentityAuthProviderContext.status
                state = {
                    identity: nfidInternetIdentityAuthProviderContext.state.identity,
                    principal: nfidInternetIdentityAuthProviderContext.state.principal,
                    accounts: nfidInternetIdentityAuthProviderContext.state.accounts,
                    currentAccount: 0,
                }
                break
            }
            case "Stoic": {
                status = stoicAuthProviderContext.status
                state = {
                    identity: stoicAuthProviderContext.state.identity,
                    principal: stoicAuthProviderContext.state.principal,
                    accounts: stoicAuthProviderContext.state.accounts,
                    currentAccount: 0,
                }
                break
            }
            case "InfinityWallet": {
                status = infinityWalletAuthProviderContext.status
                state = {
                    identity: infinityWalletAuthProviderContext.state.identity,
                    principal: infinityWalletAuthProviderContext.state.principal,
                    accounts: infinityWalletAuthProviderContext.state.accounts,
                    currentAccount: 0,
                }
                break
            }
            default: {
                const isReady = _.some([
                    plugAuthProviderContext.status,
                    internetIdentityAuthProviderContext.status,
                    nfidInternetIdentityAuthProviderContext.status,
                    stoicAuthProviderContext.status,
                    infinityWalletAuthProviderContext.status,
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
        infinityWalletAuthProviderContext.status,
        infinityWalletAuthProviderContext.state,
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
        CreateActorFn,
    ]>(() => ({
        source: contextSource,
        status: contextStatus,
        state: contextState,
        login: login,
        logout: logout,
        switchAccount: switchAccount,
        getCurrentPrincipal: getCurrentPrincipal,
        getCurrentAccount: getCurrentAccount,
        createActor: createActor,
    }), [
        contextSource,
        contextStatus,
        contextState,
        login,
        logout,
        switchAccount,
        getCurrentPrincipal,
        getCurrentAccount,
        createActor,
    ], _.isEqual)

    return <AuthProviderContext.Provider value={value}>
        {props.children}
    </AuthProviderContext.Provider>
}

export function createActorGeneric<T>(canisterId: string, idlFactory: IDL.InterfaceFactory, options?: CreateActorOptions): ActorSubclass<T> {
    const agent = new HttpAgent({...options?.agentOptions});

    // Fetch root key for certificate validation during development
    if (process.env.NODE_ENV !== "production") {
        agent.fetchRootKey().catch(err => {
            console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
            console.error(err);
        });
    }

    // Creates an actor with using the candid interface and the HttpAgent
    return Actor.createActor<T>(idlFactory, {
        agent,
        canisterId: canisterId,
        ...options?.actorOptions
    });
}