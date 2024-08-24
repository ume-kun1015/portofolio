---
title: '【Google Apps Script】ES6を使ったGoogle Apps Scriptの開発'
description: 'Google Apps Script で ES6 の JavaScript で開発するときの Tips です。'
category: ['tech', 'Google App Scripts']
date: "2017-05-03"
---

## 記事を書こうと思った理由
 - ある日、GASでの開発をしていたとき、
    - 自分「レビューお願いします。」
    - 上司「ES6のほうがわかりやすいから、そっちで書いてみようぜ」
    - 自分「え、GASって、ES6対応しているのかな...？ 」
 - こうして、少しググってみて、あまり情報源がないことを知ったため、記事にまとめようと思いました。　

## 準備するもの
 - npmでライブラリをインストールできる環境。
  - node.jsは、ndenvでインストールするのがおすすめです。
 - GASファイル。

## 今回使うプログラムの例
 - 簡単に、セルの背景の色を変更するGASファイルを作っていこうと思っています。
 - 毎日、決められた色の中で、ランダムにセルの背景の色を変えるGASファイルです。

```js [ChangeColor.js]:
class ChangeColor{
    constructor(color){
        this.parent_sheet = SpreadsheetApp.openById(親シートのID);
        this.source_sheet = this.parent_sheet.getSheetByName(子シートの名前);
        this.color = color;
    }

    changeBackgroundColor(){
        let range = this.source_sheet.getRange("A1:A3");
        range.setBackgroundColor(this.color);
    }
}

// GASファイルのトリガーにセットする関数です。
function trigger(){
    let  color_array = ['red', 'blue', 'green'];
    let random_number = [Math.floor(Math.random()*color_array.length)];
    let trigger = new ChangeColor(color_array[random_number]);
    trigger.changeBackgroundColor();
}
```

JSでクラスがかけるようになったのは、本当に魅力的で、感動です...!
しかし！ 案の定、GASファイルは、ES6に対応せず、上の書き方だと、エラーを起こしてしまいます...。
そこで、上のファイルをクラスを用いた方法で書かれていないJSに変換する必要があります。
今から、それを書いていきます。

## ファイル変換環境準備

npmの必要なライブラリのインストール
ローカルに作業ディレクトリを作成し、そのなかで、下のコマンドを入力し、必要なライブラリをインストールしてください。

```bash
$ npm install --save-dev babel-cli babel-preset-latest browserify babelify gasify
```
次に、.babelrcという設定ファイルに下の１行を入れます。

```bash
$ echo '{ "presets": ["latest"] }' > .babelrc
```

これで、環境の準備は整いました。

## ES6からGASファイルに変換

そして、ファイルを変更。ここを一番に気をつけて欲しく、クラスとトリガーにセットする関数で、ファイルを分けていただきたいです。

```js [ChangeColor.js]
export class ChangeColor{
    constructor(color){
        this.parent_sheet = SpreadsheetApp.openById(親シートのID);
        this.source_sheet = this.parent_sheet.getSheetByName(子シートの名前);
        this.color = color;
    }

    changeBackgroundColor(){
        let range = this.source_sheet.getRange("A1:A3");
        range.setBackgroundColor(this.color);
    }
}
```

```js [trigger.js]
// fromのあとには、ChangeColorファイルのパスを書いてください
import {ChangeColor} from './ChangeColor';

global.trigger = function() {
    let color_array = ['red', 'blue', 'green'];
    let random_number = [Math.floor(Math.random()*color_array.length)];
    let trigger = new ChangeColor(color_array[random_number]);
    trigger.changeBackgroundColor();
};

```

最後に、下のコマンドで、上のChangeColor.jsを変換。

```bash
$ browserify -t babelify -p gasify trigger.jsのパス -o 変換後のコードを書き込むファイルへのパス
```

## 変換後

```js [trigger.js]
var global = this;function trigger() {
}(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ChangeColor = exports.ChangeColor = function () {
    function ChangeColor(color) {
        _classCallCheck(this, ChangeColor);

        this.parent_sheet = SpreadsheetApp.openById(親シートのID);
        this.source_sheet = this.parent_sheet.getSheetByName('src');
        this.color = color;
    }

    _createClass(ChangeColor, [{
        key: 'changeBackgroundColor',
        value: function changeBackgroundColor() {
            var range = this.source_sheet.getRange("A1:A3");
            range.setBackgroundColor(this.color);
        }
    }]);

    return ChangeColor;
}();

},{}],2:[function(require,module,exports){
(function (global){
'use strict';

var _ChangeColor = require('./ChangeColor');

global.trigger = function () {
    var color_array = ['red', 'blue', 'green'];
    var random_number = [Math.floor(Math.random() * color_array.length)];
    var trigger = new _ChangeColor.ChangeColor(color_array[random_number]);
    trigger.changeBackgroundColor();
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./ChangeColor":1}]},{},[2]);
```

これで、es6で書いたファイルでも、GASで読み込んでくれるファイルの完成です！上の変換後のファイルをGASファイルにペーストし、trigger関数を動かせば、セルの色は、変化していきます！


![スクリーンショット 2017-05-03 15.23.27.png](https://qiita-image-store.s3.amazonaws.com/0/152032/7a0bcbe2-d882-db46-a718-a5302c8e88c1.png)![スクリーンショット 2017-05-03 15.29.45.png](https://qiita-image-store.s3.amazonaws.com/0/152032/49f60241-c98b-07ff-9f74-18c49955d055.png)
![スクリーンショット 2017-05-03 15.33.41.png](https://qiita-image-store.s3.amazonaws.com/0/152032/c5dbeeb6-7746-d827-dee7-83fe9e42d6d8.png)


HAPPY GAS LIFE!!!!!!!
