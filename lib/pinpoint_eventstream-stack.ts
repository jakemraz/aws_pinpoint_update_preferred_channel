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
import * as ddb from '@aws-cdk/aws-dynamodb';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as constant from './interfaces/constant'
import * as path from 'path';

export class PinpointEventstreamStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    const ddbPolicy = new iam.PolicyStatement({
      actions: ["dynamodb:*"],
      resources: ['*']
    });


    const preferredUpdateHandler = new lambda.Function(this, `${constant.Namespace}PreferredUpdateHandler`, {
      functionName: `${constant.Namespace}PreferredUpdateHandler`,
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'preferred_update.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-handler'))
    });
    preferredUpdateHandler.addToRolePolicy(ddbPolicy);
  }
}
