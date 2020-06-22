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
 import * as ddb from '@aws-cdk/aws-dynamodb';
 import * as iam from '@aws-cdk/aws-iam';
 import * as lambda from '@aws-cdk/aws-lambda';
 import * as constant from './interfaces/constant'
 import * as firehose from '@aws-cdk/aws-kinesisfirehose'
 import * as s3 from '@aws-cdk/aws-s3'
 import * as path from 'path';
 
 
 interface Props extends cdk.StackProps{
   pinpointApp: pinpoint.CfnApp;
   preferredTable: ddb.ITable;
 }
 
 export class PinpointEventstreamStack extends cdk.Stack {
   constructor(scope: cdk.Construct, id: string, props: Props) {
     super(scope, id, props);
 
     new s3.Bucket(this, `${constant.Namespace}PinpointEventstreamS3`);
 
     // const firehoseRole = new iam.Role(this, `${constant.Namespace}FirehoseDeliveryRole`, {
     //   assumedBy: new iam.ServicePrincipal("firehose.amazonaws.com"),
     // })
     // firehoseRole.addToPolicy(new iam.PolicyStatement({
     //   actions: [
     //     "s3:AbortMultipartUpload",
     //     "s3:GetBucketLocation",
     //     "s3:GetObject",
     //     "s3:ListBucket",
     //     "s3:ListBucketMultipartUploads",
     //     "s3:PutObject"
     //   ]
     // }));
     
 
     
 
     // const fs = new firehose.CfnDeliveryStream(this, `${constant.Namespace}Firehose`, {
     //   s3DestinationConfiguration: {
     //     bucketArn: pinpointEventstreamS3.bucketArn,
         
     //   }
 
     // });
 
 
 
 
     const ddbPolicy = new iam.PolicyStatement({
       actions: ["dynamodb:*"],
       resources: ['*']
     });
 
     const preferredUpdateHandler = new lambda.Function(this, `${constant.Namespace}EventstreamLambda`, {
       functionName: `${constant.Namespace}EventstreamLambda`,
       runtime: lambda.Runtime.PYTHON_3_8,
       handler: 'eventstream_lambda.lambda_handler',
       code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-handler'))
     });
     preferredUpdateHandler.addToRolePolicy(ddbPolicy);
   }
 }
 