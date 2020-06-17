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
