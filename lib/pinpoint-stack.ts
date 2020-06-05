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
