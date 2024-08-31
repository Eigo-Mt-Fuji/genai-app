import boto3
import os
import json

# 環境変数からシークレットとクラスターARNを取得
DB_SECRET_ARN = os.environ['DB_SECRET_ARN']
DB_CLUSTER_ARN = os.environ['DB_CLUSTER_ARN']

# AWSクライアントの初期化
secrets_client = boto3.client('secretsmanager')
rds_data_client = boto3.client('rds-data')

def get_db_credentials(secret_arn):
    """Secrets Managerからデータベースの認証情報を取得"""
    response = secrets_client.get_secret_value(SecretId=secret_arn)
    secret = json.loads(response['SecretString'])
    return secret

def execute_sql(sql_statements, database):
    """RDS Data APIを使ってSQLコマンドを実行"""
    response = rds_data_client.execute_statement(
        resourceArn=DB_CLUSTER_ARN,
        secretArn=DB_SECRET_ARN,
        database=database,
        sql=sql_statements
    )
    return response

def handler(event, context):
    # データベースの認証情報を取得
    credentials = get_db_credentials(DB_SECRET_ARN)
    
    # SQLコマンドの定義
    sql_commands = """
    CREATE EXTENSION IF NOT EXISTS vector;
    CREATE SCHEMA IF NOT EXISTS bedrock_integration;
    CREATE ROLE bedrock_user WITH PASSWORD '%s' LOGIN;
    GRANT ALL ON SCHEMA bedrock_integration TO bedrock_user;
    CREATE TABLE IF NOT EXISTS bedrock_integration.bedrock_kb (
        id uuid PRIMARY KEY, 
        embedding vector(1536), 
        chunks text, 
        metadata json
    );
    CREATE INDEX IF NOT EXISTS bedrock_kb_hnsw_idx ON bedrock_integration.bedrock_kb USING hnsw (embedding vector_cosine_ops);
    """ % credentials['password']

    try:
        # SQLコマンドを実行
        response = execute_sql(sql_commands, 'bedrock_db')
        print("SQL execution response:", response)
    except Exception as e:
        print("Error executing SQL commands:", str(e))
        raise

    return {
        'statusCode': 200,
        'body': json.dumps('Database setup completed successfully!')
    }
