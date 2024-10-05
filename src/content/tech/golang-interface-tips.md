---
title: '【Golang】 Golang の interfaceで知っておくとお得なTips'
description: 'Golang の interface について学んだことをまとめました'
categories: ['Tech', 'Go']
publishedAt: '2018-05-20'
updatedAt: '2018-05-20'
---

## 概要

去年の 8 月で社会人エンジニアになり、今年の 2 月まで API サーバーの開発を Ruby on Rails で行なっていた新卒 Rubyist です。
3 月にサーバーサイドをすべて Go で行う会社に転職しました。今まで Rails での業務が多かったため、`interface` という概念がどうしても身につきませんでしたが、ある程度業務に慣れ、戦い続けて学んだことをまとめようと思いました。今年はアウトプットを大事にしていきたいという目標もあって、記事を書きます。

## 下に読む前に

Go のインタフェースは **型の１つ** です。`string` や `int64` が関数を持っているように、インタフェースで型を宣言してその型に関数を持たせることができます。**構造体がインタフェースで宣言されている`GetRadius`関数**を持つと、この構造体の型は `Circle` になります。

```go [interface1.go]
type(
     Circle interface{
          GetRadius() int64
     }

     CircleImpl struct{}
)

// NewCircle が `GetRaidus`関数を持っているため、型は`Circle`になる。
func NewCircle() *CircleImpl {
     return &CircleImpl
}

func (*CircleImpl) GetRadius() int64{
     return int64(1)
}
```

`interface` の概念を業務で使わない Rubyist にとっては上の点を理解するのとしないのとでは、大きな差があったため、記事の一番上に書かせていただきました。上のことを踏まえると、`interface` の理解度が深まります。

## 学んだこと

### 1. どんな型でも受け入れてくれるなんでも屋さん

Go の `interface` ではどんな型でも受け取れることができます。

```go [interface1.go]
package main

func main() {
  intValue := int64(10)
  strValue := "go interface"
  PrintAnyType(intValue) // => 10
  PrintAnyType(strValue) // => "go interface"

  var interface1 interface{} = "interface1"
  fmt.Println(interface1) // => interface1
  interface1 = uint8(2)
  fmt.Println(interface1) // => 2
}

// PrintAnyType print any type of variable.
// 引数の型がinterface{}であるために、どんな型の変数でもPrintAnyType関数は受け入れてくれる。
func PrintAnyType(variable interface{}){
  fmt.Println(variable)
}
```

なんでこれを書こうと思ったかというと、今まで動的言語での API サーバーの開発が多かったです。型が存在する言語で JSON を返すときの処理ってどうなっているかを見たところ、気になって会社のコードを調べて、下のコードを見つけたのがきっかけでした。
下のようにマップのキーは `string` だけど、 値は `interface` になっているので、値の型をすべて１つの型に揃える必要がなく、JSON を作ることができるのかと納得しました。ちなみに、会社では、echo のフレームワークを使っています。

```go [interface2.go]
func JSONHTTPSuccessHandler(data interface{}, c echo.Context) error {
    return c.JSON(http.StatusOK, data)
}
```

### 2. 構造体が interface の型を持つと、元々あった型の情報や構造体のメソッドやフィールドがなくなってしまう

上の 1 みたいに、`interface` 型で宣言されている変数に値を代入して、型に沿った通りの動きをしてくれると期待したところ、下のコードを書いたときに、コンパイルが通りません。なぜコンパイルが通らないかというと、`strSliceInterface` は　**`Join` 関数の引数として渡されるときに型が `interface` となっている**　からです。そのため、`strings.Join` が期待している `[]string{}` とはならず、コンパイルエラーが発生してしまいます。

```go [interface3.go]
package main

import (
    "fmt"
    "strings"
)

func main() {
    var strSliceInterface interface{}
    strSliceInterface = []string{"hoge", "fuga"}
    fmt.Println(strings.Join(strSliceInterface, ", "))
    // => cannot use strSliceInterface (type interface {}) as type []string in argument to strings.Join: need type assertion
    // => エラー文が言っているように、strSliceInterfaceの型は`interface{}`となっているため、期待している型が渡されていない。
}
```

`interface` がなんでも屋さんであるため、ただ代入するときはコンパイルが通りますが、実際に使用するとなったときは、型が　`interface`　になるので気をつけましょう。

