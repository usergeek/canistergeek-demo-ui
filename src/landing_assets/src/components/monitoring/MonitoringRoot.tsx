import * as React from "react";
import {ConfigurationPage, EmptyConfigurationPage, useConfigurationContext, useURLPathContext} from "canistergeek-ic-js";
import {Redirect, Route, Switch} from "react-router-dom";
import {MonitoringDashboard} from "src/landing_assets/src/components/monitoring/MonitoringDashboard";

export const URL__GITHUB_CANISTERGEEK_MOTOKO = `https://github.com/usergeek/canistergeek-ic-motoko`
export const URL__GITHUB_CANISTERGEEK_MOTOKO_LIMIT = `${URL__GITHUB_CANISTERGEEK_MOTOKO}#limit-access-to-your-data`

export const MonitoringRoot = () => {
    const configurationContext = useConfigurationContext();
    const urlPathContext = useURLPathContext();
    if (configurationContext.configuration.canisters.length == 0) {
        return <>
            <Switch>
                <Route path={urlPathContext.basePathRoot} exact render={() => <EmptyConfigurationPage configURL={urlPathContext.configPath} githubMotokoLibraryURL={URL__GITHUB_CANISTERGEEK_MOTOKO} githubMotokoLibraryLimitAccessURL={URL__GITHUB_CANISTERGEEK_MOTOKO_LIMIT}/>}/>
                <Route path={urlPathContext.configPath} component={ConfigurationPage}/>
                <Redirect from="*" to={urlPathContext.basePathRoot}/>
            </Switch>
        </>
    } else {
        return <>
            <Switch>
                <Route path={urlPathContext.basePathRoot} render={() => {
                    return <Switch>
                        <Route path={urlPathContext.basePath} component={MonitoringDashboard}/>
                        <Redirect from="*" to={urlPathContext.pathToSection("summary")}/>
                    </Switch>
                }}/>
                <Route path={urlPathContext.configPath} component={ConfigurationPage}/>
                <Redirect from="*" to={urlPathContext.basePathRoot}/>
            </Switch>
        </>
    }
}