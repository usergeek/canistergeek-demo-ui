import * as React from "react";
import {Col, Row} from "antd";
import {ToolbarLogoComponent} from "src/landing_assets/src/components/skeleton/toolbar/logo/ToolbarLogoComponent";
import {ToolbarUserMenu} from "src/landing_assets/src/components/skeleton/toolbar/ToolbarUserMenu";
import {ToolbarGoToComponent} from "src/landing_assets/src/components/skeleton/toolbar/ToolbarGoToComponent";

export const ToolbarComponent = () => {
    return <Row wrap={false} align={"middle"} className={"toolbarContent"}>
        <Col className="toolbarLogoCol">
            <ToolbarLogoComponent/>
        </Col>
        <Col flex={"auto"} className="toolbarContentCol">
            <Row align={"middle"}>
                <Col className="toolbarContentGoToComponent">
                    <ToolbarGoToComponent/>
                </Col>
            </Row>
        </Col>
        <Col>
            <ToolbarUserMenu/>
        </Col>
    </Row>

}