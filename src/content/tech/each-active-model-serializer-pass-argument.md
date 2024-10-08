---
title: '【Rails/ActiveModelSerializers】each_serializerで呼び出し側から、Serializerクラスに値を渡したいとき'
description: '呼び出し側から ActiveModelSerializer クラスに値を渡すのに調べたことをまとめて議事録。'
categories: ['Tech', 'Ruby on Rails']
publishedAt: '2017-11-04'
updatedAt: '2017-11-04'
---

## 前書き

Ruby on Rails で、JSON API を作る上で、[active_model_serializers](https://github.com/rails-api/active_model_serializers) という gem が便利だったので、記録を残そうと思いました。each_serializer というコレクションを扱うオプションがあるのですが、呼び出し側から serializer クラスに値を渡すことで結構調べたため、忘れずにメモを取ります。

## ActiveModelSerializerって何

  - JSON を吐き出すときのロジックを書けるクラスを作成してくれる gem。

## 個人的にいいなと思ったところ

  - JSON に吐き出すときのロジックをモデルに書かなくてもいいところ。
    - モデルの責務が大きくなり、自然とコードの量が増える。
    - いわゆる Fat Model 対策
  - モデルに定義したアソシエーションを使えること。

## Before: ActiveModelSerializers を知る前

  - 1. jbuilder を使う。
    - こちらは、view ディレクトリに入っていくため、腑に落ちないと感じていた。
    - 毎回 json と書かないといけないのも、めんどくさい。
    - モデルに関連しているクラスのプロパティへのアクセサーを書かないといけない。(下の user_nickname)
      - Decorator じゃないから、これはやりたくない。
    - 三項演算子では、表現できない if 文などは、書くのが難しくなる。

```ruby [messages/create.json.rb]
if @message.errors.present?
   json.error_message    @message.errors.full_messages.first
 else
   json.user_name        @message.user_nickname
   json.body             @message.body
   json.created_at       @message.created_at.to_s(:default)
   json.image            @message.image
   json.user_id          @message.user.id
end
```

## After: ActiveModelSerializers を知ったあと

```ruby [messages_serializer.rb]
class MessageSerializer < ActiveModel::Serializer
  include ActiveModel::Serialization

  attributes :id, :body, :user_name, :image, :created_at, :updated_at,

  def user_name
    object.user.present? object.user.name || 'no-name'
  end

end
```

まさにこのような API が欲しく、

  1. 新しく `Serializers` ディレクトリが作成され、その中に`Serializer`クラスを定義していく形になる。
  2. キーにロジックを加えなくてもいいときは、`attributes` のリストに入れるだけ。
    - 楽！！！ `jbuilder` みたいに `json` って書かなくてもいい！！
  3. プロパティのアクセサーは、こちらに書いていくので、モデルに書く必要はない。
  4. メソッドの名前がキーになり、返り値がそのまま出力されるシンプルなもの。

## 実際に業務で使ってみて

```ruby [users_controller.rb]
def show
  @user = User.find(params[:id])
  render json: UserSerialzier.new(@user)
end
```

```ruby [user_serializer.rb]
class UserSerializer < ActiveModel::Serializer
  include ActiveModel::Serialization

  attributes :facebook_avatar_url, :full_name, :registered_at

  def facebook_avatar_url
    "https://graph.facebook.com/#{object.facebook_id}/picture?type=large"
  end

  def full_name
    "#{object.last_name} #{object.first_name}"
  end

  def registered_at
    object.created_at
  end
end
```

余談ですが、会社のフロントエンジニアは、全て外国人です。本場の英語を使っているからか、json のキーの名前の変更がかなりあったので、`Serializer` には大変助けられた...。(`active_model_serializer` を知らなかったら、最悪の場合、データベースのカラム名などを変えていた可能性があります...。)

## 本題: each_serializerのオプションで、呼び出し側から値を入れたいとき

下は簡易コードです。

1 つのオブジェクトを`Serializer`を使って、JSON を返すときは、`Serializer` クラスの `initialize` メソッドで option を引数のなかで、取得できます。

```ruby [users_controller.rb]
def show
  user = Users.find(params[:id])
  user_status = params[:status]
  render json: UserSerializer.new(user), user_status: user_status
end
```

```ruby [user_serializer.rb]
class UserSerializer < ActiveModel::Serializer
  include ActiveModel::Serialization

  attributes :user_status

  def initialize(object, **option)
    @user_status = option[:user_status]
  end

  def user_status
    @user_status
  end

end
```

しかし、コレクションの場合...(`each_serializer`を使うとき)

```ruby [users_controller.rb]
def index
  @users = User.all
  user_status = params[:user_status]
  render json: @users, each_serializer: UserSerializer, user_status: user_status
end
```

と書いたときに、エラー発生...。どうやら、`each_serialzier` オプションを使うときは、オプションで呼び出し側から、`Serializer` に値を渡せないらしい。では、どうすればいいのか。
いろいろと調べた結果、下の記事を発見しました。

<https://stackoverflow.com/questions/32439568/how-to-pass-parameters-to-activemodelarrayserializer>

正解は、こちら。

```ruby [user_serializer.rb]
class UserSerializer < ActiveModel::Serializer
  include ActiveModel::Serialization

  attributes :user_status

  def user_status
    scope[:user_status]
  end

end
```

`scope` を使うみたいで、これでエラーが解決し、時間かけて探した甲斐がありました。

## まとめ

初めて使った gem でしたが、こんなに便利な gem があったんだと感銘を受けるほど、`active_model_serializer` は便利でした。おかげで、モデルに書くメソッドが少なくなり、責務を分けることができました。 `active_model_serializer` を使っていて、他にもこんな使い方があるよ〜って方は、ぜひコメントに残していただけると幸いです。
