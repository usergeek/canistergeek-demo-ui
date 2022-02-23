import {ConfigurationLocalStorageProvider, ConfigurationProvider, PageLoaderComponent, URLPathProvider, useConfigurationStorageContext} from "canistergeek-ic-js";
import * as React from "react";
import {PropsWithChildren} from "react";
import {AuthSourceProvider} from "src/landing_assets/src/components/auth/authSource/AuthSourceProvider";
import {InternetIdentityAuthProvider} from "src/landing_assets/src/components/auth/internetIdentity/InternetIdentityAuthProvider";
import {PlugAuthProvider} from "src/landing_assets/src/components/auth/plug/PlugAuthProvider";
import {StoicAuthProvider} from "src/landing_assets/src/components/auth/stoic/StoicAuthProvider";
import {AuthProvider, useAuthProviderContext} from "src/landing_assets/src/components/auth/AuthProvider";
import {SkeletonComponent} from "src/landing_assets/src/components/skeleton/SkeletonComponent";
import {ToolbarComponent} from "src/landing_assets/src/components/skeleton/toolbar/ToolbarComponent";
import {MonitoringRoot} from "src/landing_assets/src/components/monitoring/MonitoringRoot";

export const URL__GITHUB_CANISTERGEEK_MOTOKO = `https://github.com/usergeek/canistergeek-ic-motoko`
export const URL__GITHUB_CANISTERGEEK_MOTOKO_LIMIT = `${URL__GITHUB_CANISTERGEEK_MOTOKO}#limit-access-to-your-data`
export const URL__GITHUB_CANISTERGEEK_RUST = `https://github.com/usergeek/canistergeek_ic_rust`
export const URL__GITHUB_CANISTERGEEK_RUST_LIMIT = `${URL__GITHUB_CANISTERGEEK_RUST}#limit-access-to-your-data`

const AuthComponents = (props: PropsWithChildren<any>) => <AuthSourceProvider>
    <InternetIdentityAuthProvider>
        <PlugAuthProvider>
            <StoicAuthProvider>
                <AuthProvider>
                    {props.children}
                </AuthProvider>
            </StoicAuthProvider>
        </PlugAuthProvider>
    </InternetIdentityAuthProvider>
</AuthSourceProvider>

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