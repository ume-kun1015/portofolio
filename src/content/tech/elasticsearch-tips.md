---
title: 'ElasticSearch について知っておくとお得な Tips'
description: '学んだことをまとめると同時に、これから ElasticSearch を使うことを検討されている人の何か役に立てればと思い、このような記事を書きました。'
categories: ['Tech', 'ElasticSearch']
publishedAt: "2020-09-29"
updatedAt: "2020-09-29"
---

## 概要

実務で ElasticSearch を触る機会がありましたが、始めて触ったため、ElasticSearch のクエリ発行や現場のシステムで利用する前にこれを知っておきたかった…。と感じることが多々ありました。
学んだことをまとめると同時に、これから ElasticSearch を使うことを検討されている人の何か役に立てればと思い、このような記事を書きました。

## 対象者

ElasticSearch の基本的なことはわかっており、これから実務で本格的に使う人に向けての記事になります。

ElasticSearch の概要や導入の仕方、主なユースケースには触れないため、どんな用途に向いているかはこの記事では省略します。あくまで、これから業務で使う人の入門に役立てれば幸いです。わかりやすいように、RDS で使う SQL との比較を入れて、まとめていきます。

## TL; DR

  1. `should` と `must` (`filter`) クエリの組み合わせを紹介
  2. `_source` は、用途によっては false にしましょう
  3. RDS のように、条件(クエリ)に一致したレコードをすべて取得できない
  4. Upsert 機能もあるよ

## 始める前に

現場での ElasticSearch では最新バージョンが使えておらず、提供されている REST API が最新バージョンのものと違うものを記載している場合があります。バージョンによって、REST API のパスパラメーターの違うものがありますので、詳しくはドキュメントを読んでいただけると幸いです。

## 学んだこと

### 1. `should` と `must` (`filter`) クエリの組み合わせを紹介

