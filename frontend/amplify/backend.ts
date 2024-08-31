import * as path from 'path';
import * as cr from 'aws-cdk-lib/custom-resources';
import * as cdk from 'aws-cdk-lib';
import { Backend, defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { ConstructFactory, ResourceProvider } from '@aws-amplify/plugin-types';
import { BackendAuth } from '@aws-amplify/backend-auth';
import { AmplifyGraphqlApi } from '@aws-amplify/graphql-api-construct';
import { StorageResources } from '@aws-amplify/backend-storage';
import { Table, AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { DatabaseCluster,  DatabaseClusterEngine, AuroraPostgresEngineVersion, Credentials, ParameterGroup } from 'aws-cdk-lib/aws-rds';
import { Vpc, SecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

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

const buildCustomResources = async (backend: Backend<{
    auth: ConstructFactory<BackendAuth>;
    data: ConstructFactory<AmplifyGraphqlApi>;
    storage: ConstructFactory<ResourceProvider<StorageResources>>;
  }>) => {
  const crStack = backend.createStack('CustomResources');

  const ragAgentFunctionPolicy = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['secretsmanager:GetSecretValue'],
    resources: ['arn:aws:secretsmanager:ap-northeast-1:047980477351:secret:OPENAI_API_KEY-*'],
  });
  
  // Define the first Lambda function
  const ragAgentFunction = new Function(crStack, 'ragAgentFunction', {
    runtime: Runtime.PYTHON_3_12,
    handler: 'index.handler',
    code: Code.fromAsset('../backend/rag-agent'),
  });
  ragAgentFunction.addToRolePolicy(ragAgentFunctionPolicy);
  
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

  // Add DynamoDB table resource
  const inventoryTable = new Table(crStack, 'InventoryTable', {
    partitionKey: { name: 'ingredient_id', type: AttributeType.STRING },
    sortKey: { name: 'timestamp', type: AttributeType.NUMBER },
    tableName: 'InventoryTable',
    removalPolicy: RemovalPolicy.RETAIN, // Change to DESTROY if you want the table to be removed when the stack is deleted
  });

  // Add permissions for Lambda functions to access DynamoDB table
  inventoryTable.grantReadWriteData(ragAgentFunction);
  inventoryTable.grantReadWriteData(reactAgentFunction);

  // VPC and Security group configuration for RDS
  const vpc = new Vpc(crStack, 'RdsVpc', { maxAzs: 2 });
  const securityGroup = new SecurityGroup(crStack, 'RdsSecurityGroup', {
    vpc,
    allowAllOutbound: true,
    securityGroupName: 'AuroraSecurityGroup',
  });

  // Secrets Manager for DB credentials
  const dbSecret = new Secret(crStack, 'DbSecret', {
    secretName: 'AuroraBedrockDbSecret',
    generateSecretString: {
      secretStringTemplate: JSON.stringify({
        username: 'bedrock_user',
      }),
      generateStringKey: 'password',
    },
  });

  // Create Aurora PostgreSQL DB Cluster
  const auroraCluster = new DatabaseCluster(crStack, 'AuroraCluster', {
    engine: DatabaseClusterEngine.auroraPostgres({
      version: AuroraPostgresEngineVersion.VER_14_6,  // Set to a supported version that works with pgvector
    }),
    instanceProps: {
      vpc,
      securityGroups: [securityGroup],
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
    },
    credentials: Credentials.fromSecret(dbSecret),
    defaultDatabaseName: 'bedrock_db',
    parameterGroup: ParameterGroup.fromParameterGroupName(crStack, 'ParameterGroup', 'default.aurora-postgresql14'), // Adjust parameter group as needed
  });

  // Post-deployment: Run SQL commands via a Lambda function
  const dbSetupFunction = new Function(crStack, 'DbSetupFunction', {
    runtime: Runtime.PYTHON_3_12,
    handler: 'index.handler',
    code: Code.fromAsset('../backend/db-setup'),
    environment: {
      DB_SECRET_ARN: dbSecret.secretArn,
      DB_CLUSTER_ARN: auroraCluster.clusterArn,
    },
  });

  dbSetupFunction.addToRolePolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['rds-data:ExecuteStatement', 'secretsmanager:GetSecretValue'],
    resources: [auroraCluster.clusterArn, dbSecret.secretArn],
  }));

  // Outputs
  crStack.exportValue(auroraCluster.clusterEndpoint.hostname, { name: 'AuroraClusterEndpoint' });
  crStack.exportValue(dbSecret.secretArn, { name: 'DbSecretArn' });

  // Example of the SQL commands to be executed by the dbSetupFunction:
  /*
    CREATE EXTENSION IF NOT EXISTS vector;
    SELECT extversion FROM pg_extension WHERE extname='vector';
    CREATE SCHEMA bedrock_integration;
    CREATE ROLE bedrock_user WITH PASSWORD 'password' LOGIN;
    GRANT ALL ON SCHEMA bedrock_integration to bedrock_user;
    CREATE TABLE bedrock_integration.bedrock_kb (id uuid PRIMARY KEY, embedding vector(1536), chunks text, metadata json);
    CREATE INDEX on bedrock_integration.bedrock_kb USING hnsw (embedding vector_cosine_ops);
  */
  // Lambda-backed Custom Resourceの設定
  const bedrockLambda = new Function(crStack, 'BedrockLambda', {
    runtime: Runtime.NODEJS_20_X,
    handler: 'index.handler',
    code: Code.fromAsset(path.join(__dirname, 'bedrock-lambda')), // Lambdaコードのパス
    environment: {
      DB_SECRET_ARN: dbSecret.secretArn,
      DB_CLUSTER_ARN: auroraCluster.clusterArn,
    },
  });

  bedrockLambda.addToRolePolicy(new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:CreateKnowledgeBase', 'secretsmanager:GetSecretValue', 'rds-data:ExecuteStatement'],
    resources: ['*'], // 必要に応じてリソースを特定する
  }));

  // カスタムリソースプロバイダーの設定
  const provider = new cr.Provider(crStack, 'KnowledgeBaseProvider', {
    onEventHandler: bedrockLambda,
  });

  // カスタムリソースの作成
  new cdk.CustomResource(crStack, 'CreateKnowledgeBase', {
    serviceToken: provider.serviceToken,
    properties: {
      name: 'YourKnowledgeBaseName',
      description: 'A description of your knowledge base',
      instructions: 'Instructions on what the knowledge base should do',
      foundationModel: 'OpenAI GPT-4',
      roleArn: 'arn:aws:iam::123456789012:role/YourBedrockRoleArn',
      storageConfiguration: {
        type: 'aurora',
        rdsConfiguration: {
          endpoint: auroraCluster.clusterEndpoint.hostname,
          port: 5432,
          databaseName: 'bedrock_db',
          dbUser: 'bedrock_user',
          dbPassword: dbSecret.secretValueFromJson('password').toString(),
        },
      },
      dataSourceConfiguration: {
        s3DataSource: {
          bucket: 'your-s3-bucket-name',
          keyPrefix: 'your/data/source/prefix/',
        },
      },
      vectorIngestionConfiguration: {
        chunkSize: 1000,
        overlapSize: 50,
      },
    },
  });
};
buildCustomResources(backend);