### 3. `interface` に代入してしまい、下の型の情報を失った/ない変数を元の型に戻す方法

2.のように、変数に代入するときは `interface` を使ってしまったけれど、代入する前の型を取り戻したいというときには、**`変数.(型)`** と書くことで型の情報を取り戻すことができます。上の `interface4.go` に、 `strSlice := strSliceInterface.([]string)` と加えることで `strSlice` に `[]string`の型を渡せます。これを `Type Assertion` と言います。型変換が上手くいったかどうかをしっかり調べるために、`ok(bool)` が `true` になっているかをしっかり確認しましょう。

```go [interface4.go]
package main

import (
    "fmt"
    "strings"
)

func main() {
    var strSliceInterface interface{}
    strSliceInterface = []string{"hoge", "fuga"}
    strSlice, ok := strSliceInterface.([]string) // => stringのスライスに戻している。
    fmt.Println(ok) // => true ここが falseのときは、type assertionは失敗している。
    if ok {
        fmt.Println("type assertion succeeded.")
    }

    fmt.Println(strings.Join(strSlice, ", ")) // => hoge, fuga
}
```

#### 応用

上の `Type Assertion` の応用が Tour of Go にあるため、それを参考にします。
`switch` と `interface{}.(type)` で期待している型が渡ってきたときに特定の処理を実行できます。

```go [interface6.go]
package main

import "fmt"

func do(i interface{}) {
    switch v := i.(type) {
    case int:
        fmt.Printf("Twice %v is %v\n", v, v*2)
    case string:
        fmt.Printf("%q is %v bytes long\n", v, len(v))
    default:
        fmt.Printf("I don't know about type %T!\n", v)
    }
}

func main() {
    do(21)
    do("hello")
    do(true)
    // => Twice 21 is 42
    // => "hello" is 5 bytes long
    // => I don't know about type bool!
}
```

### 4. 共通点がない複数の構造体に新規で型を持たせることができる

`interface` を利用することで、Go でダックタイピングをできます。
ダックタイピングについては知見が多くあるので、詳しくは書きませんが、`interface` を使うことで複数の構造体を同じ１つの型に変換します。`ads` 変数へ代入する前に構造体が必要な関数を持っているのかをエディタが教えてくれるため、コンパイルを実行する前の関数の追加漏れがなくなりました。`interface` がない Ruby だと動的な言語で実行しないとわからないため、インタフェースで先に約束が決められると、先読みしながらコードをかけるので便利だと感じました。

#### Before

```go [interface3.go]
package main

import "fmt"

type (
    // AdVideo ad video response struct
    AdVideo struct {
        VideoURL string `json:"video_url"`
        AdType   int64  `json:"ad_type"`
    }

    // AdPoster ad poster response struct
    AdPoster struct {
        PosterURL string `json:"poster_url"`
        AdType    int64  `json:"ad_type"`
    }
)

func main() {
    var ads []interface{}
    ads = append(ads, NewAdVideo())
    ads = append(ads, NewAdPoster())
    fmt.Println(ads) // => [{video url 1} {poster url 3}]
}

func NewAdVideo() AdVideo {
    return AdVideo{VideoURL: "video url", AdType: int64(1)}
}

func NewAdPoster() AdPoster {
    return AdPoster{PosterURL: "poster url", AdType: int64(3)}
}
```

#### After

```go [interface4.go]
package main

import "fmt"

type (
    // Adインタフェース
    Ad interface {
        GetAdType() int64
    }

    Ads []Ad

    // AdVideo ad video response struct
    AdVideo struct {
        VideoURL string `json:"video_url"`
        AdType   int64  `json:"ad_type"`
    }

    // AdPoster ad poster response struct
    AdPoster struct {
        PosterURL string `json:"poster_url"`
        AdType    int64  `json:"ad_type"`
    }
)

func main() {
    var ads Ads
    ads = append(ads, NewAdVideo())
    ads = append(ads, NewAdPoster())
    for _, ad := range ads {
        fmt.Println(ad)
    }
}

func NewAdVideo() AdVideo {
    return AdVideo{VideoURL: "video url", AdType: int64(1)}
}

// => Adのインタフェース型を持つために、`GetAdType`を実装した。
func (v AdVideo) GetAdType() int64 {
    return v.AdType
}

func NewAdPoster() AdPoster {
    return AdPoster{PosterURL: "poster url", AdType: int64(3)}
}

// => Adのインタフェース型を持つために、`GetAdType`を実装した。
func (p AdPoster) GetAdType() int64 {
    return p.AdType
}
```