ElasticSearch で条件に当てはまるドキュメントを絞り込むときに使うのに [BoolQuery](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html#query-dsl-bool-query) というものがあります。それにも種類があり、`should` と `must(filter)` があります。(以下からは `filter` を使います。`must`とほぼ変わらないですが、違いとしては、条件にどれぐらい当てはまっているかを表すスコアの計算をするかしないかになります。)

RDS の SQL と例えると、`should` が `OR` / `filter` は `AND` となります。
`should` で指定したフィールドの値の中で 1 つでも当てはまる値を持つドキュメントが ElasticSearch から返却されます。`filter` で指定したときはフィールドの値の中で全てに当てはまる値を持つドキュメントが ElasticSearch から返却されます。

`should` を使ったときの例として、tag_id に 1 か 2 を持つドキュメントが取得されます。

```sql [select.sql]
select * from articles where tag_id in (1, 2)
```

```json [query.json]
{
   "query": {
      "bool": {
         "should": [
            { "term": { "tag_ids": 1 } },
            { "term": { "tag_ids": 2 } }
         ]
      }
   }
}
```

`filter` を使ったときの例として、tag_id に 1 と 2 の両方を持つドキュメントが取得されます。

```sql [select.sql]
select * from articles where tag_id in (1, 2)
```

```json [query.json]
{
   "query": {
      "bool": {
         "filter": [
            { "term": { "tag_ids": 1 } },
            { "term": { "tag_ids": 2 } }
         ]
      }
   }
}
```

では、上 2 つを組み合わせの場合はどうなるでしょうか。
一例で下のような条件でドキュメントを取得したいときには、`in` 句と `=` を組み合わせ、両方にあてはまるという意味なので filter でラップすると条件を満たすことができます。

```sql [select.sql]
select * from articles where tag_id in (1, 2) and user_id = 10
```

```json [query.json]
{
   "query": {
      "bool": {
         "filter": [
            {
               "bool": {
                  "filter": [
                     { "term": { "user_id": 10 } }
                  ]
               }
            },
            {
               "bool": {
                  "should": [
                     { "term":{ "tag_ids": 1 } },
                     { "term":{ "tag_ids": 2 } },
                  ]
               }
            }
         ]
      }
   }
}
```

### 2. fetchsource は用途によってはfalseにしましょう

ElasticSearch では、ドキュメントで登録されたフィールドとその値が全てレスポンスで返ってきます。自分で取得したいドキュメントにあるフィールドを選択すればいいですが、逆に何も選択したくなく、ドキュメントにある ID だけ必要だったり、レコードが見つかるだけ知りたいというケースがあります。

そのときは、パフォーマンス向上のためにも、`_source: false` とクエリの中に条件を書けます。ドキュメントに登録している値すべてが ElasticSearch から返却されず、扱うデータ量を下げられます。

#### デフォルト (`_source: true`)

```shell
$ curl -s GET 'http://es:6000/main-1/articles/_search' -H 'Content-Type: application/json' -d'
  {
    "size": 2
  }' | jq .
{
  "took": 6,
  "timed_out": false,
  "_shards": {
    "total": 1,
    "successful": 1,
    "failed": 0
  },
  "hits": {
    "total": 15,
    "max_score": 1,
    "hits": [
      {
        "_index": "main-1",
        "_type": "articles",
        "_id": "112",
        "_score": 1,
        "_source": {
          "id": "111",
          "title": "記事1",
          ...,
          "created_at": "2019-11-22T06:24:28Z"
        }
      },
      {
        "_index": "main-1",
        "_type": "articles",
        "_id": "112",
        "_score": 1,
        "_source": {
          "id": "113",
          "title": "記事2",
          ...,
          "created_at": "2019-11-22T06:36:42Z"
        }
      }
    ]
  }
}
```

#### `_source: false` にしたとき

ドキュメントが返却されていません。

```shell
$ curl -s GET 'http://es:6000/main-1/articles/_search' -H 'Content-Type: application/json' -d'
  {
    "_source": false,
    "size": 2
  }' | jq .
{
  "took": 1,
  "timed_out": false,
  "_shards": {
    "total": 1,
    "successful": 1,
    "failed": 0
  },
  "hits": {
    "total": 15,
    "max_score": 1,
    "hits": [
      {
        "_index": "main-1",
        "_type": "articles",
        "_id": "111",
        "_score": 1
      },
      {
        "_index": "main-1",
        "_type": "articles",
        "_id": "112",
        "_score": 1
      }
    ]
  }
}
```

### 3. RDS のように、条件(クエリ)に一致したレコードをすべて取得できない

RDS に慣れている人なら、レコード取得で、limit をかけない限りデフォルトでは条件に当てはまるものを全て取得できるようになっています。その感覚で、クエリで条件を書き、欲しいレコードを全て取得できると思いきや、ElasticSearch ではデフォルトで 10 件しか取得されることができません。

その上限を外すこともできず、調べたところ、ある程度の数を size で指定しないといけないみたいです。かと言って size に ElasticSearch のインデックスに登録されているであろう全てのドキュメントの数を指定すると、負荷的に高くなってしまいます。

実際ページネーションの実装時、全件取得ができないことに気づき、全体のレコード数がわからないため、レスポンスヘッダーに返す値をどうするかと悩んでいました。しかし、実際は下のレスポンスにあるように `.hits.total` で全体の数が求められたため、無事 API のレスポンスヘッダーにページネーション情報を付与できました。

RDS の感覚で条件を書けば、当てはまるドキュメントが全て返却されることを考慮すると、どこかで落とし穴になる可能性があります。

```shell
$ curl -s GET 'http://es:6000/main-1/articles/_search' -H 'Content-Type: application/json' -d'
  {
    "size": 2
  }' | jq .
{
  "took": 6,
  "timed_out": false,
  "_shards": {
    "total": 1,
    "successful": 1,
    "failed": 0
  },
  "hits": {
    "total": 15,
    "max_score": 1,
    "hits": [
      {
        "_index": "main-1",
        "_type": "articles",
        "_id": "112",
        "_score": 1,
        "_source": {
          "id": "111",
          "title": "記事1",
          ...,
          "created_at": "2019-11-22T06:24:28Z"
        }
      },
      {
        "_index": "main-1",
        "_type": "articles",
        "_id": "112",
        "_score": 1,
        "_source": {
          "id": "113",
          "title": "記事2",
          ...,
          "created_at": "2019-11-22T06:36:42Z"
        }
      }
    ]
  }
}
```

### 4. Upsert が便利だった

自分はアプリや Web サービスで表示するコンテンツについて、社内入稿ツールで作成・編集するという運用をしています。入稿ツールからアプリや Web サービスに掲載可能ということがわかったときに、ElasticSearch のインデックスにドキュメントがなかったら、作成をし、あれば差分だけ更新する要件がありました。すでにドキュメントがあるかないかを確かめるのも手間だなと思い、RDS だと `INSERT DUPLICATE KEY` API が ElasticSearch から提供されていないかと調べてみました。

調べたところ、[doc_as_upsert](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-update.html#doc_as_upsert) というものがあり、使ってみたところ要件を満たしてくれたため、便利だと感じました。

ちなみに Upsert は複数のドキュメントを更新する BulkRequest にも使うことができます。

#### 作成 (insert)

例えば、下のようにドキュメントが存在していなくて、それを新たに作成するとき、

```sh
curl -s GET 'http://es:6000/main-1/articles/111' | jq .
{
  "_index": "main-1",
  "_type": "articles",
  "_id": "111",
  "found": false
}
```

作成すると、

```bash
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "doc": {
      "title": "記事1"
  },
  "doc_as_upsert": true
}' \
 'http://es:6000/main-1/articles/111/_update'
```

```sh
curl -s GET 'http://es:6000/main-1/articles/111' | jq .
{
  "_index": "main-1",
  "_type": "articles",
  "_id": "111",
  "_version": 1,
  "found": true,
  "_source": {
    "title": "記事1"
  }
}
```

#### 更新するとき (update)

今度はドキュメントがすでに存在していて、それを更新するとき、

```sh
$ curl -s GET 'http://es:6000/main-1/articles/112' | jq .
{
  "_index": "main-1",
  "_type": "articles",
  "_id": "112",
  "_version": 1,
  "found": true,
  "_source": {
    "id": "112",
    "title": "記事2",
    ...
    "created_at": "2017-05-12T02:48:51Z"
  }
}
```

更新すると、

```sh
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "doc": { "title": "記事2更新" }, "doc_as_upsert": true
}' \
 'http://es:6000/main-1/articles/112/_update'
```

しっかりタイトルを更新してくれました。

```sh
$ curl -s GET 'http://es:6000/main-1/articles/112' | jq .
{
  "_index": "main-1",
  "_type": "articles",
  "_id": "112",
  "_version": 1,
  "found": true,
  "_source": {
    "id": "112",
    "title": "記事2更新",
    ...
    "created_at": "2017-05-12T02:48:51Z"
  }
}
```

## まとめ

自分が本格的に ElasticSearch を触って学んだことをまとめてみました。他にも多くのことを学びましたが、まだまだ基本的なことを覚えたぐらいなので、記事にまとめることがあったら更新していこうと考えています。ここまで読んでいただき、ありがとうございました。
