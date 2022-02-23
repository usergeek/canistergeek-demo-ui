import * as React from "react";
import {Space} from "antd";
import {NavLink} from "react-router-dom";
import {useURLPathContext} from "canistergeek-ic-js";

export const ToolbarGoToComponent = () => {
    const urlPathContext = useURLPathContext();
    return <>
        <Space direction={"horizontal"} size={"large"} className={"toolbarNavLinks"}>
            <NavLink to={urlPathContext.metricsPathRoot} exact={false}>Metrics</NavLink>
            <NavLink to={urlPathContext.logMessagesPathRoot} exact={false}>Log Messages</NavLink>
            <NavLink to={urlPathContext.configPath}>Settings</NavLink>
        </Space>
    </>
}