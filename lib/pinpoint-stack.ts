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

import * as cdk from '@aws-cdk/core';
import * as pinpoint from '@aws-cdk/aws-pinpoint';
import * as constant from './interfaces/constant'


export class PinpointStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const app = new pinpoint.CfnApp(this, `${constant.Namespace}PinpointApp`, {
      name: `${constant.Namespace}PinpointApp`
    });

  } 
}
