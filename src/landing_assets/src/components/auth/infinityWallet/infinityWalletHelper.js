const host = process.env.NODE_ENV === "development" ? "http://localhost:8000" : undefined//"https://mainnet.dfinity.network";

const Helper = {
    /**
     * @param {Array<string> | undefined} whitelist
     * @return {Promise<import("@dfinity/principal").Principal | undefined>};
     */
    getLoggedInPrincipal: async (whitelist = undefined) => {
        try {
            const wallet = getGlobalWallet()
            if (wallet) {
                const connected = await wallet.isConnected()
                if (!connected || !wallet.agent) {
                    await wallet.requestConnect({
                        host: host,
                        whitelist: whitelist,
                    });
                }
                return await Helper.getPrincipal()
            }
        } catch (e) {
            console.warn("Cannot auto-login with InfinityWallet:", e);
        }
    },
    /**
     * @param {Array<string> | undefined} whitelist
     * @return {Promise<import("@dfinity/principal").Principal | undefined>};
     */
    login: async (whitelist = undefined) => {
        try {
            const wallet = getGlobalWallet()
            if (wallet) {
                await wallet.requestConnect({
                    host: host,
                    whitelist: whitelist,
                });
                return await Helper.getPrincipal()
            }
        } catch (e) {
            console.warn("Cannot login with InfinityWallet:", e);
            throw e
        }
    },

    /**
     * @return {Promise<import("@dfinity/principal").Principal | undefined>};
     */
    getPrincipal: async () => {
        const wallet = getGlobalWallet()
        if (wallet) {
            return await wallet.getPrincipal()
        }
        return undefined
    },

    /**
     * @param {string} canisterId
     * @param {import("@dfinity/candid").IDL.InterfaceFactory} interfaceFactory
     * @return {Promise<import("@dfinity/agent").ActorSubclass<T> | undefined>};
     */
    createActor: async (canisterId, interfaceFactory) => {
        const parameters = {
            canisterId: canisterId,
            interfaceFactory: interfaceFactory
        }
        try {
            const wallet = getGlobalWallet()
            if (wallet) {
                return await wallet.createActor(parameters)
            }
        } catch (e) {
            console.error("InfinityWallet: cannot create actor using parameters", parameters, e);
        }
        return undefined
    },

    /**
     * Disconnect
     */
    logout: async () => {
        try {
            const wallet = getGlobalWallet()
            if (wallet) {
                await wallet.disconnect()
            }
        } catch (e) {
            console.error("InfinityWallet: cannot disconnect");
        }
    },
};

export const InfinityWalletHelper = Helper

const getGlobalIC = () => {
    // @ts-ignore
    return window.ic
}

const getGlobalWallet = () => {
    // @ts-ignore
    return getGlobalIC().infinityWallet
}