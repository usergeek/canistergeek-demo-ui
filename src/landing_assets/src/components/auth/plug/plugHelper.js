const host = process.env.NODE_ENV === "development" ? "http://localhost:8000" : "https://mainnet.dfinity.network";

export const PlugHelper = {
    /**
     * @param {Array<string> | undefined} whitelist
     * @return {Promise<import("@dfinity/agent").Identity | undefined>};
     */
    getLoggedInIdentity: async (whitelist = undefined) => {
        try {
            const plug = getGlobalPlug()
            if (plug) {
                const connected = await plug.isConnected();
                if (connected) {
                    if (!plug.agent) {
                        await plug.createAgent({host, whitelist});
                    }
                    const agent = PlugHelper.getAgent()
                    const identity = await agent._identity;
                    return identity;
                }
            }
        } catch (e) {
            console.warn("Cannot auto-login with Plug:", e);
        }
    },
    /**
     * @param {Array<string> | undefined} whitelist
     * @return {Promise<import("@dfinity/agent").Identity | undefined>};
     */
    login: async (whitelist = undefined) => {
        try {
            const plug = getGlobalPlug()
            if (plug) {
                const result = await plug.requestConnect({host, whitelist, timeout: 30000});
                if (result) {
                    if (!plug.agent) {
                        await plug.createAgent({host})
                    }
                    const agent = PlugHelper.getAgent()
                    return await agent._identity;
                }
            }
        } catch (e) {
            console.warn("Cannot login with Plug:", e);
            throw e
        }
    },

    /**
     * @return {import("@dfinity/agent").HttpAgent | undefined};
     */
    getAgent: () => {
        const plug = getGlobalPlug()
        return plug.sessionManager.sessionData.agent
    }
}

const getGlobalIC = () => {
    // @ts-ignore
    return window.ic
}

const getGlobalPlug = () => {
    // @ts-ignore
    return getGlobalIC().plug
}