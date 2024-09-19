---
title: '2020 年に Nuxt.js で実装してきたアニメーションをまとめてみた'
description: 'Nuxt.jsで実装してきたアニメーションをまとめました'
categories: ['Tech', 'Nuxt.js']
publishedAt: "2020-12-07"
updatedAt: "2020-12-07"
---

[hey / STORES advent calendar 2020](https://tech.hey.jp/entry/2020/12/01/172331) 7日目の記事です。

2020年の振り返りとして、この記事ではNuxt.jsで実装してきたアニメーションをまとめようと思います。

## 概要

Nuxt.jsでの開発を行おうとすると、Vue.jsのコミュニティが活発だからか、自然と多くのUIライブラリやアニメーションライブラリを見ます。しかし、自分はそれらを使わず、ほとんどのケースで自分で実装していく派です。

理由としては、

  - 要件を満たすものを探し、実際にプロジェクトに入れてみて、要件を満たせるかの検証に時間がかかる。
  - ライブラリが提供しているUIとデザイナーから要求されるUIの調整が難しい。
  - 将来要求される機能追加や変更を叶えられるかがわからない。
  - tree-shakingが未対応であるライブラリの場合、使わない機能のJavaScriptまでimportし、結果プロジェクトのバンドルサイズが増えてしまう。
    - バージョン管理も長期的な運用コストにもなる。
  - Vue.jsの中にアニメーション実装のための `<transition>` タグや `<transition-group>` タグがある。

というのがあります。

2020年では、UI・UX向上のためWEBサイトのデザインリニューアルを担当していました。多くのアニメーション実装が必要でしたが、上の理由から、適宜要件に合うように自分で実装してきました。多くの学びがあったため、振り返りを兼ねて、それらの一部をまとめてみようと思います。Vue.jsの `<transition>` を使ったケースと使わなかったケースがあるので、その観点でグループ化しました。

## 開発環境

開発環境は以下のものになります。

  - Nuxt.js 2.14.7
    - 今回フロントの実装の記事になり、SSRモードで実装する必要はないので、`ssr`オプションは`false`にして、SPAアプリケーションとして開発しています。
    - `components`のオプションは`true`にして、 コンポーネントの自動importが効くようにしました。
  - TypeScript 3.9.7

## 紹介するアニメーションたち

### Vue.jsのtransitionを使って実装したもの

1. スライドメニュー
2. ポップアップ
3. アコーディオン

### Vue.jsのtransitionを使わないで実装したもの

1. モーダル
2. ギャラリー

## Vue.jsのtransitionを使って実装したもの

Vue.jsでアニメーションを実装すると言えば、上であげた `<transition>` タグを使うことがまず思いつくかと思います。自分も多く使ってきたので、実装してきたアニメーションの中で`<transition>` タグを使ったケースをあげたいと思います。

### スライドメニュー

<img width="750" alt="slide-menu.gif" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/152032/f272dc0c-32a3-63bf-3533-448af89b4590.gif" />

まずはスライドメニューです。使い方としては、ヘッダーメニューをスライドで開閉を切り替えるようにし、横からスライドで表示するというのがあります。

実装内容もシンプルで、Vuejsの `<transition>` タグのドキュメンテーションの一番最初にあるサンプルを参考にして実装したものです。サンプルは開くときに右から左にスライドし、閉じるときには左から右にスライドします。

開くときは、`<transition>` タグの中身のdomがレンダリングされるのにフックして、

  - **background**: 初期値で `opacity: 0` で透明から、`transition: opacity 0.15s` で少しずつ背景を黒に変化していきます。
  - **menu**: 初期値が `translateX(10%)` で右に少しずらした位置から、 `transition: all 0.15s ease` で少しずつ、レンダリングが終わったであろう位置までスライドしていきます。

逆に閉じるときは、`<transition>` タグの中身のDOMがなくなることにフックして、

  - **background**: 初期値で `opacity: 0` を設定し、そのまま透明にします。そのままDOMが破棄される最中から破棄されたあとは同じ状態を維持するので、`leave-active`クラスは何も書かなくても大丈夫です。
  - **menu**: 初期値を特に何も設定せず、domが破棄されている最中で`transition: all 0.15s cubic-bezier(1, 0.5, 0.8, 1)` でスライドしていき、消える頃には右に少しずれた位置に`opacity: 0`で透明にされているため、ならめかにスライドメニューが消えるという挙動になっています。

スライドメニューの中のメニューと背景をクリックしたときに、スライドメニューを閉じる処理を忘れないようにしましょう。

```vue [components/molecules/ume-slide-menu.vue]
<template>
  <div class="ume-slide-menu">
    <transition name="background">
      <div v-if="isOpened" class="background" @click="close">
        <div class="close-button">&times;</div>
      </div>
    </transition>

    <transition name="menu">
      <div v-if="isOpened" class="menu">
        <div class="menu-item-wrapper">
          <div class="menu-item" @click="close">
            <span>page1</span>
          </div>

          <div class="menu-item" @click="close">
            <span>page2</span>
          </div>

          <div class="menu-item" @click="close">
            <span>page3</span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  model: {
    prop: 'isOpened',
    event: 'close',
  },

  props: {
    isOpened: {
      type: Boolean,
      required: true,
    },
  },

  methods: {
    close() {
      this.$emit('close')
    },
  },
})
</script>

<style lang="scss" scoped>
.ume-slide-menu {
  .background-enter,
  .background-leave-to {
    opacity: 0;
  }

  .background-enter-active {
    transition: opacity 0.15s;
  }

  .menu-enter,
  .menu-leave-to {
    transform: translateX(10%);
    opacity: 0;
  }

  .menu-enter-active {
    transition: all 0.15s ease;
  }

  .menu-leave-active {
    transition: all 0.15s cubic-bezier(1, 0.5, 0.8, 1);
  }

  .background {
    width: 100%;
    height: 100%;
    position: fixed;
    z-index: 98;
    top: 0;
    right: 0;
    overflow-x: hidden;
    background-color: rgba(0, 0, 0, 0.6);

    .close-button {
      position: absolute;
      top: 0;
      left: 25px;
      font-size: 36px;
      color: #fff;
    }
  }

  .menu {
    height: 100%;
    width: 64%;
    max-width: 320px;
    position: fixed;
    z-index: 99;
    top: 0;
    right: 0;
    background-color: #f3f3f3;
    overflow-x: hidden;

    .menu-item-wrapper {
      background-color: #fff;
      padding-top: 40px;
      padding-bottom: 52px;
    }

    .menu-item {
      display: block;
      cursor: pointer;
      margin: 0 20px;
      padding: 17px 0;
      font-size: 16px;
      font-weight: bold;
      border-bottom: thin solid #c7c7cc;
      color: #4a4a4a;
      text-decoration: none;
      line-height: 1;

      span {
        vertical-align: middle;
      }
    }
  }
}
</style>
```

ここでの注意点では、`ume-slide-menu` の呼び出しを`v-if`などで制御せずに、呼び出しているコンポーネントをマウントしているときには、スライドメニューのコンポーネントもレンダリングされている必要があります。

```vue [pages/index.vue]
<template>
  <div class="index-page">
    <ume-slide-menu v-model="showSlideMenu" />
  </div>
</template>
```

### ポップアップ

![popup.gif](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/152032/21727a0d-bbe4-00f5-b45b-a49a1a72628b.gif)

次は、ポップアップです。ページが表示されたあとにキャンペーンの告知として表示したり、条件によってボタンをクリックをしたにフックして表示します。スライドメニューと同じで、背景をクリックしたときにも、ポップアップを閉じる処理を入れるのを忘れないようにしましょう。

実装も上のスライドメニューとほぼ同じです。Vue.jsの `<transition>`タグを使って、DOMがレンダリングされるときと破棄されるときまでに、どのような挙動になって欲しいかを、`xxx-enter-active` と `xxx-leave-active` のcssクラスに記載するだけで、なめらかにポップアップを表示することができます。

```vue [components/molecules/ume-popup.vue]
<template>
  <div class="ume-popup">
    <transition name="background">
      <div v-if="showPopup" class="background" @click.prevent="$emit('change-popup', false)" />
    </transition>

    <transition name="popup">
      <div v-if="showPopup" class="popup-wrapper">
        <ume-close class="icon icon-close" @click.prevent="$emit('change-popup', false)" />

        <div class="image-wrapper">
          <img src="https://picsum.photos/seed/picsum/400/600" />
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

import UmeClose from '~/assets/fonts/close.svg?inline'

export default Vue.extend({
  components: {
    UmeClose,
  },

  model: {
    prop: 'showPopup',
    event: 'change-popup',
  },

  props: {
    showPopup: {
      type: Boolean,
      required: true,
    },
  },
})
</script>

<style lang="scss" scoped>
.ume-popup {
  .background-enter-active {
    transition: opacity 0.15s;
  }

  .background-enter,
  .background-leave-to {
    opacity: 0;
  }

  .popup-enter-active {
    transition: all 0.25s ease;
  }

  .popup-leave-active {
    transition: all 0.25s cubic-bezier(1, 0.5, 0.8, 1);
  }

  .popup-enter,
  .popup-leave-to {
    opacity: 0;
  }

  .background {
    width: 100%;
    height: 100%;
    position: fixed;
    z-index: 1;
    top: 0;
    right: 0;
    overflow-x: hidden;
    background-color: rgba(35, 24, 21, 0.35);
  }

  .popup-wrapper {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    position: fixed;
    padding: 0.5em 1em;
    z-index: 2;
    display: flex;
    flex-direction: column;

    .icon-close {
      height: 36px;
      fill: black;
      margin: 0 0 10px auto;
    }

    .image-wrapper {
      display: block;
      height: 350px;
      width: 330px;

      img {
        height: 100%;
        width: 100%;
        border-radius: 10px;
      }
    }
  }
}
</style>
```

ここでも、上の`ume-slide-menu`と同じく、呼び出し側のほうで`v-if`で制御せずに、事前にポップアップのコンポーネントもレンダリングされている必要があります。

```vue [pages/index.vue]
<template>
  <div class="index-page">
    <ume-popup v-model="showPopup" />
  </div>
</template>
```

### アコーディオン

<img width="750" alt="accordion.gif" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/152032/9747d6f3-af65-39e7-2486-85c147167e1e.gif" />

狭い限定された枠の中で、メニューをクリックしてコンテンツを開閉したいというケースがあり、その対応でアコーディオンを実装しました。これもOSSのライブラリで要求されるデザインや仕様を満たせるかが不安だったので、自分で実装しました。今回もVue.jsの`<transition>`タグを使っていますが、上2つとは少し違います。

どのように違うかというと、今まではトランジション状態をcssで任せていましたが、**今回はJavaScriptのほうで制御しています。**

コンテンツが開かれたあとのアコーディオンの高さがコンテンツの量に依存し、cssのクラスで言うところの`xxx-enter-to`で指定する高さが動的になることから、cssで静的に決め打ちすることができません。今回はサンプルなので、コンテンツは静的に決まっていますが、実際はAPIのレスポンスに依存するので、高さが動的になっています。

動的な高さをどう与えるかというと、トランジションが終わるとき、つまり`xxx-enter-to` のときに、そのコンテンツのラッパーの `scrollHeight`を渡すようにすれば解決できます。 Vue.jsの`<transition>`タグには、[JavaScriptフック](https://jp.vuejs.org/v2/guide/transitions.html#JavaScript-%E3%83%95%E3%83%83%E3%82%AF)があるので、ここでは`@enter` のフックで、アコーディオンのコンテンツのラッパーの高さを `scrollHeight` と同じにすれば、動的に高さを決めることができます。

ここで注意すべきなのは、アコーディオンを開く前に、一度アコーディオンの高さを`0`にしないとアニメーションが動きません。`0`と決め打ちしないと`height: auto` が割り振られてしまい、`height: auto` から `height: ${height}px` へのケースでは、`transition` が効かなくなってしまいます。逆もしかりで、コンテンツを閉じるときの`height: ${height}px` から `height: auto` へのケースでも、`transition` が効かなくなってしまいます。なので、コンテンツが開かれる前と閉じたあとの`height`は`0`にしましょう。この `0`にするというのも、JavaScriptのフックで実現可能です。(下の例で言うと、`@before-enter` と `@leave`になります。）

```vue [components/atoms/ume-accordion.vue]
<template>
  <div class="ume-accordion">
    <div class="header" @click="$emit('expand')">
      <slot name="header" />

      <down-arrow v-if="expandable" class="icon" :class="{ rotate: expanded }" />
    </div>

    <transition name="accordion" @before-enter="beforeEnter" @enter="enter" @before-leave="beforeLeave" @leave="leave">
      <div v-if="expanded" ref="content" class="content">
        <slot name="content" />
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

import DownArrow from '~/assets/fonts/down-arrow.svg?inline'

export default Vue.extend({
  components: {
    DownArrow,
  },

  model: {
    prop: 'expanded',
    event: 'expand',
  },

  props: {
    expanded: {
      type: Boolean,
      required: true,
    },

    expandable: {
      type: Boolean,
      required: true,
    },
  },

  mounted() {
    if (this.$refs.content) {
      (this.$refs.content as HTMLElement).style.height = `${this.$refs.content.clientHeight}px`
    }
  },

  methods: {
    beforeEnter(el: HTMLElement) {
      el.style.height = '0'
    },

    enter(el: HTMLElement) {
      el.style.height = el.scrollHeight + 'px'
    },

    beforeLeave(el: HTMLElement) {
      el.style.height = el.scrollHeight + 'px'
    },

    leave(el: HTMLElement) {
      el.style.height = '0'
    },
  },
})
</script>

<style lang="scss" scoped>
.ume-accordion {
  border-radius: 6px;
  padding-top: 16px;

  .header {
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    line-height: 1;
    padding-bottom: 16px;
    border-bottom: solid 1px #d1d1d6;

    .icon {
      display: block;
      fill: #c7c7cc;
      height: 14px;
      width: 14px;
      transform: rotate(0deg);
      transition-duration: 0.3s;
    }

    .rotate {
      transform: rotate(180deg);
      transition-duration: 0.3s;
    }
  }

  .content {
    padding: 0 12px;
    overflow: hidden;
    transition: 0.2s ease-out;
  }
}
</style>
```

呼び出し側はこのように書いています。

```vue [pages/accordion.vue]
<template>
  <ume-accordion
    v-for="(group, index) in groups"
    :key="group.id"
    :expanded="accordionExpanded[index]"
    :expandable="group.children.length > 0"
    class="accordion"
    @click-header-arrow="toggleExpandAccordion($event, index)"
  >
    <template v-slot:header>
      <p>{{ group.name }}</p>
    </template>

    <template v-slot:content>
      <ul v-if="group.children.length > 0">
        <li v-for="groupChild in group.children" :key="`${group.id}-${groupChild.id}`">
          <div class="child-img">
            <img :src="groupChild.src" />
          </div>
        </li>
      </ul>
    </template>
  </ume-accordion>
</template>

<script lang="ts">
import Vue from 'vue'

import { ImageGroup } from '~/types/image'

type Data = {
  groups: ImageGroup[]
  accordionExpanded: boolean[]
}

export default Vue.extend({
  data(): Data {
    const groups = [
      {
        id: 1,
        name: 'scenes',
        children: [
          { id: 1015, src: 'https://picsum.photos/id/1015/200/300' },
          { id: 1016, src: 'https://picsum.photos/id/1016/200/300' },
          { id: 1018, src: 'https://picsum.photos/id/1018/200/300' },
          { id: 1019, src: 'https://picsum.photos/id/1019/200/300' },
          { id: 102, src: 'https://picsum.photos/id/102/200/300' },
        ],
      },
      {
        id: 2,
        name: 'scenes',
        children: [
          { id: 244, src: 'https://picsum.photos/id/244/200/300' },
          { id: 237, src: 'https://picsum.photos/id/237/200/300' },
          { id: 200, src: 'https://picsum.photos/id/200/200/300' },
          { id: 219, src: 'https://picsum.photos/id/219/200/300' },
          { id: 169, src: 'https://picsum.photos/id/169/200/300' },
        ],
      },
    ]

    return {
      groups,
      accordionExpanded: [true, ...groups.slice(1, groups.length).map(() => false)],
    }
  },

  computed: {
    accordionClass() {
      return (opened: boolean) => {
        return opened ? 'opened' : ''
      }
    },
  },

  methods: {
    toggleExpandAccordion(expanded: boolean, ingredientCategoryIndex: number) {
      this.accordionExpanded = this.accordionExpanded.map((_) => false)
      this.accordionExpanded[ingredientCategoryIndex] = expanded
    },
  },
})
</script>
```

## Vue.jsのtransitionを使わないで実装したもの

上では、`<transition>`タグを使ったケースを紹介しましたが、逆に使わなかったものもあります。
使わなかった理由としては、個人的にVue.jsの`<transition>`タグは**DOMの表示/非表示の切り替え時のアニメーションには有効ですが、要素の位置や高さを変更させるというアニメーション**はあまり向いていないのかなと思っています。

下の2つのケースだと、要素の表示と非表示はせず、単純に要素の高さを変えるだけだったり、X軸の位置の変更だけで、要件を満たせることができました。どのように実装したかをまとめたいと思います。

### モーダル

<img width="400" alt="expandable-modal.gif" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/152032/354aab9a-a055-670c-56a4-80a85aa2e2a2.gif" />

UI・UXリニューアルに伴い、類似サービスとの差別化を目指して、下から長さを伸ばすことができ、かつz-indexが効かして画面から浮かび上がっているモーダルを用意しようとなりました。上はサンプルですが、実際にはサービス上にある大量のコンテンツから欲しいものだけを絞り込みできるボタンが複数並べられており、それらをクリックすることで、欲しいものを絞り込みできるものとなっています。

アニメーションが入っている部分としては、モーダルの高さ変更のときの`transition`です。モーダルの上の帯の部分をクリックすることで、指定した高さまでモーダルの高さを広げることができます。逆に、広がったモーダルをデフォルトの高さまで縮めることができます。

今回では、要素の高さを調節するだけで要件を満たせるので、上記で書いた通り要素の表示/非表示をするわけではないため、Vue.jsの `<transition>`タグを使いませんでした。

```vue [components/molecules/ume-expandable-bottom-modal.vue]
<template>
  <div ref="modal" class="ume-expandable-bottom-modal">
    <div class="modal-content-title" @click="toggleExpand">
      <p>タイトル</p>

      <up-arrow v-if="!expanded" class="icon icon-arrow-up" />
      <down-arrow v-else class="icon icon-arrow-down" />
    </div>

    <div class="content">
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'

import { ImageGroup } from '~/types/image'

import UpArrow from '~/assets/fonts/up-arrow.svg?inline'
import DownArrow from '~/assets/fonts/down-arrow.svg?inline'

type Data = {
  defaultHeight: number
  transitionSeconds: number
}

export default Vue.extend({
  components: {
    UpArrow,
    DownArrow,
  },

  model: {
    prop: 'expanded',
    event: 'toggleExpand',
  },

  props: {
    expanded: {
      type: Boolean,
      required: true,
    },

    groups: {
      type: Array as PropType<ImageGroup[]>,
      required: true,
    },
  },

  data(): Data {
    return {
      defaultHeight: 48,
      transitionSeconds: 0.5,
    }
  },

  watch: {
    expanded(newValue) {
      if (newValue) {
        return
      }

      (this.$refs.modal as HTMLElement).style.height = `${this.defaultHeight}px`
    },

    transitionSeconds(newValue) {
      (this.$refs.modal as HTMLElement).style.transition = `${newValue}s ease-out`
    },
  },

  mounted() {
    (this.$refs.modal as HTMLElement).style.transition = `${this.transitionSeconds}s ease-out`
  },

  methods: {
    expandUpTo(height: number) {
      (this.$refs.modal as HTMLElement).style.height = `${height}px`
    },

    toggleExpand() {
      this.$emit('toggleExpand', !this.expanded)
    },
  },
})
</script>

<style lang="scss" scoped>
.ume-expandable-bottom-modal {
  width: 100vw;
  height: 48px;
  position: fixed;
  top: auto;
  right: 0;
  left: 0;
  bottom: 0;
  background: white;
  cursor: pointer;
  box-shadow: 0 -9px 10px 0 rgba(0, 0, 0, 0.1);
  border-radius: 8px 8px 0 0;
  z-index: 97;

  .modal-content-title {
    position: relative;
    height: 48px;
    background: 'red';
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 8px 8px 0 0;

    .category-title {
      margin: 6px auto;
      width: 80%;
      text-align: center;
      font-size: 14px;
      font-weight: bold;
      color: #000;
      line-height: 1;
    }

    .icon {
      display: block;
      text-align: left;
      fill: #000;
      position: absolute;
      right: 20px;
      height: 14px;
    }
  }
}
</style>
```

### ギャラリー

<img width="750" alt="gallery.gif" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/152032/b9d7cc27-fa82-51da-a458-4352a9d07329.gif" />

もう1つVue.jsの`<transition>`タグを使わずに実装したアニメーションとして、写真を複数枚並べて、それをスライドさせるギャラリーがあります。使われるシーンとしては、トップページの上部で複数のバナー画像の表示だったり、ランキング表示や1つの商品を紹介する写真を複数する表示するときなどに利用されることが多いかなと思います。

上で書いたように、これも `<transition>`タグを使わずに実装しています。矢印クリックで、要素のリストのラッパーの`translateY`を要素の長さ分、加算したり減算することで、リストの位置をずらす仕組みになっています。リストをラップしているDOMは、指定した長さで固定されているので、実際に目に見えるリストのコンテンツを表示するという考えです。スライドの速度はリストのcssに`transition`を書くことで調整できます。

```vue [component/molecules/ume-gallery.vue]
<template>
  <div class="ume-gallery">
    <div @click="previous">
      <left-arrow :class="`icon icon-arrow-left ${previousclickableClass}`" />
    </div>

    <div ref="slide-list-wrapper" class="slide-list-wrapper">
      <ol ref="slide-list" class="slide-list">
        <li v-for="(slideListElement, index) in slideListElements" :key="index">
          <slot name="slide-list-element" :slide-list-element="slideListElement" />
        </li>
      </ol>
    </div>

    <div @click="following">
      <right-arrow :class="`icon icon-arrow-right ${followingClickableClass}`" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue'

import { Image } from '~/types/image'

import RightArrow from '~/assets/fonts/right-arrow.svg?inline'
import LeftArrow from '~/assets/fonts/left-arrow.svg?inline'

const firstDisplayNum = 4

type Data = {
  transformX: number
  offset: number
  largestDisplayedNum: number
}

export default Vue.extend({
  components: {
    RightArrow,
    LeftArrow,
  },

  props: {
    slideListElements: {
      type: Array as PropType<Image[]>,
      required: true,
    },

    width: {
      type: Number,
      required: true,
    },
  },

  data(): Data {
    return {
      transformX: 0,
      offset: 24,
      largestDisplayedNum: firstDisplayNum,
    }
  },

  computed: {
    previousclickableClass(): string {
      return this.canSlidePrevious ? 'clickable' : 'non-clickable'
    },

    followingClickableClass(): string {
      return this.canSlideFollowing ? 'clickable' : 'non-clickable'
    },

    canSlidePrevious(): boolean {
      return this.largestDisplayedNum > firstDisplayNum
    },

    canSlideFollowing(): boolean {
      return this.largestDisplayedNum < this.slideListElements.length
    },

    slideElementStyle(): { 'min-width': string } {
      return { 'min-width': `${this.width}px` }
    },
  },

  mounted() {
    (this.$refs['slide-list-wrapper'] as HTMLElement).style.width = `${(this.width + this.offset) * firstDisplayNum}px`
  },

  methods: {
    previous(): void {
      if (!this.canSlidePrevious) {
        return
      }

      this.transformX += this.width + this.offset
      (this.$refs.slide as HTMLElement).style.transform = `translate(${this.transformX}px, 0)`
      this.largestDisplayedNum--
    },

    following(): void {
      if (!this.canSlideFollowing) {
        return
      }

      this.transformX -= this.width + this.offset
      (this.$refs.slide as HTMLElement).style.transform = `translate(${this.transformX}px, 0)`
      this.largestDisplayedNum++
    },
  },
})
</script>

<style lang="scss" scoped>
.ume-gallery {
  display: flex;
  justify-content: center;
  align-items: center;

  @media only screen and (max-width: 940px) {
    margin: 0;
  }

  .icon {
    height: 24px;
    width: 28px;
  }

  .clickable {
    fill: #c7c7cc;
  }

  .non-clickable {
    fill: #d1d1d6;
  }

  .slide-list-wrapper {
    overflow: hidden;
    margin: 0 auto;

    .slide-list {
      transition: 0.5s;
      display: flex;
    }
  }
}
</style>
```

## まとめ

ざっと書いてきましたが、2020年にNuxt.jsで実装してきたアニメーションをVue.jsの`<transition>`タグを使ったケースと使わなかったケースでまとめてみました。元々はOSSのライブラリを使うときのコストを下げたい、またデザインや仕様変更に柔軟に対応できるように、自分で実装してきましたが、自分で手を動かして実装した分、多くのことを学んだと思っています。

振り返りをして思ったのは、アニメーションの実装って楽しいと再認識したことです。プログラミングに挑戦したいときっかけにもなった「自分が作ったものが動く」という感動を思い出し、初心に返ることができました。
少しはできることが増えたのかなと思いつつも、まだまだリッチなアニメーションだとスラスラ実装できないレベルです。来年は自分のフロント力をもっと伸ばしていける年になるといいなと思っています。

最後まで読んでいただき、ありがとうございました。
(上で書いたコードは[Githubのレポジトリ](https://github.com/romukey/animation-collection)にまとめました。もし参考になったなどあれば、starしてくれると嬉しいです。)

明日はSTORES 予約の@yksihimotoさんによる、「next.js + Fullcalendar v5を攻略する」です！お楽しみに！
