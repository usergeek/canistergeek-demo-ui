import * as React from "react";
import {ConfigurationPage, EmptyConfigurationPage, useConfigurationContext, useURLPathContext} from "canistergeek-ic-js";
import {Redirect, Route, Switch} from "react-router-dom";
import {MonitoringMetrics} from "src/landing_assets/src/components/monitoring/MonitoringMetrics";
import {MonitoringLogs} from "src/landing_assets/src/components/monitoring/MonitoringLogs";

export const MonitoringRoot = () => {
    const configurationContext = useConfigurationContext();
    const urlPathContext = useURLPathContext();
    if (configurationContext.configuration.canisters.length == 0) {
        return <>
            <Switch>
                <Route path={urlPathContext.basePath} exact render={() => <EmptyConfigurationPage/>}/>
                <Route path={urlPathContext.configPath} component={ConfigurationPage}/>
                <Redirect from="*" to={urlPathContext.basePath}/>
            </Switch>
        </>
    } else {
        return <>
            <Switch>
                <Route path={urlPathContext.basePath} render={() => {
                    return <Switch>
                        <Route path={urlPathContext.metricsPath} component={MonitoringMetrics}/>
                        <Route path={urlPathContext.logMessagesPathRoot} render={() => {
                            return <Switch>
                                <Route path={urlPathContext.logMessagesPath} component={MonitoringLogs}/>
                                <Redirect from="*" to={urlPathContext.pathToLogMessagesSection("summary")}/>
                            </Switch>
                        }}/>
                        <Redirect from="*" to={urlPathContext.pathToMetricsSection("summary")}/>
                    </Switch>
                }}/>
                <Route path={urlPathContext.configPath} component={ConfigurationPage}/>
                <Redirect from="*" to={urlPathContext.basePath}/>
            </Switch>
        </>
    }
}