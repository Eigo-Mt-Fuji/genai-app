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
    - [ ] 検索要件に対するインデックスの設計
    - [ ] 更新要件に対するインデックスの設計
    - [ ] エンティティに対するデータサイズの設計
    - [ ] ライフサイクルの設計
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
- https://platform.openai.com/docs/guides/vision

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
  - 論理設計
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