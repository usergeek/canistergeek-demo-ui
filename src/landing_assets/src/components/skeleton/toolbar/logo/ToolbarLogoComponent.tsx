import * as React from "react";
import logo from "src/landing_assets/src/components/skeleton/toolbar/logo/logo_v1.svg"
import {Col, Row} from "antd";
import {Link} from "react-router-dom";

export const ToolbarLogoComponent = () => {
    return <Row align={"middle"} className={"logoContent"}>
        <Col><Link to={"/"}><img src={logo} className={"logoImgHead"} alt={""}/></Link></Col>
    </Row>
}