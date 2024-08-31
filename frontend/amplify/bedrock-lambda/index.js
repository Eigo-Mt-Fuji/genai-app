const { BedrockClient, CreateKnowledgeBaseCommand } = require('@aws-sdk/client-bedrock');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const bedrockClient = new BedrockClient({ region: 'ap-northeast-1' });
  const secretsManagerClient = new SecretsManagerClient({ region: 'ap-northeast-1' });

  // シークレットの取得例
  const secretArn = process.env.DB_SECRET_ARN; // 環境変数に設定されたシークレットARNを利用
  const secretResponse = await secretsManagerClient.send(new GetSecretValueCommand({ SecretId: secretArn }));
  const secret = JSON.parse(secretResponse.SecretString);

  // CreateKnowledgeBase APIリクエストの構築
  const params = {
    name: event.ResourceProperties.name,
    description: event.ResourceProperties.description,
    instructions: event.ResourceProperties.instructions,
    foundationModel: event.ResourceProperties.foundationModel,
    roleArn: event.ResourceProperties.roleArn,
    storageConfiguration: event.ResourceProperties.storageConfiguration,
    dataSourceConfiguration: event.ResourceProperties.dataSourceConfiguration,
    vectorIngestionConfiguration: event.ResourceProperties.vectorIngestionConfiguration,
  };

  try {
    const command = new CreateKnowledgeBaseCommand(params);
    const response = await bedrockClient.send(command);
    console.log('Knowledge Base created:', response.knowledgeBaseArn);
  } catch (error) {
    console.error('Error creating Knowledge Base:', error);
    throw error;
  }
};
