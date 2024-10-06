---
title: CI を CircleCI から GitHub Actions へ移行しました
description: 普段運用しているプロダクトの CI を CircleCI から GitHub Actions へ移行させました。
categories: ['Tech', 'GitHub Actions']
publishedAt: '2023-10-12'
updatedAt: '2023-10-12'
---

## はじめに

こんにちは、 都内のベンチャーでフロントエンドエンジニアをしているものです。今回はフロントプロダクトで使う CI を CircleCI から GitHub Actions を移行したので、学んだことなどを振り返りながら記事にまとめていきます。

## 目的

まずそもそもどうして CI を移行しようかというと、きっかけとして今年のはじめに起こった CircleCI の[セキュリティインシデント](https://circleci.com/blog/jan-4-2023-incident-report/)があります。これにより、 CircleCI の環境変数に入れている AWS のクレデンシャルがすでに抜き取られていることを危惧して、クレデンシャルを再生成するなどをして対策しました。セキュリティインシデントを受けて、今後の CircleCI を使用し続けることに対して不安を覚えました。

これを機に、CircleCI から GitHub Actions に切り替えることを検討するようになりました。理由としては以下の 3 つです。

  - 全社的に GitHub Actions の利用が増えており、そろえることで関わることのできる人を増やしたい。自分が所属しているリテール開発部門の中でも CI が CircleCI と GitHub Actions の両方で混在していました。
  - 技術スタックをシンプルにして認知負荷や学習コストを下げたい。シンプルに管理するプロダクトを減らしていきたい。
  - GitHub Actions のトリガー機能が豊富に用意されており、それをうまく活用したい。コードのコミットプッシュ以外にも Pull Request (以下: PR) 作成のタイミング、`workflow_dispatch` や `scheduled_dispatch` などがある。多彩な機能が提供されているのも魅力でした。

## 移行してどうだったか

### 提供されている Actions がとても便利

オープンソースの Actions がとにかく豊富で、何かと痒いところに手が届くものばかり用意されています。例えば、node をワークフローの中で使えるようにするアクションでは、 `actions/setup-node` が有名です。node のバージョンを変更するときに、CI で使用しているバージョンの変更が漏れてしまったことはないでしょうか。それを防ぐために、このアクションでは node-version-file というオプションがあり、パスを指定して、`.node-version` か `.nvmrc` からバージョンを取得できます。 これにより `.node-version` の変更だけで、 node のバージョンの変更を追従できます。

今回の移行のきっかけとなったクレデンシャル漏洩についても、AWS のほうから提供されている `aws-actions/configure-aws-credentials` を使い、解決できました。

AWS が GitHub Actions での OpenID Connect 認証を提供しているので、最終的に IAM Role からクレデンシャルをロードし、 AWS CLI を使用できます。これにより、クレデンシャルを GitHub Actions の Secrets に保管する必要はなく、今後仮に不正アクセスがあったとしても、クレデンシャルを抜き取られる心配はありません。ワークフロー内の記述もかんたんで下の数行で済みます。

```diff [workflow.yml]
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v2
  with:
    role-to-assume: ${role}
    aws-region: ap-northeast-1
このとき作成する IAM ロールのカスタム信頼ポリシー の設定で Condition のキーに渡す値でブランチ名を指定するのを忘れずにしましょう。ブランチを意識する必要がないなら、ワイルドカードを記述しましょう。

  {
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
-       "token.actions.githubusercontent.com:sub": "repo:<GitHubユーザー名>/<GitHubリポジトリ名>:ref:refs/heads/<ブランチ名>"
      },
+     "StringLike": {
+       "token.actions.githubusercontent.com:sub": "repo:<GitHubユーザー名>/<GitHubリポジトリ名>:*"
+     }
   }
}
```

### やはりコミットプッシュ以外イベントがトリガーになるのは便利

CircleCI だとジョブを実行するトリガーがリポジトリへのコミットプッシュのみですが、GitHub Actions だと GitHub 上で起こりうるほとんどのイベントがトリガーになります。例えば、PR のレビューの Approve や Change Requested イベントがトリガーになるので、これにフックさせて構築するとレビューラベル変更なども行えます。

このワークフローを動かすには GitHub 上で何かイベントを発生させる必要がありますが、特にイベントなしでワークフロー自体を動せる `workflow_dispatch` の機能がとても便利です。こちらを使用したときの該当イベントは「`workflow_dispatch` を起動させた」になります。

今まで CircleCI だとクラウド環境にコードをデプロイしたいときは、空の PR を作成するプッシュイベントを発生し、デプロイジョブを実行させていました。しかし、`workflow_dispatch` を使えるようになったため、任意のタイミングで GUI からデプロイを行えます。`workflow_dispatch` 自体がとても便利でセレクトボックスで選択した値や input を設けて、入力された値をジョブの中で簡単に参照できるので、動的な値を外から渡すのに手間がかかりません。

下の例は、デプロイしたいステージング環境を選択し、反映させたいブランチを入力して、デプロイを実行するワークフローの `workflow_dispatch` の例です。

```yaml [workflow_dispatch.yml]
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        description: 'デプロイ先の環境を選択してください'
        required: true
        options:
          - net
          - com
          - org
          - info
      branch:
        description: 'デプロイ対象ブランチ'
        required: true
        default: 'master'
```

### ワークフロー実行の条件を詳細に決められる

トリガー単体だけではなくその中で詳細に条件を決めて、ジョブを実行するかしないかを決められます。特定のファイルのみに対して変更が入ったときのみに実行したり、特定のブランチに対して PR が作成されたときにジョブを実行できます。

例えば、lint やユニットテスト実行のジョブを `.js` / `.ts` / `.vue` の拡張子のファイルのみをコミットプッシュしたときのみに実行できます。リポジトリ内の yml やシェルスクリプトの変更については lint とテストは実行されないので、実行時間が減りお金の節約にも貢献できます。

```yml [push.yml]
on:
  push:
    paths:
      - '**.js'
      - '**.ts'
      - '**.vue'
      - '**.json'
```

### GITHUB_TOKEN を使用するとき権限に注意すべし

GITHUB_TOKEN とは GitHub の API へアクセスするために使用されるトークンであり、ユーザーがリポジトリやリソースに対して操作するのに使われます。

操作するのに GITHUB_TOKEN を使用する以外の手段として、Personal Access Token（以下 PAT）を使うケースがあります。
しかし、発行するコストを下げるためにもどうしてもトークンの有効期限を無制限にする傾向が高くなり、セキュリティの観点からするとあまり推奨されることではありません。なにより筆者の個人プロジェクトでもあとで見返すと何のために発行した PAT なのかがわからなくなる場面が多いぐらい、PAT 自体の管理が大変です。そもそも PAT はその名の通り、Personal であるため 1 つの GitHub アカウントに紐付いた発行されます。そのため、チームみんなが使う開発共通のアカウントを作成する必要がありますが、アカウントの運用について一定考えることが増えてしまいます。これらの問題に対して、GITHUB_TOKEN を使用することでそのペインをなくすこともできます。 PAT を作るアカウントの運用もなくなります。

担当するプロダクトでの GITHUB_TOKEN の使用例で言うと 2 つあります。その 1 つは、PR を作成し該当ブランチのコードがステージングに反映されたときその旨を伝えるコメントを PR にコメントします。少し話が脱線すると、もう 1 つが STORES では全社共通のデザインシステムがあり、それに沿った UI コンポーネントライブラリのインストールです。リテール部門のプロダクトもそれに倣っており、lint やテスト、デプロイジョブを行う前にそのコンポーネントライブラリをインストールする必要があります。この社内ライブラリは GitHub Registery を利用して npm に公開されているため、GITHUB_TOKEN を使ってインストールが可能です。

冒頭に書いた CI 移行の目的として、全社として使っている CI サービスを共通化したい、がありました。GitHub が提供しているサービスに移行することによって連携がやりやすくなったので、CircleCI から GitHub Actions へ置き換えることへの利点の 1 つになりました。

```yml [permissions.yml]
permissions:
  pakcages: read
```

ただセクションのタイトルにあるように、GITHUB_TOKEN を使う上で注意していただきたいのが、 `permissions` で指定していないキー以外の値は null になり権限を失うことです。例えば、自分が直面したものだと、一番上の AWS の OIDC 認証を使うのに当たって、`id-token` と `contents` のキーを付与しました。しかし、それが原因で、PR 作成がトリガーになって実行するデプロイジョブ終了通知がその旨を伝えるコメントが該当の PR につかなくなってしまいました。これは GITHUB_TOKEN に付与されている PR へのデフォルトの権限がなくなってしまったためです。それにより、`pull-requests` のキーに対して、 write という値を渡して、無事に PR にデプロイ完了のコメントがつきました。

```yml [permissions.yml]
permissions:
  id-token: write
  contents: read
  pull-requests: write
```

このことはしっかりドキュメントに書かれているので、GITHUB_TOKEN を使用しているところで動かない箇所があったら権限を確認しましょう。

> You can use the permissions key in your workflow file to modify permissions for the GITHUB_TOKEN for an entire workflow or for individual jobs. This allows you to configure the minimum required permissions for a workflow or job. When the permissions key is used, all unspecified permissions are set to no access, with the exception of the metadata scope, which always gets read access.

引用: [Permissions for the GITHUB_TOKEN](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token)

### ファイル構成などは開発者たちに委ねられる

GitHub Actions は 1 つのファイルだけを編集する CircleCI と違って `.github/workflows` のディレクトリの中に yml ファイルを好きな数だけ用意できます。ワークフローを起動させるトリガーが一気に増えたことに比例すると同時に、できることも多くなり自由度が増しました。これにより、ファイル構成を考えたり、共通している処理を 1 つにまとめるなどをしないと簡単にメンテナンスできない困難な状況が生まれてしまいます。ファイル名を発生するイベントの名前にするのもありだし、具体的に行う事柄にするのも可能なので、運用のやりやすさについては開発者の技量に委ねられます。

工夫できることとしては、共通する処理をまとめるには Composite という機能が提供されています。同じような step を書いてしまうので、Composite を使って 1 つのファイルに共通処理を書いて再利用できます。

```yml [.github/workflows/composite.yml]
name: 'setup'

description: 'setup'

outputs:
  node-modules-cache-hit:
    description: 'node modules cache hit result'
    value: ${{ steps.node_modules_cache_id.outputs.cache-hit }}

runs:
  using: 'composite'
  steps:
    - name: setup node
      uses: actions/setup-node@v3
      with:
        node-version-file: '.node-version'

    - name: restore node modules cache
      uses: actions/cache@v3
      id: node_modules_cache_id
      with:
        path: './node_modules'
        key: ${{ runner.os }}-${{ hashFiles('./yarn.lock') }}
```

1 つのファイルに書かなくてもいいことから各 `yml` ファイルの肥大化を抑えられます。共通化できる箇所がないかなどを探して、常にメンテナンスできる記述を目指していきましょう。

## 所感

いかがだったでしょうか。自分はイベント駆動分野が好きでフロントエンドをやっていますが、CI 自体が何かにフックして実行されるイベント駆動の技術そのものなので、興味があることからも今回移行を担当しました。OIDC にそってクレデンシャルの漏洩を防ぐこと、使う CI のサービスを揃えられたこと、 GitHub のサービスの恩恵を預かれることと多くのメリットを感じられた。移行したことによるコストパフォーマンス良いと判断できた移行でした。

システムを組み立てている感覚を覚えられるので自動化やイベント駆動の仕組みは興味ある分野なので、このまま世の中にどんな CI があるかなどを調べたくなった今日頃ごろです。
