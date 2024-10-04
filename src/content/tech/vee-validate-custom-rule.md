---
title: '[Vue.js (Nuxt.js) ] VeeValidateでカスタムルールを作ってみた'
description: 'VeeValidate のカスタムルールの作り方'
categories: ['Tech', 'Vue.js', 'Nuxt.js', 'VeeValidate', 'JavaScript']
publishedAt: '2020-01-02'
updatedAt: '2020-01-02'
---

## TL;DR

自分が業務で使用している [VeeValidate 3.x](https://vee-validate.logaretm.com) のカスタムルールをまとめました。

## 概要

自分はメディア運営会社のエンジニアとして働いているもので、メディアのコンテンツを入稿するツールを Nuxt.js で開発や運用しています。入稿されるデータに不整合が起きないように、データ作成/更新前のバリデーションには気を使っています。バリデーションライブラリでは、VeeValidate を使用しています。

フィールドが多いデータ関しては、[デフォルトで提供されているvee-validateのルール](https://vee-validate.logaretm.com/v3/guide/rules.html)だけだと対応できなく、色々とカスタムで実装しました。カスタムルールの作り方が見つからなかったので、今後の議事録のためにも、作り方などまとめました。

## 対象者

VeeValidate は使ったことあり、これからカスタムルールをどう実装していく方。

## 技術スタック

  - Nuxt.js 2.x
  - Vuetify 2.x
  - VeeValidate 3.x

## カスタムルールの作り方

ここでは、VeeValidate 3.x をどうやって Nuxt.js で使えるようにすればいいのかは割愛します。

まずは VeeValidate を Nuxt.js で使えるようにするためのプラグインを用意します。

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

そしてカスタムルールを下のように定義します。[Cross Field Validation](https://vee-validate.logaretm.com/v3/advanced/cross-field-validation.html#cross-field-validation) のページを参考にしました。

```js [utils/validation-custom-rules.js]
const customRule = {
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

export { customRule }
```

プロジェクトで実装したカスタムルールの一部を記載。

```js [utils/validation-custom-rules.js]
/**
 * 数字が指定した桁数以下か検証する
 * @param max 最大桁数
 */
const maxDigits = {
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
const collectionMaxLength = {
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

export { maxDigits, collectionMaxLength }
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

指定したバリデーションエラーメッセージが表示されたことを確認。

![結果](/content/vee-validate-custom-rule/result.png)

## まとめ

メディアのコンテンツを入稿するツールを作っていく以上、不適切なデータが入稿され、メディアのブランドや信用性が損なわれるのを防ぐ必要があると思っています。
こうやってカスタムでバリデーションルールを実装できるので、コンテンツを作るユーザーが安心して、良いコンテンツを入稿できるように、日々起こりうるデータの不整合をなくしていきたいです。最後まで読んでいただき、ありがとうございました。