### 5. `interface` を構造体に埋め込み

こちらの `interface` の使い方も記事を書く際に多くの知見があると知ったので特にここでは細かく書くことはしません。

PHP や Java では、`implements` を使って `interface` を取り込みます。Go ではフィールドが `interface` の型を持つようにして、`interface` を取り組むという言語仕様になっています。

この言語仕様を理解したときに便利だなと感じました。例えば、新しい API 実装で新たに構造体を作成するときに、必要なメソッドだけ揃っていたら正常に動くため、とりあえず `interface` で宣言された関数を新しい構造体に実装すれば問題ありません。上の 4 と似ていますが、やることリストが最初から決まっていて、リストにある関数を定義することで TODO リストのタスクが完了していく感覚があったので、わかりやすかったです。

```go [interface5.go]
package main

import "fmt"

type (
    // TagClient tag clientインタフェース
    TagClient interface {
        GetTag()
    }

    // TagClientImpl TagClientの実際の処理
    TagClientImpl struct {
    }

    // TagClientImplV2 TagClientの実際の処理
    TagClientImplV2 struct {
    }

    // ArticleClientImpl Tagという名前で、TagClientインタフェースを持つ。
    ArticleClientImpl struct {
        Tag TagClient
    }
)

func main() {
    articleClientImpl := NewArticleClientImpl()
    // 記事のタグを取得するには、`Tag`のインタフェースを経由して、`GetTag`を呼び出す。
    articleClientImpl.Tag.GetTag()
}

func NewArticleClientImpl() *ArticleClientImpl {
    // Tagフィールドに渡すものをNewTag()からNewTagV2()に変更するだけ。簡単...！!
    return &ArticleClientImpl{Tag: NewTagV2()}
}

func NewTag() TagClient {
    return &TagClientImpl{}
}

func (c *TagClientImpl) GetTag() {
    fmt.Println("Here is article tag")
}

func NewTagV2() TagClient {
    return &TagClientImplV2{}
}

func (c *TagClientImplV2) GetTag() {
    fmt.Println("Here is article tag V2")
}
```

### おまけ - カスタムエラーの作り方

go の `error` ってどんな中身なのかを調べようと思い、ドキュメントを読んだところ、なんと `interface` でした。

```go [error.go]
type error interface {
    Error() string
}
```

ということは、構造体に `Error() string` 関数を持たせれば、その構造体を `error` 型として扱ってくれるのかという仮説を立てました。
実際に書いてみたら、なんと自前で用意した構造体が見事 `error` 型となりました。`Error() string` さえあれば、`error` 型になるので、いろいろな場面のエラー構造体が作成できます。

```go [interface6.go]
package main

import (
    "fmt"
    "time"
)

type (
    Article struct {
        postedAt time.Time
    }
    // カスタムエラー構造体
    ArticleNotFoundError struct {
        Message string
    }
)

func main() {
    article, err := GetArticle()
    if err != nil {
        fmt.Println(err.Error()) // => "article not found"
    }
}

func GetArticle() (*Article, error) {
    return nil, NewArticleNotFoundError("article not found")
}

func NewArticleNotFoundError(message string) *ArticleNotFoundError {
    return &ArticleNotFoundError{Message: message}
}

// このメソッドがあるおかげで、ArticleNotFoundError構造体の型はerrorになり、GetArticleの第2引数の型はerrorになりました。
func (e *ArticleNotFoundError) Error() string {
    return e.Message
}
```

## まとめ

長くなりましたが、この記事を短くまとめると、**go での `interface` は型である** になります。

転職する前に go の　`interface` のことを勉強しましたが、実際に業務に入って書いてみると理解できていないことが多くありました。PHP や Java には軽く触れていましたが、インタフェースについていまいちこれを使う必要はあるのかと腑に落ちていないことが多かったです。
業務で触っているみると、理解度が深まり、これからも適材適所で使っていく予定です。GW で時間ができたため学んだことをまとめましたが、今後新たに学ぶことがあったら、追記していきます。
