###############################################################################
# Copyright 2020 Amazon.com, Inc. and its affiliates. All Rights Reserved.    #
#                                                                             #
# Licensed under the Amazon Software License (the "License").                 #
#  You may not use this file except in compliance with the License.           #
# A copy of the License is located at                                         #
#                                                                             #
#  http://aws.amazon.com/asl/                                                 #
#                                                                             #
#  or in the "license" file accompanying this file. This file is distributed  #
#  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either  #
#  express or implied. See the License for the specific language governing    #
#  permissions and limitations under the License.                             #
###############################################################################

from __future__ import print_function

import botocore
import base64
import boto3
import json
import os
from botocore.exceptions import ClientError
from boto3.dynamodb.table import BatchWriter
from boto3.dynamodb.conditions import Key, Attr

print('Loading function')

pinpoint = boto3.client('pinpoint')
ddb = boto3.resource('dynamodb')
#user_table = ddb.Table('PreferredUserTable')
#preferred_table = ddb.Table('PreferredPreferredTable')
preferred_table = ddb.Table(os.environ('PREFERRED_TABLE'))
user_table = ddb.Table(os.environ('USER_TABLE'))
application_id = 'c6504a2cca654c0f8415184859857fdc'

def lambda_handler(event, context):
  
  response = user_table.scan()
  items = response['Items']

  updates = []
  for item in items:
    client_id, preferred = get_preferred(item['user_id'])
    if preferred is None:
      continue

    # now we know user_id and preferred
    # so, let's update!
    update = {
      'Id': client_id,
      'User': {
        'UserId': item['user_id'],
        'UserAttributes': {
          'PreferredChannel': [preferred]
        }
      }
    }
    updates.append(update)

  # print(updates)
  pinpoint.update_endpoints_batch(
    ApplicationId=application_id,
    EndpointBatchRequest={
      'Item': updates
    }
  )


def get_preferred(user_id):

  if user_id is None:
    return None

  preferred = {}

  try:
    response = pinpoint.get_user_endpoints(
      ApplicationId=application_id,
      UserId=user_id
    )
  except ClientError as e:
    print(e.response)
    return None

  items = response['EndpointsResponse']['Item']
  for item in items:
    
    channel_type = item['ChannelType']
    client_id = item['Id']
    response = preferred_table.query(
        ProjectionExpression="#read",
        ExpressionAttributeNames={"#read":"read"},
        FilterExpression=
            Attr('channel').eq(channel_type),# & Attr('read').eq(True),
        KeyConditionExpression=
            Key('client_id').eq(client_id)
    )
    # print(response)
    count = sum(1 for x in response['Items'] if x != {})
    total = response['Count'] if response['Count'] != 0 else 1
    preferred_rate = count / total
    preferred[channel_type] = preferred_rate

  # print(preferred)

  max_preferred = max(preferred, key=lambda k: preferred[k])

  # in order to call UpdateEndpoint, a client_id is necessary at least
  return (client_id, max_preferred)


lambda_handler(None, None)