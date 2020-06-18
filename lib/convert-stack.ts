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
import * as constant from './interfaces/constant'

export class ConvertStack extends cdk.Stack {

  public readonly preferredTable: ddb.Table;
  public readonly userTable: ddb.Table;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.preferredTable = new ddb.Table(this, `${constant.Namespace}PreferredTable`, {
      tableName: `${constant.Namespace}PreferredTable`,
      partitionKey: {name: 'client_id', type: ddb.AttributeType.STRING},
      sortKey: {name: 'campaign_id', type: ddb.AttributeType.STRING}
    });

    this.userTable = new ddb.Table(this, `${constant.Namespace}UserTable`, {
      tableName: `${constant.Namespace}UserTable`,
      partitionKey: {name: 'user_id', type: ddb.AttributeType.STRING},
    });
  }
}
