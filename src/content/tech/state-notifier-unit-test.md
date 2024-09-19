---
title: 'State Notifier のユニットテストのプロダクトに導入した話'
description: '多くの機能を含んでいる社内 Git Submodule を使ったアプリで、使用していない機能について言及され iOS 審査でリジェクトされたことを回避した話を書きます。'
categories: ['Flutter', 'Tech', 'Riverpod']
publishedAt: "2022-12-12"
updatedAt: "2022-12-12"
---

これは [Flutter Advent Calendar 2022 12日目](https://qiita.com/advent-calendar/2022/flutter)の記事になります。

## これ何？

こんにちは！ Flutter でモバイルアプリ開発をしている offich といいます。今回関わっている現場で [Riverpod](https://riverpod.dev/docs/introduction/getting_started) の State Notifier のテストをプロダクトに導入し、チーム全体でテストを書く文化を取り入れた話を書きます。

## モチベーション

担当しているプロダクトのアプリでは、状態管理ライブラリとして [Riverpod](https://riverpod.dev/docs/introduction/getting_started) を採用しています。その Riverpod が依存している  State Notifier を ViewModel として扱いデータの変更を View に伝えています。APIからのデータ取得や投稿、ウィジェットの表示非表示の切り替えなど表示に関わるロジックについては、ほとんど State Notifier に記載されています。

ユニットテストを導入する理由については、多くの企業や開発チームとほとんど同じものになっています。ロジックが多く書かれているプロダクトで、ユニットテストが導入されていないと、修正時に既存ロジックが壊れていることに気づけずリリースされたり、複雑なロジックの正しく動作確認を全て手動で行うことで、普段の開発の動作確認やリリース前のQAなども時間がかかりリリースまでの時間が必要以上にかかってしまいます。1つ1つのメソッドがどのように使われるかを確認する術もないため、使用用途に沿っているのか、または仕様をきちんと満たしているかもわからない状況でした。さらに新規で追加したロジックが既存のロジックでリグレッションを起こしていないか不安な状態になりながら、開発するのも精神的負荷がかかってしまいます。

上記に書いたさまざまな問題の解決をモチベーションとして、プロダクトにユニットテストを導入することを決めました。

## 実際に行動に起こしたこと

1. テストを書く
2. CI で常にテストが通ることを確認できる体制を作る
3. ガイドラインの作成

### 1. ユニットテストを書く

ユニットテストを使用した技術スタックとしては、下になります。

 - [flutter_test](https://api.flutter.dev/flutter/flutter_test/flutter_test-library.html)
    - flutter のテスティングフレームワークです
 - [mockito](https://pub.dev/packages/mockito)
    - API やアプリ内DB への接続、ライブラリが提供しているメソッドをモックするために使用しています。
 - [build_runner](https://pub.dev/packages/build_runner)
    - 上の mockito のモックファイルを生成するために build_runner を動かす必要があります。モックファイルたちは下記のコマンドで生成できます。

#### テスト対象ファイル

自分は課金機能を主に担当しているため、その機能を導入したときに書いた StateNotifier のコードを一部抜粋します。実際の課金ロジックを取り上げると長くなるため、ユーザーが解約するときのロジックを記載します。

```dart [flutter_app/lib/pages/subscription_plan/subscription_plan_notifier.dart]
import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:flutter_app/repositories/repository.dart';
import 'package:flutter_app/constants/subscription/subscription_type_id.dart';
import 'package:flutter_app/pages/subscription_plan/subscription_plan_state.dart';
import 'package:flutter_app/routes/route_path.dart';
import 'package:flutter_app/config/subscription_plan.dart';
import 'package:flutter_app/config/messages.dart';
import 'package:flutter_app/utils/date_util.dart';
import 'package:flutter_app/utils/dialog_util.dart';
import 'package:flutter_app/notifiers/top_app_state.dart';

class SubscriptionPlanNotifier extends StateNotifier<SubscriptionPlanState> {
  SubscriptionPlanNotifier(
    this._api,
    this._topAppState,
    this._dialog,
  ) : super(const SubscriptionPlanState());

  final API _api;
  final TopAppState _topAppState;
  final DialogUtil _dialog;

  Future<void> unsubscribe() async {
    if (state.isLoading) {
      return;
    }

    state = state.copyWith(isLoading: true);

    final subscriptionTypeId =
        state.user?.subscriptionTypeId ?? SubscriptionTypeID.free;
    final hasIncomplete = state.paymentData?.hasIncomplete ?? false;

    if (subscriptionTypeId == SubscriptionTypeID.free && !hasIncomplete) {
      state = state.copyWith(isLoading: false);
      _dialog.showOkDialog(
        'エラー',
        [Messages.subscriptionNoUnsubscribablePlanText],
      );
      return;
    }

    try {
      final canCancel = await _api.canCancelSubscription();
      state = state.copyWith(isLoading: false);

      if (!canCancel.can) {
        _dialog.showOkDialog(
          'エラー',
          [Messages.subscriptionCannotUnsubscribeText],
        );
        return;
      }

      _topAppState.pushPathToMyPageRoute(UnsubscriptionPlanPath());
    } catch (e) {
      state = state.copyWith(isLoading: false);

      _dialog.showOkDialog(
        Messages.networkError,
        [Messages.internalServerErrorDescription],
      );
    }
  }

  bool unsubscribeDisabled() {
    final subscriptionTypeId =　state.user.subscriptionTypeId
    final canceled = state.paymentData.cancelled;

    return subscriptionTypeId == SubscriptionTypeID.free || canceled;
  }
}
```

#### 実際のテストファイル

上の StateNotifier で定義している解約処理と解約が可能か不可能かのフラグをテストしていきます。

```dart [flutter_app/tests/pages/subscription_plan/subscription_plan_notifier_test.dart]
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';

import 'package:flutter_app/config/app.dart';
import 'package:flutter_app/model/subscription_can_cancel.dart';
import 'package:flutter_app/constants/subscription/subscription_type_id.dart';
import 'package:flutter_app/pages/subscription_plan/subscription_plan_notifier.dart';
import 'package:flutter_app/repositories/repository.dart';
import 'package:flutter_app/notifiers/top_app_state.dart';
import 'package:flutter_app/utils/dialog_util.dart';
import 'package:flutter_app/model/payment_data.dart';
import 'package:flutter_app/model/user.dart';
import 'package:flutter_app/config/messages.dart';

import 'subscription_plan_notifier_test.mocks.dart';

@GenerateMocks([API, TopAppState, DialogUtil])
void main() {
  group(
    'pages/subscription_plan/subscription_plan_notifier',
    () {
      group('unsubscribe', () {
        final mockAPI = MockAPI();

        group('ユーザーが課金購読していないとき', () {
          setUp(() {
            final user = User(
              id: 1,
              subscriptionTypeId: SubscriptionTypeID.free,
            );

            when(mockAPI.getCurrentUserInfo()).thenAnswer((_) async => user);
          });

          group('課金購読が終わっているとき', () {
            setUp(() {
              final paymentData = PaymentData(hasIncomplete: false);

              when(mockAPI.getPaymentData())
                  .thenAnswer((_) async => paymentData);
            });

            test('解約できないエラーダイヤログが表示される', () async {
              final mockDialogUtil = MockDialogUtil();
              final notifier = SubscriptionPlanNotifier(
                mockAPI,
                MockTopAppState(),
                mockDialogUtil,
              );

              await notifier.setUserInfo();
              await notifier.setPaymentData();

              await notifier.unsubscribe();

              verify(
                mockDialogUtil.showOkDialog(
                  'エラー',
                  argThat(
                      equals([Messages.subscriptionNoUnsubscribablePlanText])),
                ),
              );
            });
          });
        });

        group('ユーザーが課金購読しているとき', () {
          setUp(() {
            final user = User(
              id: 1,
              subscriptionTypeId: SubscriptionTypeID.year,
            );
            when(mockAPI.getCurrentUserInfo()).thenAnswer((_) async => user);
          });

          group('解約できるとき', () {
            setUp(() {
              final canCancel = SubscriptionCanCancel(can: true);
              when(mockAPI.canCancelSubscription())
                  .thenAnswer((_) async => canCancel);
            });

            test('解約プランスクリーンに遷移する', () async {
              final mockTopAppState = MockTopAppState();
              final notifier = SubscriptionPlanNotifier(
                mockAPI,
                mockTopAppState,
                MockDialogUtil(),
              );

              await notifier.setUserInfo();
              await notifier.unsubscribe();

              verify(
                mockTopAppState.pushPathToMyPageRoute(UnsubscriptionPath()),
              );
            });
          });

          group('解約できないとき', () {
            setUp(() {
              final canCancel = SubscriptionCanCancel(can: false);
              when(mockAPI.canCancelSubscription())
                  .thenAnswer((_) async => canCancel);
            });

            test('解約できないエラーダイヤログが表示される', () async {
              final mockDialogUtil = MockDialogUtil();
              final notifier = SubscriptionPlanNotifier(
                mockAPI,
                MockTopAppState(),
                mockDialogUtil,
              );

              await notifier.setUserInfo();
              await notifier.unsubscribe();

              verify(
                mockDialogUtil.showOkDialog(
                  'エラー',
                  [Messages.subscriptionCannotUnsubscribeText],
                ),
              );
            });
          });
        });
      });

      group('unsubscribeDisabled', () {
        final mockAPI = MockAPI();

        group('課金購読がキャンセルされているとき', () {
          setUp(() {
            final paymentData = PaymentData(cancelled: true);

            when(mockAPI.getPaymentData()).thenAnswer((_) async => paymentData);
          });

          group('ユーザーが課金購読しているとき', () {
            setUp(() {
              final user = User(
                id: 1,
                subscriptionTypeId: SubscriptionTypeID.year,
              );

              when(mockAPI.getCurrentUserInfo()).thenAnswer((_) async => user);
            });

            test('false になる', () async {
              final notifier = SubscriptionPlanNotifier(
                mockAPI,
                MockTopAppState(),
                MockDialogUtil(),
              );

              await notifier.setUserInfo();
              await notifier.setPaymentData();

              expect(notifier.isSubscribed(), false);
            });
          });

          group('ユーザーが課金購読していないとき', () {
            setUp(() {
              final user = User(
                id: 1,
                subscriptionTypeId: SubscriptionTypeID.free,
              );

              when(mockAPI.getCurrentUserInfo()).thenAnswer((_) async => user);
            });

            test('true になる', () async {
              final notifier = SubscriptionPlanNotifier(
                mockAPI,
                MockTopAppState(),
                MockDialogUtil(),
              );

              await notifier.setUserInfo();
              await notifier.setPaymentData();

              expect(notifier.unsubscribeDisabled(), true);
            });
          });
        });

        group('課金購読がキャンセルされていないとき', () {
          setUp(() {
            final paymentData = PaymentData(cancelled: false);

            when(mockAPI.getPaymentData()).thenAnswer((_) async => paymentData);
          });

          group('ユーザーが課金購読しているとき', () {
            setUp(() {
              final user = User(
                id: 1,
                subscriptionTypeId: SubscriptionTypeID.year,
              );

              when(mockAPI.getCurrentUserInfo()).thenAnswer((_) async => user);
            });

            test('falseになる', () async {
              final notifier = SubscriptionPlanNotifier(
                mockAPI,
                MockTopAppState(),
                MockDialogUtil(),
              );

              await notifier.setUserInfo();
              await notifier.setPaymentData();

              expect(notifier.isSubscribed(), false);
            });
          });

          group('ユーザーが課金購読していないとき', () {
            setUp(() {
              final user = User(
                id: 1,
                subscriptionTypeId: SubscriptionTypeID.free,
              );

              when(mockAPI.getCurrentUserInfo()).thenAnswer((_) async => user);
            });

            test('false になる', () async {
              final notifier = SubscriptionPlanNotifier(
                mockAPI,
                MockTopAppState(),
                MockDialogUtil(),
              );

              await notifier.setUserInfo();
              await notifier.setPaymentData();

              expect(notifier.isSubscribed(), false);
            });
          });
        });
      });
    },
  );
}
```

基本的にテストの内容としては、if 文などの条件分岐や try catch でのエラーハンドリングパターンの数だけテストコードを書いています。条件の説明を group に渡し、その条件下の期待結果を test の説明文に書くフォーマットに沿って書いています。その条件を意図的に決めた条件下でテストを行うために、`setUp` ( jest などのテスティングフレームワークでよくある beforeEach ）のテスト開始のライフサイクルで意図した処理になるよう、モック処理を StateNotifier に渡します。そして、test のブロックの中でテストしたい処理を実行し、返り値が期待しているものか、またはそのモック処理が内部で呼ばれたか呼ばれていないかのアサーションを書くなどしてテストを書きます。

今回モック生成のライブラリで mockito を採用しています。mockito ではモック生成が簡単で、テストファイルに `@GenerateMocks` にモックしたい処理のクラスたちを渡し、テストファイルにモックファイルのパスを含めた状態で下のコマンドを実行する必要になります。今回は API や他の StateNotifier 、ダイヤログ表示の Util たちをモックしたいため、その3つのクラスを渡しています。

build_runner のコマンド

```bash
$ fvm flutter pub run build_runner build --delete-conflicting-outputs
```

生成されたモックファイル

```dart [tests/pages/subscription_plan/subscription_plan_notifier_test.mocks.dart]
// Mocks generated by Mockito 5.2.0 from annotations
// in lib_core/test/pages/point/point_notifier_test.dart.
// Do not manually edit this file.

import 'dart:async' as _i24;

// 長いため省略...
```

詳しいモックの仕方は mockito のドキュメントに書かれてあるためこちらでは割愛します。基本的は API のつなぎ込みの部分で固定のレスポンスが取得できるようにしたモッククラスを StateNotifier インスタンスを生成するところに渡してあげれば、内部でその固定されたレスポンスが渡ってくるようになります。

### 2. CI で常にテストが通ることを確認できる体制を作る

関わっているプロジェクトでは、CI に Github Actions を採用しています。書いたテストたちが常に通ることを確認できる体制するため、Pull Request を作成したことやコミットが追加されたことをトリガーにして、テストを実行する Github Actions を用意しています。

```yaml [.github/workflows/test.yml]
name: test

on:
  push:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 1
      - uses: subosito/flutter-action@v2.7.1
        with:
          channel: "stable"
          flutter-version: "2.10.5"
      - run: flutter pub get
      - run: flutter test test
```

### 3. ガイドラインの追加

ただテストを導入し、CI でテストを通す体制作っただけではチームにテストを書いていく文化が広まっていきません。また新しいチームメンバーへ向けてのテストを書いていく敷居を下げたり、既存メンバーともテストを書くのも認識を合わせながらテストが書けることを目指して、社内ドキュメントにガイドラインをまとめました。

![ガイドライン](/content/state-notifier-unit-test/guideline.png)

主な記載内容としては、テストを書く目的やテストを書く上で意識したほうがいいこと、テストの書き方やモックファイルの生成や困ったこととそれを解決したかの TIPSなど、テストを書く上で必要なことはすべてここを見ればわかるものを用意しました。特に目的を意識した上でテストを書いていくことが重要であるため、上で書いたモチベーションについては詳細に書き、チーム全体で問題の解決にあたろうとしました。

書き方については、以下のように条件下での期待値がどうなっているのを一目見てわかるとベターということも書き、チーム全体で統一感があるテストコードを書きレビューしやすくしています。

```dart
group('Aのとき', () {
  test('hogeなこと', () {
    // ...
  })
})
```

さらに最初は自分がベースになるガイドラインを書きましたが、チーム全員で内容を日々ブラッシュアップしているため、知見が共有されています。

## 詰まったこと

### モックできるメソッドはインスタンスメソッドのみ
mockito の仕様上、static メソッドを mock することができないため、モックしたいメソッドがあるときはそのメソッドは static から instance メソッドにする必要があります。

static メソッドでもモックできないかを調べたところ、 [How to mock static methods? #214](https://github.com/dart-lang/mockito/issues/214) の issue が見つかり、やはり static メソッドをモック化できないことがわかったため、テスト対象のファイルがモックしたい static メソッドを呼んでいる場合は、instance メソッドに変更しましょう。

## 終わりに

いかがだったでしょうか？以上のことを行い、チーム全体で StateNotifier に多く書かれているロジックについてのテストコードを書いていき、テストがない開発体制で起こりうる問題を少しずつ解決しようとしています。

また、StateNotifier と mockito を組み合わせたユニットテストのサンプルや知見が少なかったため、このように記事をまとめてました。Riverpod の StateNotifier をプロダクトに採用している人の参考になれば幸いです。

このようにテストを書ける体制に次の目標としては、カバレッジの計測を考えています。テストを書いていくことは大事という気持ちはあるのですが、モチベーションをキープするのは実際に難しいと感じることが多いです。モチベーションを落とさず開発の一環として取り入れるために、現状どれぐらいの進捗で進んでいるのかを共有し、テストを書いた分だけ数値をあげる体制になると、チームメンバーのテストへの意欲も高まるのではないかと考えています。

長くなりましたが、ここまでのご精読ありがとうございました。
