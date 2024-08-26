---
title: '[Nuxtjs] base64エンコードする画像のファイルサイズの上限を変更する'
description: 'nuxt.config.js のbuildプロパティで、base64エンコードできる画像のファイルサイズの上限を変更できる。'
category: ['tech', 'Nuxt.js']
publishedAt: "2020-01-12"
---

## TL; DR
 - `nuxt.config.js` のbuildプロパティで、base64エンコードできる画像のファイルサイズの上限を変更できる。

## 概要
 - nuxtjsでwebサービスの自社プロダクトの開発と運用をやっているエンジニアです。
 - ある日、ロゴの画像を変更してほしいとデザイナーから依頼が来ましたが、`static`ディレクトリにある画像を差し替え社内開発環境にリリースしまいしたが、ブラウザキャッシュが効いてしまい、昔のロゴが表示されてしまいました。
 - 何かクエリバラメーターをつけるなどして、画像のパスを変更すれば解決するのですが、何か別の解決方法がないかを探したところ、assetsに静的ファイルをおけば、webpackが静的ファイルをbase64エンコードし、htmlやcssに埋め込みをしてくれるみたいでした。が、試したところ、どうやら[base64エンコードしてくれる画像のファイルサイズがデフォルトで1KBと決まっている](https://ja.nuxtjs.org/guide/assets/#webpack)みたいなので、変更したいと思ったのですが、やり方を探しても見つからなかったので、せっかくならと思い、記事にまとめました。

## 実際にどうやるか
結論から話すと、下のように書くと、base64エンコードしてくれる静的ファイルのサイズ上限を変更できました。

```js [nuxt.config.js]
module.exports = {
  extend(config, { loaders }) {
    // これで1MB以下のassetsディレクトリにある静的ファイルがbase64エンコードされます。
    loaders.imgUrl.limit = 100000
  },
}
```

この `loaders` と `imgUrl` がどこから来たからというと、下のドキュメントに記載されていました。
https://ja.nuxtjs.org/api/configuration-build/#loaders

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

全部のコードを追えていないため、 `imgUrl` のプロパティがどう`url-loader` の設定と紐づいているかまではわかっていないのですが、プロパティの名前から予測することができたため、試したところうまくbase64エンコードされました。

ちなみに、base64エンコードされるとhtmlではこのようになります。

<img width="716" alt="スクリーンショット 2020-01-12 17.27.18.png" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/152032/80d2ff6f-38b4-439f-ac25-259fbdd02fd6.png">

## まとめ
 - これで今後画像のパスを無理やり変更しなくても、画像によってエンコードした結果が変わるので、ブラウザキャッシュでファイルの中身が変更されないという問題は回避されるのかなと思いました。内容が少しニッチな気持ちもしますが、同じ問題で困った人の役に立てればと思い、qiitaにまとめました。最後まで読んでいただき、ありがとうございました。
