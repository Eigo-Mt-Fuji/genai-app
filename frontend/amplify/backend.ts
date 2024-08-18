import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Stack } from 'aws-cdk-lib';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage,
});

// amplify gen2 で Cognito Identity Pool の認証されたユーザ向けのロールに storage のアクセス権を追加する
const existingStack = Stack.of(backend.auth.resources.authenticatedUserIamRole);
const policyStatement = new PolicyStatement({
  effect: Effect.ALLOW,
  actions: [
    's3:GetObject', 
    's3:PutObject', 
    's3:DeleteObject'
  ],
  resources: [
    `arn:aws:s3:::${backend.storage.resources.bucket.bucketName}/*`,
  ]
});
/**
 * [Sandbox] Previous deployment is still in progress. Will queue for another deployment after this one finishes

⚠️ The following non-hotswappable changes were found:
    logicalID: allowManageStoragePolicy816172F4, type: AWS::IAM::Policy, reason: This resource type is not supported for hotswap deployments
 */
const allowStoragePolicy = new Policy(existingStack, 'allowManageStoragePolicy', {
  policyName: 'allowStorageInlinePolicy',
  statements: [policyStatement],
});
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(allowStoragePolicy);
const crStack = backend.createStack('CustomResources');

// Define the first Lambda function
const ragAgentFunction = new Function(crStack, 'ragAgentFunction', {
  runtime: Runtime.PYTHON_3_12,
  handler: 'index.handler',
  code: Code.fromAsset('../backend/rag-agent'),
});

// Define the second Lambda function
const reactAgentFunction = new Function(crStack, 'reactAgentFunction', {
  runtime: Runtime.PYTHON_3_12,
  handler: 'index.handler',
  code: Code.fromAsset('../backend/react-agent'),
});

// Configure S3 event source for reactAgentFunction
const s3Bucket = backend.storage.resources.bucket as Bucket;

reactAgentFunction.addEventSource(new S3EventSource(s3Bucket, {
  events: [EventType.OBJECT_CREATED],
}));

