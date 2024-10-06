---
title: Cloudflare Workers を使って社内で趣味を楽しんでいる話
description: Cloudflare Wokers を使って、社内 Slack チャンネルに東海オンエアの動画を投稿して、趣味を楽しんでいる話です。
categories: ['Tech', 'Cloudflare', 'TypeScript', '東海オンエア']
publishedAt: '2022-10-03'
updatedAt: '2022-10-03'
---

これは [STORES Advent Calendar 2022](https://product.st.inc/entry/adventcalendar2022) の 3 日目の記事になります。

## 概要

<!-- textlint-disable -->
やあ、どーも！ フロントエンドエンジニアをやっている offich です！

Cloudflare Workers の中で YouTube API と Slack Webhook の API にリクエストを送り、人気 YouTuber グループ「[東海オンエア](https://www.youtube.com/user/TokaiOnAir)」の YouTube 動画を社内の Slack チャンネルに投稿し、社内で趣味活動している話をまとめました。
<!-- textlint-enable -->

## 背景

<!-- textlint-disable -->
みなさん、冒頭で書いた「やあ、どーも！」の掛け声でご存じのグループをご存知でしょうか。そう、大人気 YouTuber グループの
愛知県岡崎市在住<!-- textlint-enable -->の「[東海オンエア](https://www.youtube.com/user/TokaiOnAir)」です。チャンネル登録者数は 2022 年 11 月現在 670 万人で、今まで投稿した動画は 1800 本以上となり、総再生回数は 100 億を超えています。今年の 6 月グループのリーダーがずっと高校生から推しだった某元人気アイドルグループのメンバーとご結婚されました。自分はコロナ禍でおうち時間が増えるようになってから大ファンとなり、毎日投稿されている動画を見ては楽しんでいます。

![東海オンエア](/content/having-fun-with-cloudflare-worker/tokai-onair.png)

STORES では Slack をコミュニケーションツールに使っています。趣味や雑談などの `fun-` から始まるチャンネルが多くあります。例えば、`fun-nintendo-siwtch` や `fun-alcohol` などの娯楽についてや、`fun-frontend` や `fun-go` など技術について話すチャンネルが多くあります。そんな中、`fun-tokaionair` という Slack チャンネルができ、社内の何人かと東海オンエアについて話す機会ができました。元々自分は東海オンエア好きの知り合いや友達がほしいと思っており、せっかくならもっと話す機会が増えるように何かしらのきっかけが欲しいと考えていました。

そんな中、同時期に社内で Cloudflare の技術検証がされていたのと、オープンソースになった Cloudflare の技術的なキャッチアップも含めて触る機会が欲しいと感じていました。今回 YouTube Data API からその日に投稿された東海オンエアの動画を `fun-tokaionair` の Slack チャンネルに送る投稿 bot を作ることにしました。

![会話ログ](/content/having-fun-with-cloudflare-worker/conversation.png)

## 仕様

東海オンエアは月以外毎日夜 9 時に動画を投稿しています。それに沿って、毎日夜 9 時に Cloudflare Workers を Cron Trigger で実行することにしました。 東海オンエアの YouTube チャンネルの最新の動画の URL を取得し、Slack の `#fun-tokaionair` チャンネルに投稿します。

具体的には、東海オンエアの YouTube チャンネルで動画を投稿日時の降順に並べ替えて、一番最初の動画を取得するようにしました。

### 技術スタック

使用した技術については主に下記になります。

  - [Cloudflare Workers](https://developers.cloudflare.com/workers/)
  - [TypeScript](https://www.typescriptlang.org/docs/handbook/intro.html)
  - [YouTube API](https://developers.google.com/youtube/v3/getting-started?hl=ja)
  - [Slack Incoming Webhook](https://slack.com/intl/ja-jp/help/articles/115005265063-Slack-%E3%81%A7%E3%81%AE-Incoming-Webhook-%E3%81%AE%E5%88%A9%E7%94%A8)

Cloudflare Workers の詳細については多くの記事が説明されているためここでは割愛しますが、エッジサーバーでスクリプトを実行してくれるサーバーレスのサービスです。JavaScript（V8 エンジン）を実行が可能なので、普段の開発で使い慣れている TypeScript を使うことにしました。

### ディレクトリ構成

前提として、複数の動画サービスから動画を引っ張ることを想定しています。構成については、少し冗長ではありますが、Clean Architecture に寄せており、ユースケースとデータソースのレイヤーを分けている構成にしています。動画サービスや動画の URL を投稿する場所を変更するとなったとしても、データソースレイヤーのインタフェースを守ることで、特にビジネスロジックがデータの都合を意識することないようにしました。これによりデータが変わったことによるハンドリングが少なくなり、データソースの変更に対応しやすくなります。

```text
➜  tokaiflare git:(develop) tree -a -I "\.git|.github|node_modules"
.
├── .eslintrc.js
├── .gitignore
├── .node-version
├── .npmrc
├── .prettierrc
├── package-lock.json
├── package.json
├── src
│   ├── constants
│   │   ├── id.ts
│   │   └── index.ts
│   ├── domains
│   │   ├── dto
│   │   │   ├── index.ts
│   │   │   └── youtube
│   │   │       ├── index.ts
│   │   │       └── video.ts
│   │   └── models
│   │       ├── index.ts
│   │       └── video.ts
│   ├── entrypoint.ts
│   ├── handlers
│   │   ├── index.ts
│   │   └── scheduled.ts
│   ├── infra
│   │   ├── index.ts
│   │   └── youtube
│   │       ├── index.ts
│   │       └── video.ts
│   ├── repositories
│   │   └── video.ts
│   ├── usecase
│   │   ├── index.ts
│   │   └── video.ts
│   └── types
│       ├── env.ts
│       └── index.ts
├── tsconfig.json
└── wrangler.toml

12 directories, 27 files
```

ビジネスロジックが入っている Usecase クラスでは、受け取るデータソースのクラスを入れ替えるだけ違う動画サービスから動画の詳細を取得できます。
TypeScript の言語仕様に interface が用意されています。Usecase のコンストラクタで渡す interface を守るメソッド群が定義されているクラスインスタンスを渡せば複数の動画サービスから動画を取得できます。またユニットテストを導入した際、データレイヤーにアクセスする必要があるビジネスロジックのテストで、モックのしやすさも意識してデータの繋ぎ込みの部分はユースケースクラスから独立して書いています。

```typescript [src/handlers/scheduled.ts]
import { VideoUsecase } from '~/src/usecases'
import { MessageUsecase } from '~/src/usecases'
import { Youtube } from '../infra'
import { Slack } from '../infra'
import { tokaiOnAirChannelId } from '~/src/constants'
import { Env } from '~/src/types'

export const scheduledHandler = async (env: Env): Promise<void> => {
  const video = await new VideoUsecase(new Youtube(env.YOUTUBE_API_KEY)).getLatestVideoOnChannel(tokaiOnAirChannelId)

  // 仮に Tiktok から東海オンエアの動画を取得したい場合
  // const video = await new VideoUsecase(new Tiktok()).getLatestVideoOnChannel(tokaiOnAirChannelId)

  await new MessageUsecase(new Slack(env.YOUTUBE_API_KEY)).post(tokaiOnAirChannelId)
}
```

こちらが動画を取得するときに満たすべきインタフェースです。

```typescript [src/repositories/video.ts]
import { Video } from '~/src/domains/models'

export interface VideoRepository {
  getVideosOnChannel(channelId: string): Promise<Video[]>
}
```

```typescript [src/domains/models/video.ts]
export type Video = {
  id: string
  title: string
}
```

YouTube 動画検索クエリなど、動画サービス特有のものについてはその関連のファイルに閉じ込めることができます。呼び出し側のビジネスロジックは動画をどう取得するかを意識することなく、責務を分けることができています。呼び出し側がデータソースによって返り値のハンドリングが発生しないように、共通の返り値の方を使うこともポイントです。

```typescript [src/infra/youtube/video.ts]
import { Video } from '~/src/domains/models'
import { convertToModel, VideoSearchResponse } from '~/src/domains/dto'
import { VideoRepository } from '~/src/repositories'

const endpoint = 'https://www.googleapis.com/youtube/v3/search'

export class Youtube implements VideoRepository {
  apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getVideosOnChannel(channelId: string): Promise<Video[]> {
    const options = {
      method: 'GET',
    }

    const params = new URLSearchParams({
      key: this.apiKey,
      channelId,
      order: 'date',
      part: 'snippet,id',
      maxResults: '5',
    })

    const response = await fetch(`${endpoint}?${params.toString()}`, options)
    const jsoned: VideoSearchResponse = await response.json()

    // ここで Youtube API のレスポンスを interface 共通で定義されている共通にビデオの形に変換する
    return jsoned.items.map((item) => convertToModel(item))
  }
}
```

```typescript [src/domains/dto/youtube/video.ts]
import { Video } from '~/src/domains/models'

export const convertToModel = (dto: VideoResponse): Video => {
  return {
    id: dto.id.videoId,
    title: dto.snippet.title,
  }
}

export type VideoSearchResponse = {
  kind: 'youtube#searchListResponse'
  items: VideoResponse[]
}

type VideoResponse = {
  kind: 'youtube#video'
  etag: string
  id: {
    kind: 'youtube#video';
    videoId: string
  }
  snippet: {
    title: string
  }
}
```

### Scheduled の Cloudflare Workers での開発

Cloudflare Workers で Cron Triggers を使ってのバッチ処理を実装します。指定した時刻で実行されたときの場合をローカルで確認したいときは、ドキュメントに書かれてある方法が参考になります。 Scheduled Event のドキュメントに記載がある通り、wrangler dev コマンドのオプションが用意されています。

```bash
$ wrangler dev --test-scheduled
$ curl "http://localhost:8787/__scheduled?cron=0,12"
```

あとは、`wrangler.toml` ファイルに main フィールドで渡したファイル名に scheduled の関数を定義してあげれば完成です。

```text
name = "tokaiflare"
usage_model = 'bundled'
compatibility_flags = []
workers_dev = true
compatibility_date = "2022-09-29"
main = "src/endpoint.ts"
```

```typescript [src/endpoint.ts]
import { scheduledHandler } from './handlers'
import { Env } from './types'

export default {
  async scheduled(event: ScheduledEvent, env: Env, context: EventContext<Env, string, Date>): Promise<void> {
    context.waitUntil(scheduledHandler(env))
  },
}
```

### 実際どうなったか

実際 Scheduled の処理が実行され、毎晩 9 時に slack 投稿に成功しています。投稿された動画について、チャンネルの中で感想を言いあっています。

これをきっかけに少しずつこのチャンネルの中の人たちで仲良くなり、自然と東海オンエアの各メンバーが開くイベントの情報や各メンバーの動画の面白シーンを共有し合っています。こうした情報旧友がきっかけで、カモン岡崎という岡崎市の観光イベントが開催されるため、オフ会もかねて一度来年東海オンエアの活動地の愛知県岡崎市へ観光に行こうという計画を立てています。

## これから取り組みたいこと

### 1. 複数の YouTube チャンネルから動画を取得する

今回メインチャンネルの東海オンエアチャンネルだけ動画を取得していないですが、他にも東海オンエア関連の YouTube チャンネルが多くあります。

例えば、`東海オンエアの控室`というサブチャンネルもあります。他にも、東海オンエアは一人一人が実力派 YouTuber で各個人で YouTube チャンネルを持っています。カフェ経営や地元の友達と馴れ合いを投稿している`ブラーボりょうのボンサバドゥチャンネル`、`ラジオチャンネルの 虫眼鏡の放送部`、`料理チャンネルのゆめまる美術館`など多くのチャンネルがあります。

東海オンエアはコアなファンが多いため、切り抜きチャンネルも多くあります。面白いシーンだけ切り取ったものやメンバーのニッチな癖だけをまとめたもので `東海ランキング【公認】` 、`lily` と最後に東海リストさんのチャンネル集があります。

このように多くの関連チャンネルがあるため、メインチャンネルのない月曜日に関連チャンネルの動画をランダムで投稿する予定です。

### 2. 複数の動画サービスから動画を取得する

東海オンエアは YouYuber グループですが、その人気から多くのファンが Instagram や Tiktok にも動画を切り抜き動画を投稿しています。

少し調査してみると、Instagram の Media API と TikTok for developers のドキュメントが用意されております。今回 YouTube だけから動画の情報を取得しましたが、せっかく Clean Architecture よりの構成にしたので、その恩恵を受けられるように別の動画サービスからも動画を取得したいです。

### 3. 動画投稿されたときのイベントをリッスンすることができないか

そもそも毎晩 9 時に Slack 投稿するようにバッチ処理を組みましたが、本来なら動画が投稿されたイベントを購読して Slack 投稿できてないかと考えています。東海オンエアのメンバーは動画撮影だけではなく、編集やネタ会議、動画の準備を経て動画投稿しています。多忙に過ごしていることから、21 時に動画を投稿できないときが多くあり、夜 9 時に投稿されていないときは前日の動画の URL が Slack チャンネルに投稿されてしまう問題が発生しています。

根本的な問題解決としては、動画投稿のイベントにリッスンできるような Webhook があれば、渡すコールバックで動画情報取得し、Slack 投稿できます。そのように行える仕組みを検討したいです。

## まとめ

いかがだったしょうか。今回は社内で趣味の東海オンエア動画鑑賞を楽しんでいる話をまとめました。東海オンエアも今年の 10 月で 9 周年を終え、現在 10 周年目です。1 人のファンとしても、上記のやりたいことを通して、まだまだ `fun-tokaionair` の slack チャンネルを盛り上げたいと考えています。

また Cloudflare でも Cloudflare workers 以外でもさまざまなサービスがあります。例えば Cloudflare Pages で Nuxt、または Next のプロジェクトを簡単にデプロイできます。このまま Cloudflare の勉強として、最近リリースされた Nuxt 3 で何かブログを作りたいとも思いました。

長くなりましたが、ここまでのご精読ありがとうございました。
