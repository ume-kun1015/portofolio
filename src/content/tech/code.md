---
title: 'samples codes'
description: 'sample codes written in codes'
variant: "solid"
breadcrumb:
  [{ label: "Home", to: "/" }, { label: "Navigation" }, { label: "Breadcrumb" }]
category: ["tech"]
publishedAt: '2024-08-16'
---

## Nuxt Content

::UAlert{title="Heads up!"}
::

::UAlert{:variant="variant" title="Your warning" color="primary"}
::

::UBreadcrumb{:links="breadcrumb"}
::

::UBadge{label="Badge"}
::

![my image](/img/IMG_3301.jpg)

```diff [diff]
- const posts = await this.$content('/blog', { deep: true }).only(['title']).fetch()
+ const { data: posts } = await useAsyncData('posts-list', () => queryContent('/blog').only(['title']).find())
```

```bash [make_tag.bash]
$ cd path/to/app/repository
$ git tag -a ${tag} -m "参照するアプリとそのバージョン" head
$ git push origin ${tag}
```

```docker [rt-rails.Dockerfile]
FROM ruby:3.2-slim-bookworm

# Workaround for https://github.com/heyinc/rt-rails/issues/33214
RUN echo 'Acquire::http::Pipeline-Depth 0;\nAcquire::http::No-Cache true;\nAcquire::BrokenProxy true;' >> /etc/apt/apt.conf.d/99fixbadproxy

# Setup Ruby env
ARG BUNDLER_VERSION=2.2.16
RUN gem install bundler -v ${BUNDLER_VERSION}

# Setup Nodejs env
ARG NODE_MAJOR=18
RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install nodejs -y && \
    npm install -g yarn

# install dockerize.
ENV DOCKERIZE_VERSION v0.6.1
RUN curl -OL https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz && \
    tar -C /usr/local/bin -xzvf dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz && \
    rm dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz

WORKDIR /app

CMD ["/bin/bash"]
```

```dotenv [.env]
DEV_OAUTH_CLIENT_ID='1'
DEV_OAUTH_CLIENT_SECRET='dfas'
```

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
          fetch-depth: 1

      - name: Create Changelog
        id: create_changelog
        uses: mikepenz/release-changelog-builder-action@v3
        with:
          configuration: "./.github/config/workflows/release_note_configuration.json"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Release
        uses: softprops/action-gh-release@v1
        with:
          draft: false
          prerelease: false
          token: ${{ secrets.GITHUB_TOKEN }}
          body: ${{ steps.create_changelog.outputs.changelog }}
```

```html [index.html]
<div>
  <p>hogehoge</p>
</div>
```

```scss [test.scss]
.hogehoge {
  font-size: 16px;
  font-weight: bold;

  .fugafuga {
    background-color: blue;
  }
}
```

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

```ts [file.ts]
export const hogehoge: string = "hogehoge";

export const sum = (a: number): number => {
  return a + b;
};
```

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

```csv [hogehoge.csv]
first,second
1,2
```

```json [example.json]
{
  "hoge": "hogehge",
  "fuga": "fugafuga"
}
```

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

```dart [StatelessWidget.dart]
import 'module_health/module_health.dart';

class Hogehoge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Container();
  }
}
```

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

```go [example.go]
struct {
  Hoge string `json:fuga`
}


func main() void {
  fmt.printfs(Hoge)
}
```
