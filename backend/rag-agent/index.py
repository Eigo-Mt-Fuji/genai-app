import os

from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_structured_chat_agent
from langchain_core.tools import ToolException, StructuredTool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

# OpenAI APIの設定
llm = ChatOpenAI(
    openai_api_key=os.environ["OPENAI_API_KEY"], 
    model_name="gpt-4")

# 在庫データベース検索用ツール
def inventory_check_tool(query) -> str:
    print(f"Query: {query}")
    # DynamoDBまたは他のデータベースから在庫をチェックする関数を実装します
    # ここでは擬似的な例を使用します
    inventory = {
        "ウィスキー": ["山崎ウィスキー（ノンエイジ）", "ジャックダニエル ハニー"],
        "割りもの": ["ウィルキンソン", "コカ・コーラ", "キリン・レモン", "ソーダ"],
        "つまみ": ["カシューナッツ", "アーモンド", "チーズの盛り合わせ"]
    }
    results = []
    for item in query.split(","):
        for key, values in inventory.items():
            if item.strip() in values:
                results.append(item.strip())
    # 出力をエージェントが期待する形式に整形
    if results:
        return f"InventoryChecker: {', '.join(results)}"
    else:
        return "InventoryChecker: No matching items found."

inventory_tool = StructuredTool.from_function(
    name="InventoryChecker",
    func=inventory_check_tool,
    description="在庫データベースにアイテムがあるかどうかを確認します。在庫データベースで検索する際のツールの呼び出し方について、 提案をカンマ区切りで結合しツールの引数に渡してください。ツールの戻り値が空ではない場合、１つ以上のアイテムが在庫データベースに存在することを意味します。",
    return_direct = False,
)

system = '''
Respond to the human as helpfully and accurately as possible. 

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

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system),
        MessagesPlaceholder("chat_history", optional=True),
        ("human", human),
    ]
)

agent = create_structured_chat_agent(
    llm=llm,
    tools=[inventory_tool],
    prompt=prompt,
)

agent_chain = AgentExecutor(agent=agent, tools=[inventory_tool],
                            verbose=True,
                            handle_parsing_errors=True,
                            return_intermediate_steps=True)

def get_secret(secret_name):
    client = boto3.client('secretsmanager')
    get_secret_value_response = client.get_secret_value(SecretId=secret_name)
    secret = get_secret_value_response['SecretString']
    return secret

def handler(event, context):
    print(event)
    secret_name = "OPENAI_API_KEY"
    openai_api_key = get_secret(secret_name)
    # エージェントの実行
    try:
        alcohol = "ウィスキー"
        condition = "良好"
        weather = "快晴"
        input = {
            "input": """
                あなたはスーパーバーテンダーです。
                お酒の種類: {alcohol}
                依頼主の体調: {condition}
                天候: {weather}
                
                提案してください：
                1. 飲み物の名前
                2. 作り方
                3. つまみ
                4. 割りもの（水やサイダーなどソフトドリンク）

                提案内容を在庫データベースで検索し、存在するかどうか確認してください。1つでも在庫があれば提案を確定とし「試してみてね」と添えてプロンプトのやりとりを終了してください。
            """.format(alcohol=alcohol, condition=condition, weather=weather)
        }
        result = agent_chain.invoke(input=input)
        print(result)
    except Exception as e:
        print(f"Error during agent execution: {e}")
