---
title: '自動生成されるリリースノートと同じものを作る GitHub Actions を構築しました'
description: 'GitHub Actions で GitHub の UI が提供している自動生成のリリースノートと同じものを GitHub Actions を使って生成できるようにした話を書きます。'
category: ['tech', 'GitHub Actions']
publishedAt: "2022-12-12"
---

この記事は [Github Actions Advent Calendar 2022](https://qiita.com/advent-calendar/2022/github-actions) の11日目の記事です。

## 概要？
こんにちは！Flutter でモバイルアプリを開発している offy と申します。今回は運用を担当しているモバイルアプリのプロダクトで、バージョンのタグを新しく切ったときに、GitHub の UI が提供している自動生成のリリースノートと同じものをGitHub Actions を使って生成できるようにした話を書きます。

## モチベーション

みなさんはモバイルアプリのリリースノートをどのように記録していますか？

自分が関わっているプロダクトではリリースノートが特に記録されていませんでした。これにより、各バージョンでどのような変更や機能が含まれているかがわからない問題がありました。あたらしい機能や改善がアプリに積まれる中、それらがどのバージョンで提供されているかをしっかり記録することでプロダクトの振り返りも効率よく行うことができます。また、万が一不具合が発生したとしても、リリースノートを見返すことでバグの早期発見にもつながります。一定のユーザーはバージョンを更新せずに使うため、最新バージョンが使われるとは限りません。運用のお問い合わせで来たアプリのバージョン番号を見て、各バージョンにどんな変更が追加されたかを見ると見ないとでは対応スピードや心理的負荷も大きく変わります。

もちろん、リリースノートがなくともコミュニケーションツールから記録を取れば、過去の修正や変更を特定できますが、一覧できれいにまとめてられているものもほしいとチーム内で声があがりました。それにより、リリースノートをしっかり作成する動きを起こすことにしました。

## 仕様

リリースノートを作成すると言っても考慮することは多くあり、最初ゴールを設定する必要がありました。いつ作成するのか、どんな内容にするのか、誰が作成するか、自動で作成するのか手動で作成するのかなど考える観点はいくつかありました。

あまり工数をかけずにまずはプロトタイプレベルのものでもいいのでリリースノートを作るところから始めました。そこでこちらの画像の「Generate release notes」をクリックして表示されるリリースノートが十分役割を果たしてくれるのではないかとチーム内でゴールが落ち着きました。

新しくリリースするときはいつもタグを切るため、それに合わせてリリースノートがあると便利だと考えて、タグ作成をトリガーにした GitHub Actions を作れないかを考えました。

![](https://storage.googleapis.com/zenn-user-upload/88501a7dc6e2-20221210.png)

## 技術スタック

早速該当する GitHub Actions がないかを調査しました。まずはプロトタイプとなるものを作りたいため、作るまでのコストが大きくなく最低限のことができるものを選びました。

使いやすそうなものが下2つあり採用を検討しましたが、以下の理由でお見送りにしました。
  -  [semantic-release-action](https://github.com/cycjimmy/semantic-release-action)
      - README を見たところオーバースペックすぎるのとどうしても npm パッケージをリリースするために使われるイメージがあった。
  - [release-drafter](https://github.com/apps/release-drafter)
      - PR に label を自動で付与し、それらをリリースノートの中でそれらがわかりやすく分類されるものですが、label を付与するなどをすると普段の開発のコストがあがるのではないかということで、 見送りました。

まずは作って運用に載せることが目的だったので、そこまで多様なユースケースに対応し多機能のものでなくてもよかったのですが、調査したところそこまで見つけることができず、自分で構築することにしました。使用した Actions とそれらをどう使ったかのコードが下になります。

使用した GitHub Actions
 - [release-changelog-builder-action](https://github.com/mikepenz/release-changelog-builder-action)
    - リリースノートに載せるPRたちをまとめてくれる Actions
 - [action-gh-release](https://github.com/softprops/action-gh-release)
    - 渡された文章をもとにリリースノートを作成してくれる Actions

 [release-changelog-builder-action](https://github.com/mikepenz/release-changelog-builder-action) で必要になる設定が下の GitHub Actions の configuration になりますものです。README に詳しい記載がありますが、自分である程度 template を変更できたので、上の Generate Release Notes と同じ結果になるようなものを記載しています。

タグを切ったときのメッセージをリリースノートの冒頭に少しメモとして残しておきたかったので、`template` の最初にタグのメッセージを載せられるようにしました。

```yml [publish-release-note.yml]
name: Publish Release Note

on:
  push:
    tags:
      - "v*"

jobs:
  publish_release:
    timeout-minutes: 5

    runs-on: ubuntu-latest

    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Fetch Tags
        run: git fetch --tags --force

      - name: Get tag message
        id: get_tag_message
        run: |
          echo "::set-output name=message::$(git tag -l --format='%(contents:subject)' ${{ github.ref_name }})"

      - name: Create Changelog
        id: create_changelog
        uses: mikepenz/release-changelog-builder-action@v3
        with:
          configurationJson: |
            {
              # 最初にメモを残したかったので、タグ作成のときのメッセージを含めるように
              "template": "${{ steps.get_tag_message.outputs.message }} \n\n ## What's changed \n #{{UNCATEGORIZED}} \n\n **Full Changelog**: #{{RELEASE_DIFF}}",
              "pr_template": "- #{{TITLE}} by @#{{AUTHOR}} in ##{{NUMBER}}",
              "sort": {
                "order": "DESC",
                "on_property": "mergedAt"
              }
            }
        env:
          GITHUB_TOKEN: ${{ secrets.RELEASE_TOKEN }}

      - name: Release
        uses: softprops/action-gh-release@v1
        with:
          draft: false
          prerelease: false
          token: ${{ secrets.RELEASE_TOKEN }}
          body: ${{ steps.create_changelog.outputs.changelog }}
```

## 実現が難しかったこと
タグを切ると同時に、後で見返したときに一緒に付与したメッセージもリリースノートに入っているいいと考えましたが、実際にやってみるとなぜか付与したメッセージがリリースノートに記載されることがなく、どうしても最新のコミットメッセージが記載されていました。

下の場合でタグを切って push しても、リリースノートに `tag description` との記載がありませんでした。

```bash
$ git tag -a v2.1.3 -m "tag description"
```

調べてみると、タグの情報をしっかり取得する必要があったみたいなので、下の Git コマンドでタグの情報を取得する必要があります。こちらの [Github Action prints Commit Message instead of Tag Message](https://stackoverflow.com/questions/72200924/github-action-prints-commit-message-instead-of-tag-message) の記事を参考にし、無事タグのメッセージをリリースノートに記載することができました

```yaml [.github/workflows/publish-release-note.yaml]
 - name: Fetch Tags
   run: git fetch --tags --force
```

## 実行結果

社外秘なことが多いためぼかしが目立っておりますが、前回のタグからの差分となっている全てのマージされた PR たちが一覧で並べられるようになりました。これで Generate release notes ボタンをクリックして同じリリースノートを自動で作成することができました。設定 JSON の `template` と `pr_template` のキーに渡している通りに作成されたので、左から PR のタイトル、作成者、そして番号と並んでいます。

これでリリースするたびにタグを切りリリースノートが作成されるので、チーム全体でどんな変更が入ったかを確認することができます。

| 1 | 2 |
| --- | --- |
| ![](https://storage.googleapis.com/zenn-user-upload/9f373b41803d-20221210.png)|![](https://storage.googleapis.com/zenn-user-upload/276e27705059-20221210.png)|

## 終わりに
いかがだったでどうでしょうか？この GitHub Actions を導入したあとで、どのバージョンにどんな差分が発生したかを把握できるようになり、振り返りや運用からのお問合せの対応も前より効率行うことができました。

本当は新機能やパッケージアップデート、テストコード追加、 lint やフォーマッターのルール変更によるPRをカテゴライズし、見やすさを上げていければいいですが、一旦チーム内ではこれをしばらく運用していこうとなりました。見やすくした工夫や改善などはこれから少しずつおこなっていき、次回それらをまとめらればと思います。

長くなりましたが、ご精読ありがとうございました！

