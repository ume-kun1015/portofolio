---
title: '[Nuxtjs] base64エンコードする画像のファイルサイズの上限を変更する'
description: 'nuxt.config.js のbuildプロパティで、base64エンコードできる画像のファイルサイズの上限を変更できる。'
categories: ['Tech', 'Nuxt.js']
publishedAt: "2020-01-12"
updatedAt: "2020-01-12"
---

## TL; DR

`nuxt.config.js` の build プロパティで、base64 エンコードできる画像のファイルサイズの上限を変更できる。

## 概要

nuxtjs で web サービスの自社プロダクトの開発と運用をやっているエンジニアです。

ある日、ロゴの画像を変更してほしいとデザイナーから依頼があり、`static`ディレクトリにある画像を差し替え社内開発環境にリリースしました。しかし、ブラウザキャッシュが効いてしまい、昔のロゴが表示されてしまいました。

これについて、何かクエリバラメーターをつけるなどして、画像のパスを変更すれば解決します。何か別の解決方法がないかを探したところ、assets に静的ファイルをおけば、webpack が静的ファイルを base64 エンコードし、html や css に埋め込みをしてくれるみたいでした。しかし、試したところ、どうやら[base64エンコードしてくれる画像のファイルサイズがデフォルトで1KB](https://ja.nuxtjs.org/guide/assets/#webpack)と決まっているみたいです。それを変更した変更したかったのですが、やり方を探しても見つからなかったので、せっかくならと思い記事にまとめました。

## 実際にどうやるか

結論から話すと、下のように書くと、base64 エンコードしてくれる静的ファイルのサイズ上限を変更できました。

```js [nuxt.config.js]
module.exports = {
  extend(config, { loaders }) {
    // これで1MB以下のassetsディレクトリにある静的ファイルがbase64エンコードされます。
    loaders.imgUrl.limit = 100000
  },
}
```

この `loaders` と `imgUrl` がどこから来たからというと、下のドキュメントに記載されていました。
<https://ja.nuxtjs.org/api/configuration-build/#loaders>

```js [loaders.js]
// loadersの中身
{
  file: {},
  fontUrl: { limit: 1000 },
  imgUrl: { limit: 1000 }, // デフォルトは1KB
  pugPlain: {},
  vue: {
    transformAssetUrls: {
      video: 'src',
      source: 'src',
      object: 'src',
      embed: 'src'
    }
  },
  css: {},
  cssModules: {
    localIdentName: '[local]_[hash:base64:5]'
  },
  less: {},
  sass: {
    indentedSyntax: true
  },
  scss: {},
  stylus: {},
  vueStyle: {}
}
```

全部のコードを追えていないため、 `imgUrl` のプロパティがどう `url-loader` の設定と紐づいているかまではわかっていないのですが、プロパティの名前から予測ができた。実際試したところ、うまく base64 エンコードされました。

ちなみに、base64 エンコードされると html ではこのようになります。

![結果](/content/increase-filesize-encoded-in-base64/result.png)

## まとめ

  - これで今後画像のパスを無理やり変更しなくても、画像によってエンコードした結果が変わるので、ブラウザキャッシュでファイルの中身が変更されないという問題は回避されるのかなと思いました。内容が少しニッチな気持ちもしますが、同じ問題で困った人の役に立てればと思い、qiita にまとめました。最後まで読んでいただき、ありがとうございました。
