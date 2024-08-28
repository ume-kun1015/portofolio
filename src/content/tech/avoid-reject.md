---
title: "Git Submodule のライブラリ化を使って iOS 審査のリジェクトを回避した話"
description: "多くの機能を含んでいる社内 Git Submodule を使ったアプリで、使用していない機能について言及され iOS 審査でリジェクトされたことを回避した話を書きます。"
category: ["flutter", "tech"]
publishedAt: "2022-12-10"
---

これは [Flutter Advent Calendar 2022](https://qiita.com/advent-calendar/2022/flutter) の 13 日の記事になります

## これ何？

こんにちは！ Flutter でモバイルアプリ開発をしている offy といいます。普段は WEB フロントの仕事もやりつつ、ひょんなことから Flutter でモバイルアプリ開発の現場にも関わるようになり、今後は WEB とアプリの両方関われるエンジニアになろうと奮闘しています。

今回関わっている現場で、多くの機能を含んでいる社内ライブラリを使ったアプリで、使用していない機能について言及され iOS 審査でリジェクトされたことを回避した話を書きます。

## 経緯

関わっている現場のプロダクトでは、多くの機能が 1 つに共通化されている Git Submodule を使用しています。その Git Submodule ではその Git Submodule を使用しているアプリ側の Dart ファイルたちを参照しています。社内からリリースされているアプリについては、全てその Git Submodule を使用し、使用する側にある設定ファイルで使用する機能やデザインを切り替えることで、全く別のオリジナルのアプリが出来上がるという仕組みになっています。新規アプリを作るときも 0 から機能を作る必要がなく、すでに実装した機能を別のアプリにも簡単に取り入れられるのが利点です。

今年もその Git Submodule を使い、1 つ新規アプリをリリースすることになりました。本格リリースする前に余裕を持って、先に Apple の審査にかけて通るかを確認したところ、そのアプリでは一切使用しない健康管理機能が依存している Health Package について言及され、結果リジェクトされることになりました。たとえ、API を使用していなかったり Xcode の設定で Health Package を有効にしていなかったとしても、プロジェクトにインストールされている時点でリジェクトされるようです。

このときは Git Submodule にある Health Package の import 部分をすべてコメントした状態で Health Package の API を抜き、審査で再提出したところ無事審査が通り、リリースすることができました。しかし、これからの運用で毎回リリースする前に該当箇所をコメントする運用もリリースするコストが高くなってしまう問題がありました。逆もしかりで、健康管理機能を使っている他のアプリでは、Submodule の中でコメントをつけた状態でリリースすることがでできません。この問題を解決するために、Health Package の有無をアプリによって動的に変えられるような仕組みを作ろうと考えました。

## 技術仕様

このときすでに Submodule を取り込んでアプリをリリースし運用できている実績があるため、新しく健康管理の処理を集めた Flutter Package を作り、それを Git Submodule で作れないかを考えました。健康管理機能で使っているアプリとそうではないアプリがあるため、2 つ Flutter Package を作る必要があります。

すでにある大きなライブラリから健康管理の処理だけ分離するため、その大きなライブラリが Health Package 関連の API を呼んでいる箇所のインタフェースは守る必要があります。インタフェースは同じに保ったまま、片方には元々大きなライブラリにあった Health Package との繋ぎ込み処理の実態をそのまま移動させ、片方は空の固定値を返す処理だけを集めたものにします。

それでアプリ側で必要に応じて Git Submodule 登録するパッケージを切り替えることで健康管理が必要なアプリには今まで通り使え、必要ではないアプリではインタフェースを満たした空の値を返す実態をします。

こうすることで、上で記載したとおりそのアプリで使用していない機能についてのリジェクトされないのでは考えました。他の利点としては、健康管理を使用していないアプリには Health Package が含まれないため、その分アプリの容量が減りユーザーの携帯の容量節約にも繋がっています。

### 具体的な実装

具体的な実装については、まずは今までの処理を集めたパッケージと空の繋ぎ込みが入っていない Dart Package を作ります。詳しくは割愛しますが、Flutter のパッケージには `package` と `plugin` の両方があり、片方が Dart のみで書かれた一般的なパッケージとなり、もう一方が Dart で書かれたコードに加えて、Android/iOS などのネイティブ API にアクセスするライブラリとなります。今回は前者のほうを作るので、template に `package` を指定します。

```bash
$ flutter create --template=package module_health
$ flutter create --template=package module_health_empty
```

上でパッケージの名前を `${package_name}` / `${package_name}_empty` にしましたが、 元々 1 つの submodule にあった処理はそれらを参照するため、2 つともファイル名や library 修飾子の後につける言葉は同じにするするのがポイントです。今回は、`module_health` という名前をつけます。

#### module_health

一部抜粋しましたが、こちらが元々 1 つの Submodule にあった処理になります。

```dart [module_health/lib/module_health.dart]
library module_health;

import 'dart:io';

import 'package:health/health.dart';
import 'package:permission_handler/permission_handler.dart';

class HealthService {
  static final HealthFactory _health = HealthFactory();

  HealthService._privateConstructor();

  static final HealthService _instance = HealthService._privateConstructor();

  static HealthService get instance => _instance;

  Future<bool> requestAuthorization(
      {List<HealthDataType> types = const [HealthDataType.STEPS]}) async {
    bool status = false;
    if (Platform.isAndroid) {
      final permissionStatus = Permission.activityRecognition.request();
      if (await permissionStatus.isDenied ||
          await permissionStatus.isPermanentlyDenied) {
        status = false;
        return status;
      }
    }
    status = await _health.requestAuthorization(types);
    return status;
  }

  Future<void> revokePermission() {
    return HealthFactory.revokePermission();
  }
}
```

#### module_health_empty

こちらは元々あった処理のインタフェースを満たし、実態は空の固定値だけを返すパッケージになります。

```dart [module_health_empty/lib/module_health.dart]
library module_health;

import 'package:module_health/data_types.dart';
import 'package:module_health/health_data_point.dart';

class HealthService {
  HealthService._privateConstructor();

  static final HealthService _instance = HealthService._privateConstructor();

  static HealthService get instance => _instance;

  Future<bool> requestAuthorization(
      {List<HealthDataType> types = const [HealthDataType.STEPS]}) async {
    return false;
  }

  Future<void> revokePermission() async {
    return;
  }
}
```

あとはそれをアプリの Git Submodule として登録して、 pubspec.yml で下のように書けば問題なしです。このとき、ios/Podfile.lock にも module_health_empty を取り込んでいるアプリでは swift の health パッケージが入らなくなります。

```bash
// 健康管理が必要となるアプリ
$ git submodule add git@github.com:${organizaiton_name}/module-health.git module-health

// 健康管理が必要ではないアプリ
$ git submodule add git@github.com:${organization_name}/module-health-empty.git module-health
```

必要でも必要ではないアプリでもこのように module_health をこのように登録する。

```yaml [pubspec.yml]
  module_health:
    path: ../module-health
```

### 大変だったところ

実際にそれぞれのアプリで動的にパッケージを変更できるようにした後で運用で出てきた問題をあげて、どう解決したかを紹介します。

#### CI が通らない

関わっているプロジェクトでは CI で GitHub Actions を採用しています。普段コミットを積んだり、PR を作成したのをトリガーに lint やテストを実行しています。しかし、今回動的にパッケージを変えられるようにして、CI を実行するときに複数のプライベートリポジトリを取得する方法を調査しないといけませんでした。

Git Submodule を使用している以上、GitHub Actions の Personal Access Token を付与しての actions/checkout の Actions を使うことができませんでした。そこで GitHub Actions で複数の Git Submodule を取得する方法を調査したところ、Git Submodule のリポジトリに ssh の公開鍵を登録し、取得したいアプリの Github Actions から `GIT_SSH_COMMAND` のキーに秘密鍵を登録すれば取得が行えることがわかりました。

このあたりの複数のプライベートレポジトリを取得するやり方については、[GitHub Actions で複数のサブモジュールの取得を SSH で行う](https://qiita.com/ntm718/items/ac11441395ced6b79f09) の記事が参考になりました。

```yaml [.github/workflows/lint.yaml]
name: lint

on:
  pull_request:
    types: [opened, synchronize]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 1

      - name: make ssh directory
        run: |
          mkdir -p $HOME/.ssh/

      - name: checkout module-core
        env:
          TOKEN: ${{ secrets.SUBMODULE_ACCESSKEY }}
        run: |
          echo -e "$TOKEN" > $HOME/.ssh/id_module_core_rsa
          chmod 600 $HOME/.ssh/id_module_core_rsa
          export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/id_module_core_rsa"
          git submodule update --init --force --recursive lib_core

      - name: checkout module-health
        env:
          MODULE_HEALTH_EMPTY_ACCESSKEY: ${{ secrets.MODULE_HEALTH_EMPTY_ACCESSKEY }}
        run: |
          echo -e "$MODULE_HEALTH_EMPTY_ACCESSKEY" > $HOME/.ssh/id_module_health_rsa
          chmod 600 $HOME/.ssh/id_module_health_rsa
          export GIT_SSH_COMMAND="ssh -i $HOME/.ssh/id_module_health_rsa"
          git submodule update --init --recursive module-health

      - uses: subosito/flutter-action@v2.7.1
        with:
          channel: "stable"
          flutter-version: "2.10.5"

      - run: flutter pub get
      - run: flutter format --set-exit-if-changed .
      - run: flutter analyze
```

## まとめ

いかがだったでしょうか？このようにアプリによって本必要なものを取り込めるような仕組みを作り、無事 Apple 審査を毎度通すことができています。

元々 1 つに凝縮されている Git Submodule には健康管理以外にも、Stripe を使ったサブスクリプション機能や、Google Maps を使った地図機能など大きな規模の機能が含まれています。これもそれぞれアプリによっては使われたり使われなかったりで、Tree-Shaking ができていない状況になっています。今回のことをきっかけに、必要あればパッケージ化を図りリジェクトされる可能性を減らしたり、ユーザーの iPhone の容量節約などに貢献していきたいと考えています。

今回は Git Submodule 化のアプローチを取りましたが、他にも別の可能性があるのではないかと考えているので、都度最適解を探っていく所存です。

長くなりましたが、ここまでのご精読ありがとうございました。
