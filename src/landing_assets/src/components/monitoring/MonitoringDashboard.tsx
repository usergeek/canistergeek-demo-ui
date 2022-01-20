import * as React from "react";
import {CanistergeekPage, DataProvider, PrecalculatedPredictionDataProvider, PrecalculatedRealtimeDataProvider, PrecalculatedTrendDataProvider} from "canistergeek-ic-js";
import {useAuthProviderContext} from "src/landing_assets/src/components/auth/AuthProvider";

export const MonitoringDashboard = () => {
    const authProviderContext = useAuthProviderContext();
    return <>
        <DataProvider identity={authProviderContext.state.identity}>
            <PrecalculatedRealtimeDataProvider>
                <PrecalculatedTrendDataProvider>
                    <PrecalculatedPredictionDataProvider>
                        <CanistergeekPage/>
                    </PrecalculatedPredictionDataProvider>
                </PrecalculatedTrendDataProvider>
            </PrecalculatedRealtimeDataProvider>
        </DataProvider>
    </>
}