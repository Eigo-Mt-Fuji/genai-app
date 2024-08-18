import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Stack } from 'aws-cdk-lib';

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