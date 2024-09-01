# README

## 概要

- お酒っぽいノンアルコール飲料を提案するRAG を実装するぞ（目標）
  - 手持ち材料を、名称の揺らぎをなるべく吸収しつつ生成AIに認識させ、アレルギーなど安全な判断を交えていい感じの飲料とつまみを提案させる
  - できれば写真を撮影し手持ち材料を認識させる

## 入力

- 手持ち材料
- NG材料

## アーキテクチャ
                    
### バックエンド

- 画像から材料を認識するエージェント(Langchain Agent(ReAct Agent))
  - 画像 -> テキスト -> データベース
- 飲料とつまみを提案するエージェント(Langchain Agent(RAG Agent))
  - テキスト+データベース -> テキスト

### フロントエンド

- Webアプリ（デバイスのカメラ機能→画像→アップロード→エージェントへのリクエスト送信→エージェントの実行結果の表示）
  - Framework
    - Next.js 14.x
  - UI
    - Camera Component
  - 利用技術・ライブラリ
    - MediaDevices: getUserMedia https://developer.mozilla.org/ja/docs/Web/API/MediaDevices/getUserMedia
    - `<video>` 動画埋め込み要素 https://developer.mozilla.org/ja/docs/Web/HTML/Element/video
  - API
    - UploadFile

### インフラ

- AWS Cognito

- AWS S3

- AWS Lambda#1 Python 3.11
  - 画像から材料を認識するエージェント(ReAct Agent)

- AWS Lambda#2 Python 3.11
  - 飲料とつまみを提案するエージェント(RAG Agent)

- AWS DynamoDB

- AWS Appsync

- AWS Secret Manager

```
aws secretsmanager create-secret --name OPENAI_API_KEY --secret-string "$OPENAI_API_KEY"                                   
```

## TODO

- [ ] データベースの設計
  - [ ] 論理設計
    - [x] エンティティの設計
    - [x] キー属性の設計
    - [x] 従属属性（キー属性以外の属性）の設計
    - [x] 検索要件に対するインデックスの設計
    - [x] 更新要件に対するインデックスの設計
    - [x] エンティティに対するデータサイズの設計
    - [x] ライフサイクルの設計
  - [ ] エンジン・プラットフォームの選択
  - [ ] 物理設計

