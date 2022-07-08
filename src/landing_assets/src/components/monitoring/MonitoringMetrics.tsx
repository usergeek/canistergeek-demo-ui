import * as React from "react";
import {CanistergeekMetricsPage, DataProvider, PrecalculatedPredictionDataProvider, PrecalculatedRealtimeDataProvider, PrecalculatedTrendDataProvider} from "canistergeek-ic-js";
import {useAuthProviderContext} from "src/landing_assets/src/components/auth/AuthProvider";

export const MonitoringMetrics = () => {
    const authProviderContext = useAuthProviderContext();
    return <>
        <DataProvider identity={authProviderContext.state.identity} httpAgent={authProviderContext.state.httpAgent}>
            <PrecalculatedRealtimeDataProvider>
                <PrecalculatedTrendDataProvider>
                    <PrecalculatedPredictionDataProvider>
                        <CanistergeekMetricsPage/>
                    </PrecalculatedPredictionDataProvider>
                </PrecalculatedTrendDataProvider>
            </PrecalculatedRealtimeDataProvider>
        </DataProvider>
    </>
}