---
title: '[Nuxt.js] 外部モジュールで定義した関数を template で効率よく使えるようにする'
description: '外部モジュールで定義した関数を直接 template で使用することはできないので、computed に登録することで使えるようにできる。'
categories: ['Tech', 'Vue.js', 'Nuxt.js', 'JavaScript']
publishedAt: "2020-01-06"
updatedAt: "2020-01-06"
---

## TL;DR

外部モジュールで定義した関数を直接 template で使用できないため、computed に登録することで使えるようにできる。

## WHY

Nuxt.js でメディアコンテンツ入稿ツール(以下: ダッシュボードツール)を開発しています。
ページやコンポーネントの JavaScript のコードが肥大化しないように、使用する関数を外部モジュールに定義しました。それをインポートしようとし、直接 template 内で使用したところ、下のエラーが発生し困っていました。

```text
Property or method "helperFunc" is not defined on the instance but referenced during render.
Make sure to declare reactive data properties in the data option.
```

解決したのですが、ググったところ簡単に解決策が出てこなったので、せっかくなら記事にまとめようと思いました。

## 技術スタック

  - Nuxt.js 2.x
  - Vuetify 2.x

## 具体的なケース

上の WHY に書いた、エラーコードがこちらです。
あるモデルの属性をラジオボタンで決めてもらおうと思い、下のようにファイルを用意しました。

```js [~/helpers/index.js]
export default {
  contentTypeRadios() {
    return [
      { label: 'デフォルト', value: 0 },
      { label: 'オプション付き', value: 1 },
    ]
  },
}
```

```vue [pages/examples/index.vue]
<template>
  <v-radio-group v-model="contentType" :column="false" label="コンテンツ種別">
    <v-radio
      v-for="(contentTypeRadio, i) in helpers.contentTypeRadios"
      :key="i"
      :label="contentTypeRadio.label"
      :value="contentTypeRadio.value"
      class="mx-2"
    />
  </v-radio-group>
</template>

<script>
import helpers from '~/helpers/index.js'

export default {
  data() {
    return {
      contentType: 0,
    }
  },
}
</script>
```

おそらく`template` で使う関数自体を script タグの中に登録していないからですが、下のように登録するのも冗長だし、mixins に定義するほどのものではないしと思い、色々と調べてみました。

```vue [pages/index.vue]
<template>
  <v-container>
    <v-layout>
      <v-radio-group v-model="contentType" :column="false" label="コンテンツ種別">
        <v-radio
          v-for="(contentTypeRadio, i) in contentTypeRadios"
          :key="i"
          :label="contentTypeRadio.label"
          :value="contentTypeRadio.value"
          class="mx-2"
       />
      </v-radio-group>
    <v-layout>
  <v-container>
</template>

<script>
import helpers from '~/helpers/index.js'

export default {
  data() {
    return {
      contentType: 0,
    }
  },

  computed: {
    contentTypeRadios() {
      return helpers.contentTypeRadios
    },
  },
}
</script>
```

## After

解決策としては、computed に登録するだけでした。ポイントは export するときに関数で返すことです。

```js [~/helpers/index.js]
const contentTypeRadios = () => {
  return [
    { label: 'デフォルト', value: 0 },
    { label: 'オプション付き', value: 1 },
  ]
}

export { contentTypeRadios }
```

```vue [radio-group.vue]
<template>
  <v-radio-group v-model="contentType" :column="false" label="コンテンツ種別">
    <v-radio
      v-for="(contentTypeRadio, i) in contentTypeRadios"
      :key="i"
      :label="contentTypeRadio.label"
      :value="contentTypeRadio.value"
      class="mx-2"
    />
  </v-radio-group>
</template>

<script>
import { contentTypeRadios } from '~/helpers/index.js'

export default {
  data() {
    return {
      contentType: 0,
    }
  },

  computed: {
    contentTypeRadios,
  },
}
</script>
```

ちなみに引数が必要な場合は、下のように書きます。

```js [~/helpers/index.js]
const contentTypeRadios = () => {
  return (obj = null) => {
    const radios = [
      { label: 'デフォルト', value: 0 },
      { label: 'オプション付き', value: 1 },
    ]

    if (obj && obj.type) {
      radios.push({ label: 'プレミアム', value: 2 })
    }

    return radios
  }
}

export { contentTypeRadios }
```

```vue [pages/examples/index.vue]
<template>
  <v-container>
    <v-layout>
      <v-radio-group v-model="contentType" :column="false" label="コンテンツ種別">
        <v-radio
          v-for="(contentTypeRadio, i) in contentTypeRadios(premiumType)"
          :key="i"
          :label="contentTypeRadio.label"
          :value="contentTypeRadio.value"
          class="mx-2"
       />
      </v-radio-group>
    <v-layout>
  <v-container>
</template>

<script>
import helpers from '~/helpers/index.js'

export default {
  data() {
    return {
      contentType: 0,
      premiumType: { type: 'premium' },
    }
  },

  computed: {
    contentTypeRadios,
  },
}
</script>
```

## まとめ

いかかだったでしょうか。これで無理やり computed に登録しなくてもよくなり、記述量が減りました。これからも積極的に使っていきます。最後までお読みくださりありがとうございました。
