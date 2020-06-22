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

import base64
import boto3
import json
import os
from botocore.exceptions import ClientError
from boto3.dynamodb.table import BatchWriter

print('Loading function')

ddb = boto3.resource('dynamodb')
table = ddb.Table(os.environ['PREFERRED_TABLE'])

def lambda_handler(event, context):
    output = []
    
    items = []
    duplicate = {}

    for record in event['records']:
        print(record['recordId'])
        payload = base64.b64decode(record['data'])
        
        print(payload)
        
        item = get_preferred_item(json.loads(base64.b64decode(record['data']).decode('utf-8')))
        print(item)

        if item is not None:
            items.append(item)
            key = item['client_id'] + item['campaign_id']
            duplicate[key] = duplicate.get(key, 0) + 1

        output_record = {
            'recordId': record['recordId'],
            'result': 'Ok',
            'data': base64.b64encode(payload)
        }
        output.append(output_record)

    with table.batch_writer() as batch:
        for item in items:
            
            key = item['client_id'] + item['campaign_id']
            if duplicate[key] == 0:
                continue
            elif duplicate[key] > 1 and item.get('read', None) == None:
                # ignore 'send' if duplicated
                continue
            elif duplicate[key] > 1 and item.get('read', None) != None:
                duplicate[key] = 0 # Don't use anymore

            try:
                batch.put_item(Item=item)

            except ClientError as e:
                print(e.response)


    print('Successfully processed {} records.'.format(len(event['records'])))

    return {'records': output}


def get_preferred_item(payload):
    item = {}
    send_event = ['_campaign.send']
    read_event = ['_email.open','_campaign.opened_notification']
    
    event_type = payload.get('event_type', None)
    if event_type == None:
        return
    
    if event_type not in send_event and event_type not in read_event:
        return
    
    attributes = payload.get('attributes', None)
    if attributes == None:
        return
    
    item['client_id'] = payload['client']['client_id']
    item['campaign_id'] = attributes['campaign_id']
    
    if event_type in send_event:
        item['send'] = True
        endpoint = json.loads(payload['client_context']['custom']['endpoint'])
        item['channel'] = endpoint['ChannelType']
        user_id = endpoint.get('User',{'UserId':''}).get('UserId','')
        #item['user_id'] = user_id
    else:
        item['send'] = True
        item['read'] = True
        if event_type == '_email.open':
            item['channel'] = 'EMAIL'
        elif event_type == '_campaign.opened_notification':
            item['channel'] = payload['endpoint']['ChannelType']
        
    
    return item

