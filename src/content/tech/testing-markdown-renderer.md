---
title: 'testing-markdown-renderer'
description: 'マークダウンから実際にどうレンダリングされるかをまとめました'
variant: "solid"
breadcrumb:
  [{ label: "Home", to: "/" }, { label: "Navigation" }, { label: "Breadcrumb" }]
categories: ["Tech"]
publishedAt: '2024-08-16'
updatedAt: '2024-08-16'
---

## 見出し

```text
# 見出し1
## 見出し2
### 見出し3
#### 見出し4
```

## テキストリンク

```text
[アンカーテキスト](/)
```

[アンカーテキスト](/)

## リスト

```text
- Hello!
- Hola!
  - Bonjour!
  * Hi!
```

  - Hello!
  - Hola!
    - Bonjour!
    - Hi!

## インラインスタイル

```text
*イタリック*
**太字**
~~打ち消し線~~
`code`
```

*イタリック* **太字** ~~打ち消し線~~ `code`

## コードブロック

### diff

```diff [diff]
- const posts = await this.$content('/blog', { deep: true }).only(['title']).fetch()
+ const { data: posts } = await useAsyncData('posts-list', () => queryContent('/blog').only(['title']).find())
```

### bash

```bash [make_tag.bash]
$ cd path/to/app/repository
$ git tag -a ${tag} -m "参照するアプリとそのバージョン" head
$ git push origin ${tag}
```

### dockerfile

```docker [rails.Dockerfile]
FROM ruby:3.2-slim-bookworm

WORKDIR /app

CMD ["/bin/bash"]
```

### dotenv

```dotenv [.env]
DEV_OAUTH_CLIENT_ID='1'
DEV_OAUTH_CLIENT_SECRET='dfas'
```

### yaml

```yaml [.workflows/publish_release_note.yml]
name: Publish Release

on:
  push:
    tags:
      - "v*"

jobs:
  publish_release:
    timeout-minutes: 5

    runs-on: ubuntu-latest

    permissions:
      contents: write
      pull-requests: read

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 4
```

### html

```html [index.html]
<div>
  <p>hogehoge</p>
</div>
```

### scss

```scss [test.scss]
.hogehoge {
  font-size: 16px;
  font-weight: bold;

  .fugafuga {
    background-color: blue;
  }
}
```

### JavaScript

```js [file.js]
export default {
  name: "hogehoge",
  methods: {
    echoPiyo() {
      return "hogehoge";
    },
  },
};
```

### TyepScript

```ts [file.ts]
export const hogehoge: string = "hogehoge";

export const sum = (a: number): number => {
  return a + b;
};
```

### vue

```vue [piyopiyo.vue]
<template>
  <p>script setup is great</p>
</template>

<script setup lang="ts">
import { fugafuga } from "imports";

export const fugafuga = ref("fugafuga");
</script>

<style scoped>
.tokaionair {
  display: flex;
}
</style>
```

### csv

```csv [hogehoge.csv]
first,second
1,2
```

### json

```json [example.json]
{
  "hoge": "hogehge",
  "fuga": "fugafuga"
}
```

### xml

```xml [AndroidManifest.xml]
<manifest
    xmlns:android="http://schemas.android.com/apk/res/android"
    package="jp.itans.isinModuleApps"
>
    <uses-permission android:name="android.permission.INTERNET"/>

    <application
        android:label="@string/app_title"
        android:fullBackupContent="false">
        <activity
            android:name=".MainActivity"
            android:launchMode="singleTask"
            android:theme="@style/LaunchTheme"
        >

            <meta-data
              android:name="io.flutter.embedding.android.NormalTheme"
              android:resource="@style/NormalTheme"
            />

            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:scheme="@string/scheme" />
            </intent-filter>
        </activity>

        <meta-data
            android:name="com.google.android.geo.API_KEY"
            android:value="@string/google_map_api_key"/>
    </application>
    <queries>
        <package android:name="com.google.android.apps.fitness" />

        <intent>
            <action android:name="android.intent.action.SEND" />
            <data android:mimeType="*/*" />
        </intent>
    </queries>
</manifest>
```

### dart

```dart [StatelessWidget.dart]
import 'module_health/module_health.dart';

class Hogehoge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Container();
  }
}
```

### ruby

```ruby [parser.rb]
class Parser < ActiveRecord {
  def initialize(policy)
    @policy = policy
  end

  def to_s
    @policy.to_s
  end
}
```

### go

```go [example.go]
struct {
  Hoge string `json:fuga`
}


func main() void {
  fmt.printfs(Hoge)
}
```
