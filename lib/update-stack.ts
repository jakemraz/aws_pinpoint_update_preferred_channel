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
import * as pinpoint from '@aws-cdk/aws-pinpoint';
import * as constant from './interfaces/constant'
import * as path from 'path';
import { Duration } from '@aws-cdk/core';

interface Props extends cdk.StackProps{
  userTable: ddb.ITable;
  pinpointApp: pinpoint.CfnApp;
}

export class UpdateStack extends cdk.Stack {

  public readonly preferredTable: ddb.ITable;

  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);

    const pinpointPolicy = new iam.PolicyStatement({
      actions: ["mobiletargeting:UpdateEndpointsBatch",
                "mobiletargeting:GetUserEndpoints"],
      resources: ['*']
    });
    
    this.preferredTable = new ddb.Table(this, `${constant.Namespace}PreferredTable`, {
      tableName: `${constant.Namespace}PreferredTable`,
      partitionKey: {name: 'client_id', type: ddb.AttributeType.STRING},
      sortKey: {name: 'campaign_id', type: ddb.AttributeType.STRING}
    });

    const preferredUpdateHandler = new lambda.Function(this, `${constant.Namespace}UpdateLambda`, {
      functionName: `${constant.Namespace}UpdateLambda`,
      runtime: lambda.Runtime.PYTHON_3_8,
      environment: {
        PREFERRED_TABLE: this.preferredTable.tableName,
        USER_TABLE: props.userTable.tableName,
        PINPOINT_APP: props.pinpointApp.ref
      },
      timeout: Duration.minutes(5),
      handler: 'update_lambda.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-handler'))
    });
    
    preferredUpdateHandler.addToRolePolicy(pinpointPolicy);
    this.preferredTable.grantReadData(preferredUpdateHandler);
    props.userTable.grantReadData(preferredUpdateHandler);

  }
}
