#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsPinpointUpdatePreferredChannelStack } from '../lib/aws_pinpoint_update_preferred_channel-stack';

const app = new cdk.App();
new AwsPinpointUpdatePreferredChannelStack(app, 'AwsPinpointUpdatePreferredChannelStack');
