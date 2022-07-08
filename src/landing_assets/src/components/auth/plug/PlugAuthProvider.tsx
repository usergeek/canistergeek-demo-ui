import * as React from "react";
import {PropsWithChildren, Reducer, useCallback, useEffect, useReducer} from "react";
import {unstable_batchedUpdates} from "react-dom";
import {useCustomCompareCallback, useCustomCompareMemo} from "use-custom-compare";
import _ from "lodash";
import {useAuthSourceProviderContext} from "../authSource/AuthSourceProvider";
import {PlugHelper} from "./plugHelper";
import {HttpAgent, Identity} from "@dfinity/agent";
import {useConfigurationContext} from "canistergeek-ic-js";
import {Canister, Configuration} from "canistergeek-ic-js/lib/es5/dataProvider/ConfigurationProvider";
import {AuthAccount} from "../AuthCommon";
import {Util} from "../util";
import {BLACKHOLE_CANISTER_ID} from "canistergeek-ic-js/lib/es5/api/blackhole0_0_0";

type ContextStatus = {
    inProgress: boolean
    isReady: boolean
    isLoggedIn: boolean
}

type ContextState = {
    identity: Identity | undefined
    httpAgent: HttpAgent | undefined
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
        accounts: [],
        httpAgent: undefined,
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
            const whitelist: Array<string> = prepareWhitelist(configurationContext.configuration.canisters)
            const identity = await PlugHelper.login(whitelist)
            if (identity) {
                const accounts = await getIdentityAccounts(identity)
                unstable_batchedUpdates(() => {
                    updateContextStatus({isLoggedIn: true, inProgress: false})
                    updateContextState({identity: identity, accounts: accounts, httpAgent: PlugHelper.getAgent()})
                })
                return true
            }
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false, inProgress: false})
                updateContextState({identity: undefined, accounts: [], httpAgent: undefined})
            })
        } catch (e) {
            console.error("PlugAuthProvider: login: caught error", e);
            unstable_batchedUpdates(() => {
                authSourceProviderContext.setSource(undefined)
                updateContextStatus({isLoggedIn: false, inProgress: false})
                updateContextState({identity: undefined, accounts: [], httpAgent: undefined})
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
            updateContextState({identity: undefined, accounts: [], httpAgent: undefined})
        })
    }, [])

    // EFFECT

    useEffect(() => {
        (async () => {
            try {
                if (authSourceProviderContext.source == "Plug") {
                    updateContextStatus({inProgress: true})
                    const whitelist: Array<string> = prepareWhitelist(configurationContext.configuration.canisters)
                    const identity = await PlugHelper.getLoggedInIdentity(whitelist)
                    if (identity) {
                        const accounts = await getIdentityAccounts(identity)
                        unstable_batchedUpdates(() => {
                            updateContextStatus({isReady: true, isLoggedIn: true, inProgress: false})
                            updateContextState({identity: identity, accounts: accounts, httpAgent: PlugHelper.getAgent()})
                        })
                        return
                    }
                }
                unstable_batchedUpdates(() => {
                    if (authSourceProviderContext.source == "Plug") {
                        authSourceProviderContext.setSource(undefined)
                    }
                    updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                    updateContextState({identity: undefined, accounts: [], httpAgent: undefined})
                })
            } catch (e) {
                console.error("PlugAuthProvider: useEffect[]: caught error", authSourceProviderContext.source, e);
                unstable_batchedUpdates(() => {
                    if (authSourceProviderContext.source == "Plug") {
                        authSourceProviderContext.setSource(undefined)
                    }
                    updateContextStatus({isReady: true, isLoggedIn: false, inProgress: false})
                    updateContextState({identity: undefined, accounts: [], httpAgent: undefined})
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

    return <PlugAuthProviderContext.Provider value={value}>
        {props.children}
    </PlugAuthProviderContext.Provider>
}

const getIdentityAccounts = async (identity: Identity): Promise<Array<AuthAccount>> => {
    try {
        return [{
            name: "Plug Main Wallet",
            accountIdentifier: Util.principalToAccountIdentifier(identity.getPrincipal().toText(), 0)
        }]
    } catch (e) {
        return []
    }
}

const prepareWhitelist = (configCanisters: Array<Canister>): Array<string> => {
    const hasBlackholeSource = _.some(configCanisters, v => v.metricsSource?.includes("blackhole"))
    const whitelist: Array<string> = _.map(configCanisters, v => v.canisterId)
    if (hasBlackholeSource && !_.includes(whitelist, BLACKHOLE_CANISTER_ID)) {
        whitelist.push(BLACKHOLE_CANISTER_ID)
    }
    return whitelist
}