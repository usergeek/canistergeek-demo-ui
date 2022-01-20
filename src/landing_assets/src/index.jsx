import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {BrowserRouter as Router} from "react-router-dom";
import {Monitoring} from "src/landing_assets/src/components/monitoring/Monitoring";

import "src/landing_assets/src/css/index.less"

ReactDOM.render(<Router>
    <Monitoring/>
</Router>, document.getElementById('root'))
