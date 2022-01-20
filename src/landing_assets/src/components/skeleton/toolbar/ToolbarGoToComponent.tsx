import * as React from "react";
import {Button, Dropdown, Menu} from "antd";
import {Link} from "react-router-dom";
import {useURLPathContext} from "canistergeek-ic-js";
import {DownOutlined} from "@ant-design/icons";

export const ToolbarGoToComponent = () => {
    const urlPathContext = useURLPathContext();
    const menu = <Menu>
        <Menu.Item key={"dashboard"}>
            <Link to={urlPathContext.pathToSection("summary")}>Dashboard</Link>
        </Menu.Item>
        <Menu.Item key={"configuration"}>
            <Link to={urlPathContext.configPath}>Configuration</Link>
        </Menu.Item>
    </Menu>
    return <Dropdown overlay={menu} trigger={["click"]}>
        <Button disabled type={"link"} className={"goToMenu"}>Go To... <DownOutlined/></Button>
    </Dropdown>
}