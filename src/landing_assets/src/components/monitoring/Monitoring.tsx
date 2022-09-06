import {ConfigurationLocalStorageProvider, ConfigurationProvider, PageLoaderComponent, URLPathProvider, useConfigurationContext, useConfigurationStorageContext} from "canistergeek-ic-js";
import * as React from "react";
import {PropsWithChildren} from "react";
import {AuthSourceProvider} from "src/landing_assets/src/components/auth/authSource/AuthSourceProvider";
import {InternetIdentityAuthProvider, InternetIdentityAuthProviderContext} from "src/landing_assets/src/components/auth/internetIdentity/InternetIdentityAuthProvider";
import {PlugAuthProvider} from "src/landing_assets/src/components/auth/plug/PlugAuthProvider";
import {StoicAuthProvider} from "src/landing_assets/src/components/auth/stoic/StoicAuthProvider";
import {AuthProvider, useAuthProviderContext} from "src/landing_assets/src/components/auth/AuthProvider";
import {SkeletonComponent} from "src/landing_assets/src/components/skeleton/SkeletonComponent";
import {ToolbarComponent} from "src/landing_assets/src/components/skeleton/toolbar/ToolbarComponent";
import {MonitoringRoot} from "src/landing_assets/src/components/monitoring/MonitoringRoot";
import {NFIDInternetIdentityAuthProviderContext} from "src/landing_assets/src/components/auth/nfid/NFIDAuthProvider";
import _ from "lodash";
import {Canister} from "canistergeek-ic-js/lib/es5/dataProvider/ConfigurationProvider";
import {BLACKHOLE_CANISTER_ID} from "canistergeek-ic-js/lib/es5/api/blackhole0_0_0";
import {InfinityWalletAuthProvider} from "src/landing_assets/src/components/auth/infinityWallet/InfinityWalletAuthProvider";

export const URL__GITHUB_CANISTERGEEK_MOTOKO = `https://github.com/usergeek/canistergeek-ic-motoko`
export const URL__GITHUB_CANISTERGEEK_MOTOKO_LIMIT = `${URL__GITHUB_CANISTERGEEK_MOTOKO}#limit-access-to-your-data`
export const URL__GITHUB_CANISTERGEEK_RUST = `https://github.com/usergeek/canistergeek_ic_rust`
export const URL__GITHUB_CANISTERGEEK_RUST_LIMIT = `${URL__GITHUB_CANISTERGEEK_RUST}#limit-access-to-your-data`

const AuthComponents = (props: PropsWithChildren<any>) => {
    const configurationContext = useConfigurationContext();
    const whitelist = prepareWhitelist(configurationContext.configuration.canisters)
    return <AuthSourceProvider>
        <InternetIdentityAuthProvider source={"II"} context={InternetIdentityAuthProviderContext}>
            <InternetIdentityAuthProvider source={"NFID"} context={NFIDInternetIdentityAuthProviderContext}>
                <PlugAuthProvider whitelist={whitelist}>
                    <StoicAuthProvider>
                        <InfinityWalletAuthProvider whitelist={whitelist}>
                            <AuthProvider>
                                {props.children}
                            </AuthProvider>
                        </InfinityWalletAuthProvider>
                    </StoicAuthProvider>
                </PlugAuthProvider>
            </InternetIdentityAuthProvider>
        </InternetIdentityAuthProvider>
    </AuthSourceProvider>
}

const ConfigurationProviderWrapper = (props: PropsWithChildren<any>) => {
    const configurationStorageContext = useConfigurationStorageContext();
    return <ConfigurationProvider configuration={configurationStorageContext.configuration}>
        {props.children}
    </ConfigurationProvider>
}

const ConfigurationComponents = (props: PropsWithChildren<any>) => <ConfigurationLocalStorageProvider>
    <ConfigurationProviderWrapper>
        {props.children}
    </ConfigurationProviderWrapper>
</ConfigurationLocalStorageProvider>

const SkeletonComponentWrapper = () => {
    const authProviderContext = useAuthProviderContext();
    if (authProviderContext.status.isReady) {
        return <SkeletonComponent toolbarComponent={ToolbarComponent} contentComponent={MonitoringRoot}/>
    } else {
        return <PageLoaderComponent/>
    }
}

export const Monitoring = () => <ConfigurationComponents>
    <AuthComponents>
        <URLPathProvider basePath={`/monitoring`}
                         configPath={`/settings`}
                         githubMotokoLibraryURL={URL__GITHUB_CANISTERGEEK_MOTOKO}
                         githubMotokoLibraryLimitAccessURL={URL__GITHUB_CANISTERGEEK_MOTOKO_LIMIT}
                         githubRustLibraryURL={URL__GITHUB_CANISTERGEEK_RUST}
                         githubRustLibraryLimitAccessURL={URL__GITHUB_CANISTERGEEK_RUST_LIMIT}>
            <SkeletonComponentWrapper/>
        </URLPathProvider>
    </AuthComponents>
</ConfigurationComponents>

const prepareWhitelist = (configCanisters: Array<Canister>): Array<string> => {
    const hasBlackholeSource = _.some(configCanisters, v => v.metricsSource?.includes("blackhole"))
    const whitelist: Array<string> = _.map(configCanisters, v => v.canisterId)
    if (hasBlackholeSource && !_.includes(whitelist, BLACKHOLE_CANISTER_ID)) {
        whitelist.push(BLACKHOLE_CANISTER_ID)
    }
    return whitelist
}