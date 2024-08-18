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

## 備考

- [Langchainコンセプト学習](https://github.com/Eigo-Mt-Fuji/portfolio-2024/blob/main/docs/%E7%94%9F%E6%88%90AI/2024%E5%B9%B48%E6%9C%8812%E6%97%A5_Langchain%E3%82%B3%E3%83%B3%E3%82%BB%E3%83%95%E3%82%9A%E3%83%88%E5%AD%A6%E7%BF%92.md)
- [Plan](https://github.com/Eigo-Mt-Fuji/portfolio-2024/blob/main/docs/%E7%94%9F%E6%88%90AI/2024%E5%B9%B48%E6%9C%886%E6%97%A5_1%E6%97%A5%E3%81%A6%E3%82%99%E3%81%A6%E3%82%99%E3%81%8D%E3%82%8B%E3%80%81%E3%81%82%E3%82%8A%E3%82%82%E3%81%AE%E3%81%A6%E3%82%99%E3%81%8A%E9%85%92%E3%82%92%E6%8F%90%E6%A1%88%E3%81%99%E3%82%8B%E7%94%9F%E6%88%90AI%20x%20RAG%E3%82%A2%E3%83%95%E3%82%9A%E3%83%AA%E3%82%B1%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3%E8%A8%AD.md)
- 
https://platform.openai.com/docs/guides/vision
