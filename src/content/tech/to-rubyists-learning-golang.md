---
title: 'これから Go 言語を学ぶ Rubyist たちへ'
description: 'Rubyist に向けた Go 言語の入門 Tips です'
categories: ['Tech', 'Go']
publishedAt: '2018-03-23'
updatedAt: '2018-03-23'
---

## 背景

今まで Ruby で開発していた Rubyist がサーバーサイドを Golang で実装している会社に転職して、数週間が経ち今までの Golang 開発で学んだことをまとめました。これから Golang 開発をする Rubyist たちが、自分と同じようにつまずく可能性がある、または Golang を本格的に書き始める前に知っておきたかったと感じるところをまとめております。最近 Ruby 開発を進めている会社でも、必要な箇所で Go 開発を行なっていると聞いたので、興味がある Rubyist が大勢いるじゃないかと思い、転職をきっかけに記事を書かせていただきました。Go 開発やってみたい、「会社で導入することになった」という Rubyist たちの最初のステップになれば幸いです。Ruby はこうだけど、Golang だとこういう風に書くよと比較のコードも混ぜています。

## 対象

Ruby を書いたことがあり Golang を書いたことがないけど、これから Golang 開発始めよう、または興味がある人。

## インストール法

`goenv` をおすすめします。go の `rbenv` と思ってもらって大丈夫です。

バージョンの切り替えも簡単にできます。`local` と `global` のオプションもあるので、プロジェクトごとやデフォルトでもバージョン設定も可能です。`rehash` と入力すると、 `.ruby-version` と同じく`.go-version` というファイルもできます。プロジェクトでなんのバージョンが使用されているのかチーム内で共有できます。

```bash
$ git clone https://github.com/dataich/goenv.git ~/.goenv

# ログインシェルの設定ファイルに
export PATH="$HOME/.goenv/bin:$PATH"
eval "$(goenv init -)"

$ goenv install 1.7 # お好みのバージョン
$ goenv global 1.7
```

## 基本的な文法

型に関しては、ここでは省略します。

1. Ruby は、**スネークケース** ですが、Go では変数と関数は **キャメルケース** が使われる。
2. Go では、public にしたいプロパティ/関数を大文字を使う。private にしたいプロパティ/関数は小文字にし、違うパッケージからのアクセスできません。
3. Go では、Ruby のような破壊的メソッドを書くときは、構造体(Ruby でいうとクラス)のポインタをレシーバーにしないといけません。
    - Ruby にはポインタの値渡しがないので、Go を勉強すると最初にここでつまづく可能性がある。
4. `iota` は、型なしの整数の連番を生成する。
    - 他の言語にはない文法なので、紹介すると、通常は int を元にした定数型を作って型同士の区別ができるようにする。
5. Go では、定数は `const` で宣言する。
6. Go では、構造体のインスタンスを作る方法がいくつかある。
    - `new` を使うと **空のポインタ型の構造体**のインスタンスが作成される。
    - `構造体名{プロパティ: 値}`で **空の構造体**が作成される。

```go [user.go]
package main

import "fmt"

// 定数
const (
    NonPremium = iota
    Premium
)

type User struct {
    firstName     string
    PremiumStatus int
}

// インスタンスメソッド　（レシーバー名 関数名(引数) 返り値
//　　構造体の中身を変更させるものなので、レシーバーをポインタ型にしないといけない。
func (u *User) UpdateToPremium() {
    u.PremiumStatus = Premium
}

func main() {
    user := &User{FirstName: "hoge", PremiumStatus: 0}
    // これだと、ポインタ型の空の構造体を作る。FirstNameとPremiumStatusには、空文字と0が入る。
    // user := new(User)
    user.UpdateToPremium()
    fmt.Println(user) // &{hoge 1}
    fmt.Println(user.firstName) // hoge
}

```

これでも動きますが、通常は iota をそのまま int として使わずに型を作ってあげます。

```go [user.go]
type PremiumStatus int

// 定数
// NonPremiumとPremiumはPremiumStatus型になるので
// int変数には保存できなくなる
const (
    NonPremium PremiumStatus = iota
    Premium
)

type User struct {
    firstName     string
    PremiumStatus PremiumStatus
}

func main() {
    user := &User{FirstName: "hoge", PremiumStatus: NonPremium}
}
```

```ruby [user.rb]
class User
  # 定数
  NON_PREMIUM = 0
  PREMIUM = 1

  def initialize(first_name, premium_status)
    @first_name = first_name
    @premium_status = premium_status
  end

  private
  # 破壊的メソッド
  def update_to_premium!
    @premium_status = PREMIUM
  end
end

user = User.new('hoge', NON_PREMIUM)
user.update_to_premium!
```

## その他の文法

### 1. 可変長変数

  - 便利なので、Golang での書き方を共有

```go [splat_operator.go]
package main

import "fmt"

func main(){
  SplatOperator("a", "b", "c")
}

func SplatOperator(args ...string){
  fmt.Println(args) // => [a b c]
}
```

```ruby [splat_operator.rb]
def splat_operator(*args)
  p args
end

splat_operator('a', 'b', 'c') # => [a b c]
```

## 自分がつまずいたエラー集

