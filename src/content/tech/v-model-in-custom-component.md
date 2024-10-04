---
title: '[Vue.js] カスタムコンポーネントで v-model を使えるのを知って幸せになれた話'
description: 'カスタムコンポーネントで v-model を使えるまでのやり方をまとめました'
categories: ['Tech', 'Vue.js', 'JavaScript']
publishedAt: '2020-01-26'
updatedAt: '2020-01-26'
---

## TL;DR

 1. 自分が実装したカスタム(子)コンポーネントに `v-model` を書き、データの双方向データバイディングができる。
 2. 基本的にはデフォルトでは、そのカスタム(子)コンポーネントで、 `value` のキーの props でデータを受け取る。`input`のイベント名で変更したいデータを `emit`すれば、親のほうで `v-model`で渡しているデータが更新される。
 3. そのカスタム(子)コンポーネントで、props のキーだったり、イベント名を変更したい場合は、`model` プロパティに変更したいデータのプロパティと変更したいときの使うカスタムイベント名を定義する。

## はじめに

メディア運営会社のエンジニアです。メディアコンテンツの入稿ツール(以下: ダッシュボード)を Vue.js(Nuxt.js) で開発しているとき、子コンポーネントを使用するときに、双方向データバイディングについて悩むことがありました。
いい方法をググっていたところ、自分が実装したカスタムコンポーネントでも `v-model` を使えることを知り開発が楽になったので、学んだことをここに書きます。

学ぶ前と学んだ後でどれだけコードが変わるのかの before / after も書きます。UI フレームワークは vuetify を使用しています。

## そもそも v-model って何について

