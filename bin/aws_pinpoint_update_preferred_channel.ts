#!/usr/bin/env node
/*********************************************************************************************************************
  *  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                           *
  *                                                                                                                    *
  *  Licensed under the Amazon Software License (the "License"). You may not use this file except in compliance        *
  *  with the License. A copy of the License is located at                                                             *
  *                                                                                                                    *
  *      http://aws.amazon.com/asl/                                                                                    *
  *                                                                                                                    *
  *  or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES *
  *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
  *  and limitations under the License.                                                                                *
  ******************************************************************************************************************** */ 

import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import * as constant from './../lib/interfaces/constant';
import { UpdateStack } from '../lib/update-stack';
import { PinpointEventstreamStack } from '../lib/pinpoint_eventstream-stack';
import { PinpointStack } from '../lib/pinpoint-stack';
import { BasicStack } from '../lib/basic-stack';

const app = new cdk.App();

const basicStack = new BasicStack(app, `${constant.Namespace}BasicStack`);
const pinpointStack = new PinpointStack(app, `${constant.Namespace}PinpointStack`);

const updateStack = new UpdateStack(app, `${constant.Namespace}UpdateStack`, {
  userTable: basicStack.userTable
});
updateStack.addDependency(basicStack);
updateStack.addDependency(pinpointStack);

const pinpointEventStreamStack = new PinpointEventstreamStack(app, `${constant.Namespace}PinpointEventstreamStack`,{
  pinpointApp: pinpointStack.pinpointApp,
  preferredTable: updateStack.preferredTable
});
pinpointEventStreamStack.addDependency(updateStack);

