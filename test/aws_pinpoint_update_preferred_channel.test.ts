import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';

import * as constant from '../lib/interfaces/constant'
import * as PinpointStack from '../lib/pinpoint-stack';
import * as UpdateStack from '../lib/update-stack';
import * as PinpointEventstreamStack from '../lib/pinpoint_eventstream-stack';
import * as ConvertStack from '../lib/convert-stack';



test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const pinpointStack = new PinpointStack.PinpointStack(app, `${constant.Namespace}PinpointStack`);

    const updateStack = new UpdateStack.UpdateStack(app, `${constant.Namespace}UpdateStack`);
    updateStack.addDependency(pinpointStack);

    const convertStack = new ConvertStack.ConvertStack(app, `${constant.Namespace}ConvertStack`);
    convertStack.addDependency(updateStack);

    const pinpointEventStreamStack = new PinpointEventstreamStack.PinpointEventstreamStack(app, `${constant.Namespace}PinpointEventstreamStack`);
    pinpointEventStreamStack.addDependency(convertStack);


    // THEN
    expectCDK(pinpointStack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
