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
import * as ssm from '@aws-cdk/aws-ssm'
import { PolicyStatement, PolicyDocument } from '@aws-cdk/aws-iam';
import { Duration } from '@aws-cdk/core';


interface Props extends cdk.StackProps {
  pinpointApp: pinpoint.CfnApp;
  preferredTable: ddb.ITable;
}

export class PinpointEventstreamStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: Props) {
    super(scope, id, props);

    // lambda handler
    const ddbPolicy = new iam.PolicyStatement({
      actions: ["dynamodb:BatchWriteItem"],
      resources: [props.preferredTable.tableArn]
    });

    const eventstreamHandler = new lambda.Function(this, `${constant.Namespace}EventstreamLambda`, {
      functionName: `${constant.Namespace}EventstreamLambda`,
      runtime: lambda.Runtime.PYTHON_3_8,
      timeout: Duration.minutes(1),
      handler: 'eventstream_lambda.lambda_handler',
      environment: {
        PREFERRED_TABLE: props.preferredTable.tableName,
      },
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-handler'))
    });
    eventstreamHandler.addToRolePolicy(ddbPolicy);

    // s3 bucket
    const eventstreamBucket = new s3.Bucket(this, `${constant.Namespace}PinpointEventstreamS3`);

    // firehose
    const firehoseDeliveryRole = new iam.Role(this, `${constant.Namespace}FirehoseDeliveryRole`, {
      assumedBy: new iam.ServicePrincipal("firehose.amazonaws.com"),
      inlinePolicies: {
        'firehose_delivery_role': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: [
                "glue:GetTable",
                "glue:GetTableVersion",
                "glue:GetTableVersions"
              ],
              resources: [
                "*"
              ]
            }),
            new iam.PolicyStatement({
              actions: [
                "s3:AbortMultipartUpload",
                "s3:GetBucketLocation",
                "s3:GetObject",
                "s3:ListBucket",
                "s3:ListBucketMultipartUploads",
                "s3:PutObject"
              ],
              resources: [
                eventstreamBucket.bucketArn,
                eventstreamBucket.bucketArn + "/*",
                "arn:aws:s3:::%FIREHOSE_BUCKET_NAME%",
                "arn:aws:s3:::%FIREHOSE_BUCKET_NAME%/*"
              ]
            }),
            new iam.PolicyStatement({
              actions: [
                "lambda:InvokeFunction",
                "lambda:GetFunctionConfiguration"
              ],
              resources: [
                `arn:aws:lambda:${this.region}:${this.account}:function:${eventstreamHandler.functionName}:%FIREHOSE_DEFAULT_VERSION%`
              ]
            }),
            new iam.PolicyStatement({
              actions: [
                "logs:PutLogEvents"
              ],
              resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/kinesisfirehose/%FIREHOSE_STREAM_NAME%:log-stream:*` // check %FIREHOSE_STREAM_NAME%
              ]
            }),
            new iam.PolicyStatement({
              actions: [
                "kinesis:DescribeStream",
                "kinesis:GetShardIterator",
                "kinesis:GetRecords",
                "kinesis:ListShards"
              ],
              resources: [
                `arn:aws:kinesis:${this.region}:${this.account}:stream/%FIREHOSE_STREAM_NAME%`
              ]
            }),
            new iam.PolicyStatement({
              actions: [
                "kms:Decrypt"
              ],
              resources: [
                `arn:aws:kms:${this.region}:${this.account}:key/%SSE_KEY_ID%`
              ],
              conditions: {
                "StringEquals": {
                  "kms:ViaService": "kinesis.%REGION_NAME%.amazonaws.com"
                },
                "StringLike": {
                  "kms:EncryptionContext:aws:kinesis:arn": `arn:aws:kinesis:%REGION_NAME%:${this.account}:stream/%FIREHOSE_STREAM_NAME%`
                }
              }
            })

          ]
        })
      }
    })

    const fs = new firehose.CfnDeliveryStream(this, `${constant.Namespace}Firehose`, {
      deliveryStreamName: `${constant.Namespace}PinpointStream`,
      deliveryStreamType: 'DirectPut',
      // s3DestinationConfiguration: {
      //   bucketArn: eventstreamBucket.bucketArn,
      //   roleArn: firehoseDeliveryRole.roleArn,
      //   errorOutputPrefix: "error",
      //   bufferingHints: {
      //     sizeInMBs: 1,
      //     intervalInSeconds: 60
      //   },
      //   compressionFormat: "UNCOMPRESSED",
      //   cloudWatchLoggingOptions: {
      //     enabled: true,
      //     logGroupName: `${constant.Namespace}PinpointStream`,
      //     logStreamName: 'S3Delivery'
      //   },
      // },
      extendedS3DestinationConfiguration: {
        bucketArn: eventstreamBucket.bucketArn,
        roleArn: firehoseDeliveryRole.roleArn,
        errorOutputPrefix: "error",
        bufferingHints: {
          sizeInMBs: 1,
          intervalInSeconds: 60
        },
        compressionFormat: "UNCOMPRESSED",
        cloudWatchLoggingOptions: {
          enabled: true,
          logGroupName: `${constant.Namespace}PinpointStream`,
          logStreamName: "S3Delivery"
        },
        processingConfiguration: {
          enabled: true,
          processors: [
            {
              type: "Lambda",
              parameters: [
                {
                  parameterName: "LambdaArn",
                  parameterValue: `${eventstreamHandler.functionArn}:$LATEST`
                },
                {
                  parameterName: "NumberOfRetries",
                  parameterValue: "3",
                },
                {
                  parameterName: "RoleArn",
                  parameterValue: firehoseDeliveryRole.roleArn,
                },
                {
                  parameterName: "BufferSizeInMBs",
                  parameterValue: "1"
                },
                {
                  parameterName: "BufferIntervalInSeconds",
                  parameterValue: "60"
                }
              ]
            }
          ]
        }
      }
    });



    // event stream
    const eventstreamPolicy = new iam.PolicyStatement({
      actions: [
        "firehose:PutRecordBatch",
        "firehose:DescribeDeliveryStream"
      ],
      resources: [fs.attrArn]
    });
    const eventstreamRole = new iam.Role(this, `${constant.Namespace}EventstreamRole`, {
      assumedBy: new iam.ServicePrincipal('pinpoint.amazonaws.com'),
      path: '/service-role/',
      inlinePolicies: {
        'PinpointEventstreamPolicy': new iam.PolicyDocument({
          statements: [
            eventstreamPolicy
          ]
        })
      }
    });

    new pinpoint.CfnEventStream(this, `${constant.Namespace}PinpointEventstream`, {
      applicationId: props.pinpointApp.ref,
      roleArn: eventstreamRole.roleArn,
      destinationStreamArn: fs.attrArn
    });

    

  }
}
