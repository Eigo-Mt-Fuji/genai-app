import os

from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_structured_chat_agent
from langchain_core.prompts import ChatPromptTemplate, HumanMessagePromptTemplate
from langchain_core.tools import ToolException, StructuredTool
import boto3
import base64
import time

# DynamoDBクライアントの作成
dynamodb = boto3.resource('dynamodb')

TABLE_NAME = "InventoryTable"

def write_inventory(ingredients) -> str:
    print(f"Ingredients to store: {ingredients}")
    
    # DynamoDBテーブルを取得
    table = dynamodb.Table(TABLE_NAME)
    
    try:
        # 1行ずつDynamoDBに書き込み
        for ingredient in ingredients["items"]:
            if ingredient.strip():  # 空行を無視
                table.put_item(
                    Item={
                        'ingredient_id': ingredient.strip(),  # primary keyとしてingredient名を使用
                        'timestamp': int(time.time())  # オプションでタイムスタンプを追加
                    }
                )
        return "InventoryWriter: store ingredient success"
    except Exception as e:
        print(f"Error writing to DynamoDB: {e}")
        return f"Failed to store ingredients: {str(e)}"

inventory_tool = StructuredTool.from_function(
    name="InventoryWriter",
    func=write_inventory,
    description="在庫データベースにアイテムを保存します。",
    return_direct = False,
)

# OpenAI APIの設定
llm = ChatOpenAI(
    openai_api_key=os.environ["OPENAI_API_KEY"], 
    model_name="gpt-4o"  # Assuming a multimodal model capable of handling images
)

system = '''
Respond to the human as helpfully and accurately as possible, using given image_data.

You have access to the following tools:

{tools}

Use a json blob to specify a tool by providing an action key (tool name) and an action_input key (tool input).

Valid "action" values: "Final Answer" or {tool_names}

Provide only ONE action per $JSON_BLOB, as shown:

```
{{
  "action": $TOOL_NAME,
  "action_input": $INPUT
}}
```

$INPUT in $JSON_BLOB, should have an ingredients attribute which contains sub-attribute "items" that list of item expected to store into inventory.

Follow this format:

Question: input question to answer
Thought: consider previous and subsequent steps
Action:
```
$JSON_BLOB
```
Observation: action result
... (repeat Thought/Action/Observation N times)
Thought: I know what to respond
Action:
```
{{
  "action": "Final Answer",
  "action_input": "Final response to human"
}}

Begin! Reminder to ALWAYS respond with a valid json blob of a single action. Use tools if necessary. Respond directly if appropriate. Format is Action:```$JSON_BLOB```then Observation'''

human = '''{input}

{agent_scratchpad}

(reminder to respond in a JSON blob no matter what)'''

# ImagePromptTemplateの設定
image_template = {"image_url": {"url": "data:image/png;base64,{image_data}"}}
human_message_template = HumanMessagePromptTemplate.from_template([human, image_template])

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system),
        human_message_template,
    ]
)

agent = create_structured_chat_agent(
    llm=llm,
    tools=[inventory_tool],
    prompt=prompt,
)

agent_chain = AgentExecutor(
    agent=agent, 
    tools=[inventory_tool], 
    verbose=True, 
    handle_parsing_errors=True, 
    return_intermediate_steps=True
)

# Function to encode the image
def encode_image(image_data):
    return base64.b64encode(image_data).decode('utf-8')

def get_secret(secret_name):
    client = boto3.client('secretsmanager')
    get_secret_value_response = client.get_secret_value(SecretId=secret_name)
    secret = get_secret_value_response['SecretString']
    return secret

# write lambda function handler python 3.12
def handler(event, context):
    print(event)
    secret_name = "OPENAI_API_KEY"
    openai_api_key = get_secret(secret_name)
    
    # S3クライアントの作成
    s3_client = boto3.client('s3')

    # S3イベントからバケット名とオブジェクトキーを取得
    bucket_name = event['Records'][0]['s3']['bucket']['name']
    object_key = event['Records'][0]['s3']['object']['key']

    # 画像をS3から取得
    s3_response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
    # バイト形式の画像データ
    image_data = s3_response['Body'].read()

    # エージェントの実行
    try:
        input_data = {
            "input": """
                [フォーマット]
                CSV形式
                １行の１つの材料を日本語で出力
                [具体例]
                きのこ
                たけのこ
            """,
            "image_data": encode_image(image_data)
        }
        result = agent_chain.invoke(input=input_data)
        print(result["output"])
    except Exception as e:
        print(f"Error during agent execution: {e}")


handler({
    "Records": [
        {
            "s3": {
                "bucket": {
                    "name": "amplify-frontend-eigofuji-amplifytemplatebucketcc3-ia5b8dtfunxm"
                },
                "object": {
                    "key": "test.png"
                }
            }
        }
    ]
}, {})