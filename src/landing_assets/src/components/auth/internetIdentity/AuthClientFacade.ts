import {Identity} from "@dfinity/agent";
import {AuthClient} from "@dfinity/auth-client";

let authClientInstance: AuthClient | undefined = undefined

const provideAuthClient = async (): Promise<AuthClient | undefined> => {
    if (!authClientInstance) {
        const authClient = await AuthClient.create({idleOptions: {disableIdle: true}});
        await authClient.isAuthenticated();
        authClientInstance = authClient
    }
    return authClientInstance
}

const restoreIdentity = async (authClient: AuthClient): Promise<Identity | undefined> => {
    const isAuthenticated = await authClient.isAuthenticated();
    if (isAuthenticated) {
        const identity = await authClient.getIdentity();
        if (!identity.getPrincipal().isAnonymous()) {
            return identity
        }
    }
    await logout(authClient)
}

const login = (authClient: AuthClient, identityProvider: string | undefined): Promise<Identity | undefined> => {
    return new Promise((resolve, reject) => {
        return authClient.login({
            identityProvider: identityProvider,
            maxTimeToLive: BigInt(2592000_000_000_000),
            windowOpenerFeatures:
                `left=${window.screen.width / 2 - 200}, `+
                `top=${window.screen.height / 2 - 300},` +
                `toolbar=0,location=0,menubar=0,width=400,height=600`,
            onSuccess: async () => {
                const identity = authClient.getIdentity();
                if (!identity.getPrincipal().isAnonymous()) {
                    resolve(identity);
                } else {
                    resolve(undefined)
                }
            },
            onError: error => {
                reject(error)
            }
        })
    })
}

const logout = (authClient: AuthClient, options?: { returnTo?: string; }): Promise<void> => {
    return authClient.logout(options)
}

export const AuthClientFacade = {
    provideAuthClient: provideAuthClient,
    restoreIdentity: restoreIdentity,
    login: login,
    logout: logout,
}