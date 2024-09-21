---
title: Nuxt 3 x Cloudflare Pages x nuxt/content でブログを作りました
description: Nuxt 3 x Cloudflare Pages x nuxt/content でブログを作りました
categories: ['Tech', 'Nuxt.js', 'Cloudflare', 'Tailwindcss']
draft: true
---

## これ何

Nuxt 3 x Cloudflare Pages x nuxt/content でブログを作りました。
出来上がるまでに大変だったこと。

## なんでブログを作ろうと思ったの

まずはブログ作りまでのモチベーションを書く。

理由については切りがないですが、全部列挙すると.。

  - インプット・アウトプットの場が欲しかった
    - デザイン
    - アクセシリビリティ
    - 個人開発
    - SEO
    - パフォーマンス
    - ssg のアプリケーションを作りたかった
      - SPA・SRR の経験はあるが、SSG だけなかったので、ものすごく興味があった。
        - island architecture あるが、今ある知識の範疇を飛び抜けると、キャッチアップだけで一生を終える気がしたので、割愛...。
    - nuxt の watch は続けていきたい
    - Google Analytics などの分析系
  - アウトプットを 1 つの場所に集めかった。
    - フリーランスになる上で、URL を提出する欲しかった
    - 職務経歴書のも貼れる
      - 職務経歴書にいろいろなブログのリンクを貼る作業があるが、どうせならこのサイト内の回遊にしたい気持ちがある。
    - 自分を知ってもらえる機会になるかなと感じた
  - コメントやいいねがない世界
    - 何のためにアウトプットしているのかと考えたら、他人のためで自分のためで
    - 他人のいいねなどがあると、邪念が生じてしまう。一喜一憂してしまう。
  - 技術以外のトピックでも書きたい
    - ライフステージの変わることが多かったので、
      - 趣味
        - ギター / YouTube
      - 育児
      - 結婚
      - 引越し

気づいたら、こんなに理由が並べられて作るしかないなと思い、作ることにしました。
生活していく上で書きたいことが多くあり。

## 技術選定

Nuxt 3 x cloudflare pages x ssg の勉強がしたかった。

検討した他のライブラリ。

  - astro
  - next

esa でマークダウンを書いて、詰まったところ、意思決定、ドキュメントなどなどマークダウンでこうまとめて書くのがいいなと思った。

nuxt/mdc というパーサーだけでもいいかと思ったが、マークダウンにコンポーネントやデータを付与できることからも nuxt/content を使用するのがいいかと思った。

  - cloudflare pages を選んだ理由
    - 社内でも実績があった。remix のアプリケーションを動かしている
  - nuxt/content を選んだ理由
    - Nuxt Content の Tips などまとめていきたい

まだまだ足りない箇所があるので、少しずつアップデートしていければいい。

  - 記事、食べログ、 X(旧 Twitter) のウィジェットを表示するなど

## 工夫したこと

  - コードブロック
  - table of content
  - surrounded

## 大変だったこと

開発していて以下が大変だったことです。

  - ssg アプリケーションの開発
    - ページのディレクトリ構成
    - prerender するルートの選定
      - rdc parser がすごく便利
      - nuxt/content -> nuxt/mdc -> rdc parser の順番に依存している
      - frontmatter の部分を取得するところができる
      - categories や draft の状態を取得し、適切に prerender のパスを生成できた。

  - nuxt/ui
    - ui のカスタマイズが結局大変だった
    - tailwind css のコードとにわらめっこ

  - scroll spy

  - rehype plugin の外部サイトの挙動。別タブで a タグが開かなかった。

## 参考にした記事

  - <https://zenn.dev/sn10/articles/6228e1a472c094>
  - <https://beyooon.jp/blog/nuxt-ssg-generate-routes-trouble/>
