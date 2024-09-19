---
title: '[Vuejs(Nuxtjs)]  vee-validateでカスタムルールを作ってみた'
description: 'vee-validate のカスタムルールの作り方'
categories: ['Tech', 'Vue.js', 'Nuxt.js', 'VeeValidate', 'JavaScript']
publishedAt: '2020-01-02'
updatedAt: '2020-01-02'
---

## TL;DR
  - 自分が業務で使用している[vee-validate 3.x](https://logaretm.github.io/vee-validate)のカスタムルールをまとめました。

## 概要
  - 自分はメディア運営会社のエンジニアとして働いているもので、メディアのコンテンツを入稿するツールをnuxtjsで開発や運用しています。入稿されるデータに不整合が起きないように、データ作成/更新前のバリデーションには気を使っています。バリデーションライブラリでは、vee-validateを使用しています。
  - 属性が多いモデルに関しては、様々な条件に柔軟に対応しないといけないのですが、**[デフォルトで提供されているvee-validateのルール](https://logaretm.github.io/vee-validate/guide/rules.html#rules)**だけだと対応できないな...と思い、色々と自分でカスタムで実装しました。が、そもそもそんなにカスタムルールの作り方が見つからなかったと思ったので、作り方などまとめました。

## 対象者
  - vee-validate は使ったことあり、これからカスタムルールをどう実装していく方。

## 技術スタック
  - nuxtjs 2.x
  - vuetify 2.x
  - vee-validate 3.x

## カスタムルールの作り方

ここでは、vee-validate3.x をどうやって Nuxt.js で使えるようにすればいいのかは詳細には書きません。

まずは、`vee-validate` を `Nuxt.js` で使えるようにするためのプラグインを用意します。

`nuxt.config.js` の `plugins` プロパティで読み込みます。

```js [plugin/vee-validate.js]
// vee-validateからルールを拡張できる関数をインポート
import { extend } from 'vee-validate'

// vee-validateがデフォルトで用意してくれているルールをインポート
import * as Rules from 'vee-validate/dist/rules'

// 自分が実装したvee-validateのカスタムルールをインポート
import * as CustomRules from '~/utils/validation-custom-rules.js'

for (const rule in Rules) {
  extend(rule, Rules[rule])
}

for (const rule in CustomRules) {
  extend(rule, CustomRules[rule])
}
```

そしてカスタムルールを下のように定義します。下のページを参考しました。
<https://logaretm.github.io/vee-validate/advanced/rules-object-expression.html#cross-field-validation>

```js [utils/validation-custom-rules.js]
const custom_rule = {
  // ルールを書くときに使う引数。
  params: ['compare'],

  // バリデーションロジック
  validate(field, { compare }) {
    return true // or false true: バリデーションエラーなし, false: バリデーションエラーあり
  },

  // バリデーションエラーメッセージ
  message(field, { compare }){
    return `validation error. ${field}`
  },
}

export { custom_rule }
```

プロジェクトで実装したカスタムルールの一部を記載。

```js [utils/validation-custom-rules.js]
/**
 * 数字が指定した桁数以下か検証する
 * @param max 最大桁数
 */
const max_digits = {
  params: ['max'],

  validate(value, { max }) {
    return value ? String(value).length <= max : true
  },

  message(field, { max }) {
    return `${field}は${max}桁以下でなければなりません`
  },
}

/**
 * コレクションの要素数が指定していた数以下かを検証する
 * @param maxLength 最大要素数
 */
const collection_max_length = {
  params: ['maxLength'],

  validate(value, { maxLength }) {
    if (!Array.isArray(value)) {
      return false
    }

    return value.length <= maxLength
  },

  message(field, { maxLength }) {
    return `${field}は${maxLength}つまでしか選択することができません。`
  },
}

export { max_digits, collection_max_length }
```

## 実際にどう使うか

実際にコンポーネントでどうカスタムルールを使うかを記載します。

```vue [validation-usage.vue]
<template>
  <v-row justify="center">
    <v-col cols="12">
      <!-- rulesを文字列で渡す場合 -->
      <validation-provider v-slot="{ errors }" name="記事ID" rules="numeric|max_digits:7">
        <v-text-field v-model="articleId" :error-messages="errors" label="記事ID" counter="7" type="number" />
      </validation-provider>
    </v-col>

    <v-col cols="12">
      <!-- オブジェクトを渡すこともできます。 -->
      <validation-provider v-slot="{ errors }" name="色" :rules="{ collection_max_length: { maxLength: 3 } }">
        <v-select v-model="selectedColors" multiple chips :items="colors" :error-messages="errors" />
      </validation-provider>
    </v-col>
  </v-row>
</template>

<script>
export default {
  data() {
    return {
      articleId: 0,

      selectedColors: [],
      colors: ['red', 'blue', 'yellow', 'green', 'purple'].map((color) => ({ value: color, text: color })),
    }
  },
}
</script>
```

自分が指定したバリデーションエラーメッセージが表示されたことを確認。

![結果](/content/vee-validate-custom-rule/result.png)

## まとめ
  - メディアのコンテンツを入稿するツールを作っていく以上、不適切なデータが入稿され、メディアのブランドや信用性が損なわれるのを防ぐ必要があると思っています。こうやって、カスタムでバリデーションルールを実装できるので、コンテンツを作るユーザーが安心して、良いコンテンツを入稿できるように、日々起こりうるデータの不整合をなくしていければと思います。最後まで読んでいただき、ありがとうございました。
