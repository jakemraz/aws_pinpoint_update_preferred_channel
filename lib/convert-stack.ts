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
