---
title: 'Elasticsearchについて知っておくとお得なTips'
description: '学んだことをまとめると同時に、これからElasticsearchを使うことを検討されている人の何か役に立てればと思い、このような記事を書きました。'
categories: ['Tech', 'ElasticSearch']
publishedAt: "2020-09-29"
updatedAt: "2020-09-29"
---

## 概要

  - 実務でElasticsearchを触る機会がありましたが、始めて触ったため知らないことが多くElasticsearchのクエリ発行や現場のシステムで利用する前にこれを知っておきたかった・・・！と感じることが多々ありました。学んだことをまとめると同時に、これからElasticsearchを使うことを検討されている人の何か役に立てればと思い、このような記事を書きました。

## 誰に向けたもの？

  - Elasticsearchの基本的なことはわかっており、これから実務で本格的に使う人
    - Elasticsearchの概要や導入の仕方、主なユースケースには触れないため、どんな用途に向いているかはこの記事では省略します。あくまで、これから業務で使う人の入門に役立てればと思っています。わかりやすいように、RDSで使うSQLとの比較を入れて、まとめていきます。

## TL; DR

  1. `should`と`must` (`filter`) クエリの組み合わせを紹介
  2. `_source`は、用途によってはfalseにしましょう
  3. RDSのように、条件(クエリ)に一致したレコードをすべて取得できない
  4. Upsert機能もあるよ

## 始める前に

  - 現場でのelasticsearchでは最新バージョンが使えておらず、そのためelasticsearchから提供されているREST APIが最新バージョンのものと違うものを記載しているかもしれません。バージョンによって、REST APIのパスパラメーターが違うものがありますので、詳しくはドキュメントを読んでいただけると幸いです。

## 学んだこと

### 1. `should`と`must` (`filter`) クエリの組み合わせを紹介

Elasticsearchで条件に当てはまるドキュメントを絞り込むときに使うのに[BoolQuery](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html#query-dsl-bool-query)というものがあります。それにも種類があり、`should`と`must(filter)` があります。(以下からは `filter` を使います。`must`とほぼ変わらないですが、違いとしては、条件にどれぐらい当てはまっているかを表すスコアの計算をするかしないかになります。)

RDSのSQLと例えると、`should` は `OR` / `filter` は `AND` となります。
shouldで指定したフィールドの値の中で1つでも当てはまる値を持つドキュメントがElasticsearchから返却され、filterで指定したときはフィールドの値の中で全てに当てはまる値を持つドキュメントがElasticsearchから返却されます。

shouldを使ったときの例として、tag_idに1か2を持つドキュメントが取得されます。

```sql
select * from articles where tag_id in (1, 2)
```

```json
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

filterを使ったときの例として、tag_idに1と2の両方を持つドキュメントが取得されます。

```sql
select * from articles where tag_id in (1, 2)
```

```json
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

では、上2つを組み合わせは場合はどうなるでしょうか？
一例で下のような条件でドキュメントを取得したいときには、`in` 句と `=` を組み合わせ、両方にあてはまるという意味なのでfilterでラップすると条件を満たすことができます。

```sql
select * from articles where tag_id in (1, 2) and user_id = 10
```

```json
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

### 2. fetchsourceは、用途によってはfalseにしましょう

elastic searchでは、ドキュメントで登録されたフィールドとその値が全てレスポンスで返ってきます。自分で取得したいドキュメントににあるフィールドを選択すればいいか思いますが、逆に何も選択したくなく、ドキュメントにあるIDだけ必要だったり、レコードが見つかるだけ知りたいというケースもあるかと思います。そのときは、パフォーマンス向上のためにも、`_source: false` とクエリの中に条件を書くことによって、ドキュメントに登録している値全てがElasticsearchに返却されなくなるため、扱うデータ量を下げることもできます。

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

ドキュメントが返却されないことがわかります。

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

### 3. RDSのように、条件(クエリ)に一致したレコードをすべて取得できない

RDSに慣れている人なら、レコード取得で、limitをかけない限りデフォルトでは条件に当てはまるものを全て取得できるようになっていると思います。その感覚で、クエリで条件を書き、欲しいレコードを全て取得できると思いきや、Elasticsearchではそうならず、デフォルトで10件しか取得されることができません。

その上限を外すこともできず、調べたところ、ある程度の数をsizeで指定しないといけないみたいです。かと言ってsizeにElasticsearchのindexに登録されているであろう全てのドキュメントの数を指定すると、負荷的に高くなってしまい、Elasticsearchが落ちてしまうかもしれません。

実際自分はElasticsearchに当てはまるレコード数を用いて、ページネーションのため、APIのレスポンスヘッダーに`X-Page-Total-Count`や`X-Per-Page`などの情報を付与する実装を行おうとしたところ、全件取得ができないことに気づき、全体のレコード数がわからないため、レスポンスヘッダーに返す値をどうするかと悩んでいました。しかし、実際は下のレスポンスにあるように `.hits.total` で全体の数がわかり、各ページでのレコード数 / 全体数 でページ数などが求められたため、無事APIのレスポンスヘッダーにページネーション情報を付与することができました。

RDSの感覚で条件さえ書けば、当てはまるドキュメントが全て返却されると考えると利用していてつまずくかもしれません。

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

### 4. Upsertが便利だった

自分の現場に特定した話かもしれませんが、アプリやWEBサービスで表示するコンテンツについて、社内入稿ツールで作成・編集するという運用をしています。入稿ツールからコンテンツ更新APIを叩き、アプリやWEBサービスに掲載可能ということがわかったときに、Elasticsearchのインデックスにそのコンテンツのドキュメントがなかったらそれを作成をし、あれば差分だけ更新するという要件がありました。すでにドキュメントがあるかないかをAPIの処理の中で確かめるのも手間だなと思い、RDSだと `INSERT INTO xxx ON DUPLICATE KEY UPDATE yyy` のようなことを叶えてくれるAPIがElasticsearchから提供されていないかと調べてみました。調べたところ、[doc_as_upsert](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-update.html#doc_as_upsert) というものがあり、使ってみたところ要件を満たしてくれたため、便利だと感じました。

ちなみにUpsertは複数のドキュメントを更新するBulkRequestにも使うことができます。

#### 作成(insert)

例えば、下のようにドキュメントが存在していなくて、それを新たに作成するとき

```sh
curl -s GET 'http://es:6000/main-1/articles/111' | jq .
{
  "_index": "main-1",
  "_type": "articles",
  "_id": "111",
  "found": false
}
```

作成すると

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

今度はドキュメントがすでに存在していて、それを更新するとき

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

更新すると

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

  - 自分が本格的にElasticSearchを触って学んだことをまとめてみました。他にも多くのことを学びましたが、まだまだ基本的なことを覚えたぐらいなので、記事にまとめたほうがいいことがあったら更新していこうと考えています。ここまで読んでいただき、ありがとうございました。