はじめに [v-model](https://jp.vuejs.org/v2/guide/forms.html) についておさらいすると、双方向データバインディングとして紹介されています。具体的な使用例としては、メールアドレスやチェックボックスなどにあるフォームが多いです。下だと input で書いた内容がそのまま `email` に反映されます。

公式のドキュメントによると、`v-model` は `value` プロパティを通して、`input` や `textarea`、`select` 要素にデータを渡します。一方でそれぞれの要素が発行する `input` や `change` イベントを通して `value` の props 渡したデータを更新しているというものです。

### 参考

  - [コンポーネントでv-modelを使う](https://jp.vuejs.org/v2/guide/components.html#%E3%82%B3%E3%83%B3%E3%83%9D%E3%83%BC%E3%83%8D%E3%83%B3%E3%83%88%E3%81%A7-v-model-%E3%82%92%E4%BD%BF%E3%81%86)

### コード

```vue [v-model-to-input.vue]
<template>
  <div class="example-form">
    <!-- 下2つは同じこと -->
    <input v-model="email" type="text" />
    <input :value="email" @input="email = $event.target.value" type="text">

    <p> {{ email }} <p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      email: '',
    }
  },
}
</script>
```

さらに、公式の[v-model を使ったコンポーネントのカスタマイズ](https://jp.vuejs.org/v2/guide/components-custom-events.html#v-model-%E3%82%92%E4%BD%BF%E3%81%A3%E3%81%9F%E3%82%B3%E3%83%B3%E3%83%9D%E3%83%BC%E3%83%8D%E3%83%B3%E3%83%88%E3%81%AE%E3%82%AB%E3%82%B9%E3%82%BF%E3%83%9E%E3%82%A4%E3%82%BA)を読むと、**デフォルトでは `v-model` は `value` をプロパティとして、`input` をイベントして使います** とあります。

言い換えると、`input` や `textarea` 要素も 1 つのコンポーネントと、`value` プロパティでデータをもらったり、`input` イベント経由でもらったデータを仮定します。どんなコンポーネントでも同じこと、つまり `value` の `props` でデータをもらい、 `input` イベントでもらったデータを更新すると、 `v-model` が使えます。

下の例だと `custom-input` は、更新するデータを `value` で受け取り、データの更新時に `input` イベントを発行すれば、呼び出し側で `v-model` を使用できます。

```vue [custom-input-wrapper.vue]
<custom-input v-model="searchText" />
```

```vue [customer-input.vue]
<template>
  <input
    :value="value"
    @input="$emit('input', $event.target.value)"
  >
</template>

<script>
export default {
  name: 'custom-input',
  props: ['value'],
}
</script>
```

でも、`v-model` を使用するのに、別のプロパティだったり、違うイベント名を使いたいケースが考えられます。
そんなときは、[v-model を使ったコンポーネントのカスタマイズ](https://jp.vuejs.org/v2/guide/components-custom-events.html#v-model-%E3%82%92%E4%BD%BF%E3%81%A3%E3%81%9F%E3%82%B3%E3%83%B3%E3%83%9D%E3%83%BC%E3%83%8D%E3%83%B3%E3%83%88%E3%81%AE%E3%82%AB%E3%82%B9%E3%82%BF%E3%83%9E%E3%82%A4%E3%82%BA)にあるように、`model` プロパティを使用すれば大丈夫です。

下の例だと、デフォルトの `value` の代わりに `checked` が使用され、`input` の代わりに `change` が使用されています。

```vue [base-checkbox-wrapper.vue]
<base-checkbox v-model="lovingVue"></base-checkbox>
```

```vue [base-checkbox.vue]
<template>
  <input
    type="checkbox"
    :checked="checked"
    @change="$emit('change', $event.target.checked)"
  >
</template>

<script>
export default {
  model: {
    prop: 'checked',
    event: 'change'
  },

  props: {
    checked: Boolean,
  },
}
</script>
```

色々と書きましたが、実務でどう役に立ったかを書いていきます。

## 実装するカスタムコンポーネント

下のダイヤログになります。

| 1 | 2 |
| -- | -- |
| ![1](/content/v-model-in-custom-component/1.png)| ![2](/content/v-model-in-custom-component/2.png) |

## Before

```vue [components/molecules/r-custom-dialog.vue]
<template>
  <v-dialog :value="_dialog" max-width="500" @click:outside="closeDialog">
    <v-card>
      <v-card-title class="headline grey lighten-2 text-center" primary-title>
        v-model
      </v-card-title>

      <v-card-actions>
        <v-btn color="accent" text @click="closeDialog">閉じる</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    dialog: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    _dialog: {
      get() {
        return this.dialog
      },

      set(val) {
        this.$emit('close:dialog')
      },
    },
  },

  methods: {
    closeDialog() {
      this._dialog = false
    },
  },
}
</script>
```

```vue [pages/model-examples/index.vue]
<template>
  <v-container fill-height>
    <v-layout align-center>
      <v-flex class="text-center">
        <r-custom-dialog :dialog="dialog" @close:dialog="closeDialog()" />

        <v-btn color="primary" @click="openDialog">CLICK ME</v-btn>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import RCustomDialog from '~/components/page-organisms/articles/r-custom-dialog.vue'

export default {
  components: {
    RCustomDialog,
  },

  data() {
    return {
      dialog: false,
    }
  },

  methods: {
    openDialog() {
      this.dialog = true
    },

    closeDialog() {
      this.dialog = false
    },
  },
}
</script>
```

Vue.js では親から props でもらったデータを子コンポーネント内で変更したときにエラーが出てきます。
エラーを回避するために、子コンポーネントの `computed` 内で `props` に代わるプロパティを用意し、その代用されたプロパティに対して変更を加えています。そして、そのプロパティの内容が変更されたときに、カスタムイベントを発火するようにしています。

改善したいなと感じたのが、親が子に渡したデータを変更していることと子のほうで代用のプロパティを用意していることです。
親と子でデータを無理やり同期しているように感じるのと、子のほうでわざわざ getter と setter を用意するのは手間がかかるなと思いました。

そんな中、カスタムコンポーネントで `v-model` が使えるとわかり、コードを書き換えると...。

## After

```vue [components/molecules/r-custom-dialog.vue]
<template>
  <v-dialog :value="dialog" max-width="500" @click:outside="closeDialog">
    <v-card>
      <v-card-actions>
        <v-btn color="accent" text @click="closeDialog">
          閉じる
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  model: {
    prop: 'dialog',
    event: 'change-dialog',
  },

  props: {
    dialog: {
      type: Boolean,
      default: false,
    },
  },

  methods: {
    closeDialog() {
      this.$emit('change-dialog', false)
    },
  },
}

/* デフォルトだとこう書く。
export default {
  props: {
    value: {
      type: Boolean,
      required: true,
    },
  },

  methods: {
    closeDialog() {
      this.$emit('input', false)
    },
  },
}
*/
</script>
```

```vue [pages/model-examples/index.vue]
<template>
  <div class="model-examples-index">
     <r-custom-dialog v-model="dialog" />

     <v-btn @click="openDialog()" />
  </div>
</template>

<script>
import RCustomDialog from '~/components/page-organisms/articles/r-custom-dialog.vue'

export default {
  data() {
    return {
      dialog: false,
    }
  },

  methods: {
    openDialog() {
      this.dialog = true
    },
  },
}

</script>
```

まさにこんなのが欲しかったなと思いました。無理やり感も薄れ、双方向データバイディングができて、親は子がデータに変更が加わったことを気にせず、ただただ変更が加わったデータを扱えばよくなりました。子のほうで、余分な `computed` も用意しなくてもいいのですっきりしました。

ポイントを以下にまとめると、

 1. `model` プロパティに親から渡されるデータの名前を　`prop`　に、変更が加わるときのイベント名を `change-dialog` にする。
 2. しっかりと **`model` プロパティの `prop` に指定するデータ** が `props`の中で定義されていること。

## まとめ

カスタムコンポーネントで`v-model` が書ける話をまとめました。これを知ってからは、無駄な`computed`の getter や setter を書かなくても大丈夫ですし、親と子でしっかり双方向データバインディングができているので、すっきり書けました。よかったら、いいねしていただけると嬉しいです。
