import * as React from "react";
import {CanistergeekLogMessagesPage, LogMessagesDataProvider} from "canistergeek-ic-js";
import {useAuthProviderContext} from "src/landing_assets/src/components/auth/AuthProvider";

export const MonitoringLogs = () => {
    const authProviderContext = useAuthProviderContext();
    return <>
        <LogMessagesDataProvider identity={authProviderContext.state.identity}>
            <CanistergeekLogMessagesPage/>
        </LogMessagesDataProvider>
    </>
}