- [ ] エージェントアプリケーションアーキテクチャ設計
  - [ ] エージェントアプリケーションの入出力設計
  - [ ] プロンプト自然言語設計
  - [ ] ユーザ入力
  - [ ] ツール入出力
  - [ ] エージェントの処理シーケンス設計
    - [生成AIリクエスト仕様・リクエスト回数設計
    - 生成AIプラットフォームの選択

- [ ] コスト・パフォーマンス設計

- [ ] 全体システム設計の更新

- [ ] UI設計

- [ ] アプリケーションコンポーネント設計

- [ ] 重要ビジネスロジックの内部処理シーケンス設計

## 備考

- [Langchainコンセプト学習](https://github.com/Eigo-Mt-Fuji/portfolio-2024/blob/main/docs/%E7%94%9F%E6%88%90AI/2024%E5%B9%B48%E6%9C%8812%E6%97%A5_Langchain%E3%82%B3%E3%83%B3%E3%82%BB%E3%83%95%E3%82%9A%E3%83%88%E5%AD%A6%E7%BF%92.md)
- [Plan](https://github.com/Eigo-Mt-Fuji/portfolio-2024/blob/main/docs/%E7%94%9F%E6%88%90AI/2024%E5%B9%B48%E6%9C%886%E6%97%A5_1%E6%97%A5%E3%81%A6%E3%82%99%E3%81%A6%E3%82%99%E3%81%8D%E3%82%8B%E3%80%81%E3%81%82%E3%82%8A%E3%82%82%E3%81%AE%E3%81%A6%E3%82%99%E3%81%8A%E9%85%92%E3%82%92%E6%8F%90%E6%A1%88%E3%81%99%E3%82%8B%E7%94%9F%E6%88%90AI%20x%20RAG%E3%82%A2%E3%83%95%E3%82%9A%E3%83%AA%E3%82%B1%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3%E8%A8%AD.md)
- [LMSYS arena leaderboard](https://lmarena.ai/?leaderboard)
- [pgvector](https://github.com/pgvector/pgvector)

```
eigofujikawa@EigoFujawanoMBP react-agent % python index.py
{'Records': [{'s3': {'bucket': {'name': 'amplify-frontend-eigofuji-amplifytemplatebucketcc3-ia5b8dtfunxm'}, 'object': {'key': 'test.png'}}}]}


> Entering new AgentExecutor chain...
Action:
```json
{
  "action": "Final Answer",
  "action_input": "牛乳\n卵\nマヨネーズ\nケチャップ\nバター\n豆腐\n醤油\nヨーグルト\nビール\n緑茶\nポン酢\n"
}
```

> Finished chain.
牛乳
卵
マヨネーズ
ケチャップ
バター
豆腐
醤油
ヨーグルト
ビール
緑茶
ポン酢
```

- データベースの設計
  - エンティティの設計
    - ユーザ(キー:ユーザID)
    
    - ユーザアップロード画像(キー:ユーザID,画像ID)
    
    - 画像読取結果材料リスト(キー:ユーザID,画像ID,材料ID)
      - 読取結果材料名称
    
    - ユーザ在庫アイテム(キー:ユーザID,アイテムID)
      - 材料ID(任意)
    
    - 提案詳細(キー:ユーザID,履歴ID)
      - LLMリクエストID
      - LLMレスポンス
      - ユーザ入力
      - 関連ユーザ在庫
    
    - ユーザアップロード履歴(キー:ユーザID,履歴ID)
      - アップロード日時
      - アップロード処理ステータス
    
    - 提案履歴(キー:ユーザID,履歴ID)
      - 提案日時
      - 提案処理ステータス

  - 検索要件に対するインデックスの設計
    - 全てのエンティティでキー属性による参照が可能

    - 画像読取結果材料リスト,ユーザ在庫アイテムは、日本語表記での同一材料(アイテム)存在チェックが行える

    - ユーザアップロード履歴, 提案履歴は
      - 最新のN件を取得可能
      - ステータスによる絞り込みが可能

  - 更新要件に対するインデックスの設計

    - キーを指定して更新できるエンティティ
      - ユーザ(キー:ユーザID)
      - ユーザ在庫アイテム(キー:ユーザID,アイテムID)
        - 材料ID(任意)

    - 新規登録後に更新が行えないエンティティ
      - 提案詳細(キー:ユーザID,履歴ID)
      - ユーザアップロード履歴(キー:ユーザID,履歴ID)
      - 提案履歴(キー:ユーザID,履歴ID)
      - ユーザアップロード画像(キー:ユーザID,画像ID)
      - 画像読取結果材料リスト(キー:ユーザID,画像ID,材料ID)
        - 読取結果材料名称

  - ライフサイクルの設計（永続ストレージに揮発性を持たせる）
    - ユーザが最後にログインしてから90日でデータが消える

  - エンティティに対するデータサイズの設計（１件あたりのデータサイズ、四半期（90日）データサイズ）
    - 1. ユーザ
      - **ユーザID**: UUID (16 bytes)
      - **1件あたりのデータサイズ**: 16 bytes
      - **1日あたりの件数**: 10件
      - **90日分のデータサイズ**: 16 bytes × 10件 × 90日 = **14,400 bytes** (14.4 KB)

    - 2. ユーザアップロード画像
      - **ユーザID**: UUID (16 bytes)
      - **画像ID**: UUID (16 bytes)
      - **1件あたりのデータサイズ**: 16 bytes + 16 bytes = 32 bytes
      - **1日あたりの件数**: 10件
      - **90日分のデータサイズ**: 32 bytes × 10件 × 90日 = **28,800 bytes** (28.8 KB)

    - 3. 画像読取結果材料リスト
      - **ユーザID**: UUID (16 bytes)
      - **画像ID**: UUID (16 bytes)
      - **材料ID**: UUID (16 bytes)
      - **読取結果材料名称**: 最大100文字（日本語, UTF-8）= 100 characters × 3 bytes/character = 300 bytes
      - **1件あたりのデータサイズ**: 16 bytes + 16 bytes + 16 bytes + 300 bytes = 348 bytes
      - **1日あたりの件数**: 10件
      - **90日分のデータサイズ**: 348 bytes × 10件 × 90日 = **313,200 bytes** (313.2 KB)

    - 4. ユーザ在庫アイテム
      - **ユーザID**: UUID (16 bytes)
      - **アイテムID**: UUID (16 bytes)
      - **材料ID**: UUID (16 bytes) (任意なので含む)
      - **1件あたりのデータサイズ**: 16 bytes + 16 bytes + 16 bytes = 48 bytes
      - **1日あたりの件数**: 10件
      - **90日分のデータサイズ**: 48 bytes × 10件 × 90日 = **43,200 bytes** (43.2 KB)

    - 5. 提案詳細
      - **ユーザID**: UUID (16 bytes)
      - **履歴ID**: UUID (16 bytes)
      - **LLMリクエストID**: UUID (16 bytes)
      - **LLMレスポンス**: 仮に最大1000文字 (日本語, UTF-8) = 1000 characters × 3 bytes/character = 3000 bytes
      - **ユーザ入力**: 仮に最大200文字 (日本語, UTF-8) = 200 characters × 3 bytes/character = 600 bytes
      - **関連ユーザ在庫**: UUID (16 bytes) × 仮に10件 = 160 bytes
      - **1件あたりのデータサイズ**: 16 bytes + 16 bytes + 16 bytes + 3000 bytes + 600 bytes + 160 bytes = 3,808 bytes
      - **1日あたりの件数**: 10件
      - **90日分のデータサイズ**: 3,808 bytes × 10件 × 90日 = **3,427,
  - エンジン・プラットフォームの選択
    - コストメリットを軸に考える
      - postgresデータベースを選択すると仮定する。
        - 他のデータベースエンジンでもっとコスト効率よく要件を満たす選択肢はいくつあるか、コストパフォーマンスの設計で考える

- エージェントアプリケーションアーキテクチャ設計->生成AIプラットフォームの選択
  - 最低限の情報収集
    - 企業が生成AIを活用する際の７大リスク / ６つの対応策
      - https://metaversesouken.com/ai/generative_ai/comparison/#i-2
    - 企業が生成AIを活用する際の７大リスク・対策の関係性の理解
      - ⑤間違ったアウトプットの生成(ハルシネーション)
        - ②最適なAIツールの選定・導入
        - ⑥最新動向を踏まえた生成AI活用方法の定期的な見直し
      - ⑦生成AIの過信による業務ミス
        - ④従業員向けの利用ルール・マニュアルの策定
        - ⑤従業員の生成AI活用リテラシーの向上
        - ⑥最新動向を踏まえた生成AI活用方法の定期的な見直し
      - ①機密情報の漏洩
        - ②最適なAIツールの選定・導入
        - ①最適な生成AI活用範囲の設定
        - ③リスクを最小化するデータマネジメント
        - ⑥最新動向を踏まえた生成AI活用方法の定期的な見直し
      - ③著作権・商標権などの権利侵害
        - ②最適なAIツールの選定・導入
        - ③リスクを最小化するデータマネジメント
        - ⑥最新動向を踏まえた生成AI活用方法の定期的な見直し
      - ⑥倫理的に不適切なアウトプットの生成
        - ②最適なAIツールの選定・導入
        - ⑥最新動向を踏まえた生成AI活用方法の定期的な見直し
      - ④ディープフェイク
        - ①最適な生成AI活用範囲の設定
        - ②最適なAIツールの選定・導入
        - ③リスクを最小化するデータマネジメント
        - ④従業員向けの利用ルール・マニュアルの策定
        - ⑤従業員の生成AI活用リテラシーの向上
      - ②プロンプトインジェクション（非公開の指示やBingチャットの開発用コードネームを引き出すことに成功したなど）
        - ②最適なAIツールの選定・導入
        - ①最適な生成AI活用範囲の設定
        - ④従業員向けの利用ルール・マニュアルの策定
        - ⑤従業員の生成AI活用リテラシーの向上
    - ChatGPTによる反論意見と訂正
      - https://chatgpt.com/c/5c593ae7-a1de-4fc6-80f6-475f5a5d9dfd
        - トレーニングデータのバイアス: トレーニングデータに偏りがある場合、AIの出力も偏るリスクがあります。データセットの多様性を確保し、定期的にモデルのパフォーマンスを評価することが重要です。
        - システムの透明性と説明可能性: 生成AIのアルゴリズムがどのように動作しているか、どのようなデータを基に出力が生成されているかを説明できる仕組みを整えることが求められます。
    - ここでの主論点の定義
      - 最適なAIツールの選定・導入
        - 間違ったアウトプットの生成(ハルシネーション)リスクを減らす
        - 機密情報の漏洩を防ぐ
        - 生成AIプラットフォームの選択に向けて
          - 前提: 個人で多くの選択肢を、自力で評価することはできない
            - 仮説: 選択肢を代表的な幾つかのモデルに限定すると選択しやすい？
          　- 仮説: 多くの人が同様の課題感を持つはず。（そのような人たちの）体験談を信じる
          - 前提: そもそもAI・機械学習に関するリテラシーは、基本的な用語の理解に留まっている。少数でも生成AIを自力で評価することなどできない。
          　- 仮説: 多くの人が同様の課題感を持つはず。（そのような人たちの）お墨付きを信じる
      - 最新動向を踏まえた生成AI活用方法を理解する
        - 最適な生成AI活用範囲の設定
        - リスクを最小化するデータマネジメント
      - プロンプトインジェクション対策
        - これについては最新の事例を知る
          - 非公開の指示やBingチャットの開発用コードネームを引き出すことに成功したなど）


```


```
Aurora PostgreSQL DB クラスターを Amazon Bedrock のナレッジベースとして使用


Aurora PostgreSQL DB クラスター作成 

https://docs.aws.amazon.com/ja_jp/AmazonRDS/latest/AuroraUserGuide/AuroraPostgreSQL.VectorDB.html

・Data API を有効化
  サポートされているバージョン
    Data API は、MySQL エンジンを使用するプロビジョンドまたは Aurora Serverless v2 DB クラスターでは使用できません
  サポートされているデータ型（ジオメトリ型や金額型など、一部のデータ型をサポートしていません）
    UnsupportedResultException

・拡張機能pgvectorインストール
  ・バージョン要件
    pgvector 0.5.0以上
      ・HNSW インデックス作成をサポートしているバージョンを使用する
        ・HNSWは、高次元空間における最近傍探索問題を効率的に解決するアルゴリズム https://qiita.com/yo-naka/items/d3cc001ebeffab5442ea
  ・インストールクエリ（マスターユーザーを使用してデータベースにログインして実行）
    CREATE EXTENSION IF NOT EXISTS vector;
    SELECT extversion FROM pg_extension WHERE extname='vector';

・AWS Bedrock用セットアップ
  ・スキーマ作成
    CREATE SCHEMA bedrock_integration;
  ・ロール作成
    CREATE ROLE bedrock_user WITH PASSWORD password LOGIN;
    GRANT ALL ON SCHEMA bedrock_integration to bedrock_user;
  ・テーブル作成
    CREATE TABLE bedrock_integration.bedrock_kb (id uuid PRIMARY KEY, embedding vector(1536), chunks text, metadata json);
    CREATE INDEX on bedrock_integration.bedrock_kb USING hnsw (embedding vector_cosine_ops);
  ・データベースシークレットを作成
    https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_database_secret.html
      Secret type: Amazon RDS database (includes Aurora)
      Secret name
      Description
      Tags
      Resource permissions
      Replicate secret
      Configure rotation
  ・詳細情報を収集
    ・Amazon Aurora DB クラスターの ARN
    ・シークレット ARN
    ・データベース名 (postgres など）
    ・テーブル bedrock_integration.bedrock_kb
        id
        chunks text
        embedding vector(1536)
        metadata json
          - Metadata that related to your knowledge base that Amazon Bedrock manages
          - Metadata that you associate with your source files
            - set up filtering 
            - in other vector stores, you don't have to set up these fields for filtering
2. ナレッジベースを作成
  https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-create.html
    - CreateKnowledgeBase request with a Agents for Amazon Bedrock build-time endpoint
      - provide the 
        - name
        - description
        - instructions for what it should do
        - foundation model for it to orchestrate with.
        - roleArn
          - the ARN with permissions to create a knowledge base
        - knowledgeBaseConfiguration
          - embeddingModelArn
        - storageConfiguration
          - configuration for your vector store
        - rdsConfiguration
          - For an Amazon Aurora database, use the rdsConfiguration object.
        - dataSourceConfiguration
          - Provide the connection information for the data source files in the dataSourceConfiguration field.
        - vectorIngestionConfiguration
          - Specify how to chunk the data sources in the vectorIngestionConfiguration field.
```
