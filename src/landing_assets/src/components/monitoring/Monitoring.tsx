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
        <URLPathProvider basePath={`/dashboard`} configPath={`/config`}>
            <SkeletonComponentWrapper/>
        </URLPathProvider>
    </AuthComponents>
</ConfigurationComponents>