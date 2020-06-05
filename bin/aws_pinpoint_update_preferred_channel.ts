#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import * as constant from './../lib/interfaces/constant';
import { UpdateStack } from '../lib/update-stack';
import { PinpointEventstreamStack } from '../lib/pinpoint_eventstream-stack';
import { PinpointStack } from '../lib/pinpoint-stack';
import { ConvertStack } from '../lib/convert-stack';

const app = new cdk.App();

const pinpointStack = new PinpointStack(app, `${constant.Namespace}PinpointStack`);

const updateStack = new UpdateStack(app, `${constant.Namespace}UpdateStack`);
updateStack.addDependency(pinpointStack);

const convertStack = new ConvertStack(app, `${constant.Namespace}ConvertStack`);
convertStack.addDependency(updateStack);

const pinpointEventStreamStack = new PinpointEventstreamStack(app, `${constant.Namespace}PinpointEventstreamStack`);
pinpointEventStreamStack.addDependency(convertStack);