### 1. Golangでは、ダブルクオテーションとバッククオートで表現する

Golang ではダブルクオテーションとバッククオートを使いますが意味が違います。自分が Ruby を書くとき、文字列の中で変数を展開するとき以外は、シングルクオテーションを使いますが、その癖でビルドしてみるとエラーの嵐が表示されます。バッククオートはエスケープシーケンスを解釈しないかつ、改行はそのままテキスト中でも改行になるため、ヒアドキュメント（複数行対応可）です。式展開はどちらもないです。

```go [sample.go]
package main

import "fmt"

func main(){
  fmt.Println('hoge') // これはエラー
}
```

### 2. ポインタ型のスライスからは、要素を取得することができない

2 週間でここに一番詰まりました。Golang には、ポインタの概念があり、最初 Rubyist がつまずくのかなと思っています。Golang には、「スライス型」という可変長配列があります。配列もありますが、それは要素数などが決められています。実際に業務で書く時には、要素が固定で決められることはあまり少ないため、このスライス型がよく使われます。

実際につまづいたエラーは下のものになります。

```bash
# command-line-arguments
./sample.go:7:18: invalid operation: fuga[0] (type *[]int64 does not support indexing)
```

```go [sample.go]
package main

import "fmt"

func main(){
  hoge := []int64{2, 3, 4} // => スライス型を定義
  fuga := &hoge // => わざとポインタ型にしています。
  fmt.Println(fuga[0]) // => invalid operation: fuga[0] (type *[]int64 does not support indexing)
}
```

エラー文にあるように、ポインタ型のスライスはインデックスをサポートしていない = 使えないよということです。なので、ポインタ型から値型に戻さないといけません。

```go [sample.go]
package main

import "fmt"

func main(){
  hoge := []int64{2, 3, 4}
  fuga := &hoge // => わざとポインタ型にしています。
  fmt.Println(*fuga[0]) // => 2 ポインタから値に戻しています。
}
```

### 3. インスタンスメソッド内のレシーバーの名前は、`this`や`self`じゃだめ

> receiver name should be a reflection of its identity; don't user generic name as such or this

これはエラーではなく、golint で注意された warning です。下のような User 構造体を作り、インスタンスメソッドを生やして、自身のオブジェクトへのアクセスするときに、Ruby だと `self` を書くことが多いのではないでしょうか。

```ruby [user.rb]
class User < ApplicationRecord
  def name_with_prefix
    "Mr. #{self.name}"
  end
end
```

Go では、レシーバーの名前は、[構造体の最初の文字にする](https://github.com/golang/go/wiki/CodeReviewComments#receiver-names)というルールがあるので、それに従いましょう。

```go [user.go]
package model

type User struct{
    Name   string
    Gender int64
}

func (s *Student) NameWithPrefix() string {
    return "Mr. " + s.Name
}

// これはwarning
// func (self *Student) NameWithPrefix() string {
//   return "Mr." + self.Name  ここはwarning
// }
```

### 4. 構造体のインスタンスを作成する方法はいくらでもある

Ruby だとクラスのインスタンスを作る方法は、 下のように `new` するのが一般的です。

```ruby [sample.rb]
class Sample
  attr_reader :title

  def initialize(title)
    @title = title
  end
end

sample = Sample.new('sample')
p sample.title
```

しかし、Golang では、下の構造体の場合、下の方法だけ空の構造体を取得するやり方があります。Rubyist に気をつけてほしいのが、 `new` は**ポインタ型の構造体** を返すことです。

Ruby では　`new`　でインスタンス取得できます。しかし、ポインタの概念がないので、Go で　`new`　とするとポインタ型ではない空の構造体が取得できると思われがちですが、**ポインタ型**　なので注意が必要です。

```go [vehicle.go]
type Vehicle struct{
  Name string
}
```

```go [main.go]
package main

func main(){
  // 同じ意味 空の構造体を返す
  var v Vehicle = Vehicle{}
  vehicle := Vehicle{}

　　　　//　同じ意味 Golangでの`new`は、 ポインタ型を返すので注意
  vehicle := new(Vehicle)
  vehicle := &Vehicle{}
}
```

### 5. Map初期化

ここでいう Map は、Ruby でいうハッシュです。注意してほしいのは、Map は[宣言に加えて、一度初期化を行わない](http://otiai10.hatenablog.com/entry/2014/08/09/154256)といけないことです。Ruby だと初期化する必要は全くない & Map 型だけ初期化が必要になってくるので、ここでまとめておきました。

> panic: runtime error: assignment to entry in nil map

```go [sample.go]
package main

import "fmt"

func main() {
    var m map[string]string
    fmt.Println(m) // map[]

    /* panic: runtime error: assignment to entry in nil map
        m["hoge"] = "fuga"
        fmt.Println(m)
    */

    // 初期化すればOK
    m = map[string]string{}
    fmt.Println(m) // map[]

    m["hoge"] = "fuga"
    fmt.Println(m) // map[hoge:fuga]
}
```

## まとめ

たった数週間ですが、まとめてみると多くのところに詰まったと思っています。時間ができたときは、さらに自分が詰まったところを残していきます。これから Golang デビューする Rubyist の参考になれば幸いです。
