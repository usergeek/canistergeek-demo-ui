import * as React from "react";
import {Col, Row} from "antd";

type Props = {
    toolbarComponent?: React.ElementType
    contentComponent: React.ElementType
    footerComponent?: React.ElementType
}

export const SkeletonComponent = ({
                                      toolbarComponent: ToolbarComponent,
                                      contentComponent: ContentComponent,
                                      footerComponent: FooterComponent
                                  }: Props) => {
    const contentColSpan = 22
    const contentOuterColSpan = (24 - contentColSpan) / 2

    return <>
        {ToolbarComponent ?
            <Row className="toolbarRow">
                <Col span={1}/>
                <Col span={22}>
                    <ToolbarComponent/>
                </Col>
                <Col span={1}/>
            </Row>
            : null}
        <Row className="contentRow">
            <Col span={1} lg={contentOuterColSpan} className="contentColLeftSide"/>
            <Col span={22} lg={contentColSpan} className="contentCol">
                <Row style={{flexGrow: 1}}>
                    <Col span={24} className="pageContentCol">
                        <ContentComponent/>
                    </Col>
                </Row>
            </Col>
            <Col span={1} lg={contentOuterColSpan} className="contentColRightSide"/>
        </Row>
        {FooterComponent ?
            <Row className="footerRow">
                <Col span={1} lg={contentOuterColSpan}/>
                <Col span={22} lg={contentColSpan}><FooterComponent/></Col>
                <Col span={1} lg={contentOuterColSpan}/>
            </Row>
            : null}
    </>

}