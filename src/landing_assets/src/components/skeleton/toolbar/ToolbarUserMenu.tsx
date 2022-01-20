import * as React from "react";
import {useCallback} from "react";
import {Avatar, Dropdown, Menu, message, Modal, Typography} from "antd";
import {SettingOutlined} from "@ant-design/icons";
import {useAuthProviderContext} from "src/landing_assets/src/components/auth/AuthProvider";

export const ToolbarUserMenu = () => {
    const authProviderContext = useAuthProviderContext();
    const loggedIn = authProviderContext.status.isReady && authProviderContext.status.isLoggedIn;
    const principal = loggedIn && authProviderContext.state.identity ? authProviderContext.state.identity.getPrincipal().toText() : "";

    const handleLoginPlug = useCallback(() => {
        (async () => {
            const success = await authProviderContext.login("Plug")
            if (!success) {
                message.error("Plug login failed");
            }
        })()
    }, [])

    const handleLoginII = useCallback(() => {
        (async () => {
            const success = await authProviderContext.login("II")
            if (!success) {
                message.error("II login failed");
            }
        })()
    }, [])

    const handleLoginStoic = useCallback(() => {
        (async () => {
            const success = await authProviderContext.login("Stoic")
            if (!success) {
                message.error("Stoic login failed");
            }
        })()
    }, [])

    const handleLogout = async () => {
        Modal.confirm({
            visible: true,
            title: `Log Out`,
            icon: null,
            content: <>Are you sure you want to log out?</>,
            onOk: () => {
                return authProviderContext.logout(authProviderContext.source)
            },
            okButtonProps: {
                danger: true
            },
            autoFocusButton: null
        })
    }

    const sourceName = authProviderContext.source == "II" ? "Internet Identity" : authProviderContext.source == "Stoic" ? "Stoic" : "Plug"

    const menu = loggedIn ? <Menu style={{minWidth: "200px"}}>
            <Menu.Item key={"principal"} >
                Principal: <Typography.Text copyable code className={"apiKey"}>{principal}</Typography.Text>
            </Menu.Item>
            <Menu.Divider/>
            <Menu.Item key={"logout"} danger>
                <button onClick={handleLogout} className={"ug-text ug-text-full-width"}>Logout ({sourceName})</button>
            </Menu.Item>
        </Menu> :
        <Menu style={{minWidth: "200px"}}>
            <Menu.Item key={"loginII"}>
                <button onClick={handleLoginII} className={"ug-text ug-text-full-width"}>Login with Internet Identity</button>
            </Menu.Item>
            <Menu.Item key={"loginPlug"}>
                <button onClick={handleLoginPlug} className={"ug-text ug-text-full-width"}>Login with Plug</button>
            </Menu.Item>
            <Menu.Item key={"loginStoic"}>
                <button onClick={handleLoginStoic} className={"ug-text ug-text-full-width"}>Login with Stoic</button>
            </Menu.Item>
        </Menu>
    return <Dropdown overlay={menu} trigger={["click"]} placement="bottomRight">
        <Avatar size={32} icon={<SettingOutlined/>} className={"userMenu"}/>
    </Dropdown>
}