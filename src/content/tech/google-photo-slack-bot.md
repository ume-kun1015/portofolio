---
title: '【Google Photo & Slack 写真Bot】GooglePhoto にある写真を取得し、Slack に送信する Bot を作った話'
description: 'Google Photo からランダムに写真を取得し、 Slack に送信する Bot を作ったので、作り方をまとめました'
categories: ['Tech', 'Python']
publishedAt: "2017-10-14"
updatedAt: "2017-10-14"
---

## 前書き

大学生からソフトウェアエンジニアになりたいと思い、プログラミングの独学を開始しました。2017 年 8 月サーバーエンジニアとして入社しました。Rails で開発しております。プログラミング初心者のときから、Qiita を読んでいて、わかりやすい記事を書きたいなっていつかずっと思ったので、わかりやすく書きます。(その分、長くなりますが、ご理解いただければ幸いです。)ここでは、使っている API やモジュールについてまとめます。

## 記事を書こうと思った理由

とある小さな IT ベンチャーのインターン生として働いているものです。CEO から google photo の写真から 1 日 1 枚ランダムで `#random` に流す bot とかあったら盛り上がりそう」との一声がありました。CTO にお願いしていましたが、忙しくしていたのを見て、代わりに自分が作ることになりました。

こうして、写真 Bot を作ることになったが、難しい...と思ったのは、このときまだまだ先の話...。 詰まったことが多いので、記事にしてみることにしました。ちみに Python で書いてます。理由は、個人的に書いたことない言語だったので勉強したいと思ったとの、CTO が Python が好きだからです）

## ゴール

下の写真のように、gallery という bot を呼び出し、`gallery`　と入力したあと、写真が slack に流れるようにすれば問題ありません。

1 つ 1 つ処理を見ていきましょう。

## 手順

1. Slack で、bot ユーザーを作成
2. Python で実装された Bot ライブラリをインストール
3. gdata の module をインストール
4. Google Auth 認証(Google Photo から写真を取得)
5. Rtmbot と Slack API を使って、Slack に文章と写真を投稿。

### 開発環境

  - Python 2.7 (pyenv で開発環境を整えましょう)
  - Amazon EC2

#### 1. Slack で Bot ユーザーを作成

まずは、Slack Apps のページで、Bot ユーザーを作成をします。
赤い長方形で書いたものは、bot のトークンなので、どこか別の場所にコピーしましょう。

<!-- markdownlint-disable MD033 -->
<img width="1363" alt="スクリーンショット 2019-06-22 12.44.19.png" src="https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/152032/2b84bef0-94b5-ded8-217e-b65d5957c818.png">

#### 2. Pythonで実装されたBotライブラリをインストール

  オープンソースの Bot 管理ライブラリを pip 経由で、インストール(<https://github.com/slackapi/python-rtmbot>)

```bash
$ pip install rtmbot
```

そのあと、`rtmbot.conf` を作成し、下のように編集していきます。

```text [rtmbot.conf]
# Add the following to rtmbot.conf
 DEBUG: True # make this False in production

 # 1.のときに作成したBotのトークンをここに書いてください。
 SLACK_TOKEN: "SLACK_TOKEN"

　　# ここには、Botのパスを書いてください。(ディレクトリの名前の間には、/ではなく、 . を書きましょう。)
 ACTIVE_PLUGINS:
     - plugins.google_photo_to_slack.GooglePhotoToSlackBot
```

#### 3. gdataのmoduleをインストール

```bash
$ pip install gdata
```

#### 4. Google OAuth認証(Google Photoから写真を取得)

ここでは、Google OAuth2.0 認証のやり方を説明します。

Google Cloud PlatformDashboard->Use Google APIs->Credentials の順番で、OAuth2.0　Client ID を作成します。その secret json ファイルをダウンロードします。タイプは、「その他」を選択してください。

<!-- markdownlint-disable MD033 -->
<img width="1440" alt="スクリーンショット 2017-08-11 20.19.37.png" src="https://qiita-image-store.s3.amazonaws.com/0/152032/a717d5bc-0774-b674-98d7-3ce6d57c3f11.png">

いろいろと、ファイルが増えてきたなかで、ディレクトリ構造は下のようになります。
`credentials.dat` の中身は、今のところ何も書かなくて大丈夫です。

```text
rtmbot
├── photo-gallery.json
├── credentials.dat
├── plugins
│   ├── __init__.py
│   └── google_photo_to_slack.py
├── rtmbot.conf
└── rtmbot.log
```

最初は、ログインを確かめるために、下のように書いてみましょう。
下のファイルに書かれてあるモジュールで、インストールしていないものがあれば、インストールしましょう。

```python [google_photo_to_slack.py]
#!/usr/bin/python2.7

# module ----
import os
import webbrowser
from datetime import datetime, timedelta
from oauth2client.client import flow_from_clientsecrets
from oauth2client.file import Storage
import gdata.photos.service
import gdata.media
import gdata.geo
import httplib2
import json
import urllib2

# Google Authetication
def OAuth2Login(client_secrets, credential_store, email):
    scope='https://picasaweb.google.com/data/'
    user_agent='picasawebuploader'
    storage = Storage(credential_store)
    credentials = storage.get()

    if credentials is None or credentials.invalid:
        flow = flow_from_clientsecrets(client_secrets, scope=scope, redirect_uri='urn:ietf:wg:oauth:2.0:oob')
        uri = flow.step1_get_authorize_url()
        webbrowser.open(uri)
        code = raw_input('Enter the authentication code: ').strip()
        credentials = flow.step2_exchange(code)
        storage.put(credentials)

    if (credentials.token_expiry - datetime.utcnow()) < timedelta(minutes=5):
        http = httplib2.Http()
        http = credentials.authorize(http)
        credentials.refresh(http)

    gd_client = gdata.photos.service.PhotosService(source=user_agent,
                                               email=email,
                                               additional_headers={'Authorization' : 'Bearer %s' % credentials.access_token})
    return gd_client

# main -----
if __name__ == '__main__':
    email = os.environ['EMAIL']
    confDir = os.path.abspath(os.path.dirname(__file__))
    client_secrets = os.path.join(confDir, 'photo-gallery.json')
    credential_store = os.path.join(confDir, 'credentials.dat')
    gd_client = OAuth2Login(client_secrets, credential_store, email)

    albums = gd_client.GetUserFeed()
    for album in albums.entry:
        print 'Album: %s (%s)' % (album.title.text, album.numphotos.text)

        photos = gd_client.GetFeed('/data/feed/api/user/default/albumid/%s?kind=photo' % (album.gphoto_id.text))
        for photo in photos.entry:
            print(photo.title.text)
            f = open(photo.title.text, 'w')
            f.write(urllib2.urlopen(photo.content.src).read())
            f.close()
```

そして、上のファイルを実行してみると、

```bash
$ python google_photo_to_slack.py
```

下のように、ブラウザには、写真のページが表示され、コンソールにはブラウザに表示されている authentication code を入力せよとのものが出てきます。

```bash
Enter the authentication code:
```

ブラウザに表示される authentication code を入力すれば、ログイン完了です。

もう一度、

```bash
$ python google_photo_to_slack.py
```

を実行すれば、google photo にある写真が全て、ダウンロードされます。

#### 5. RtmbotとSlack APIを使って、Slackに文章と写真を投稿

上の GooglePhotoToSlack ファイルを下のように編集しましょう。

```python [GooglePhotoToSlackBot.py]
class GooglePhotoToSlackBot (Plugin):
    MEDIA_ARR = []
    RANDOM_NUMBER = 0
    EMAIL = os.version['EMAIL']
    CHANNEL_POST = ''
    SLACK_BOT_TOKEN = os.version['SLACK_BOT_TOKEN']

    PLUGIN_CHILD_DIRECTORY = os.path.abspath(os.path.dirname(__file__))
    PLUGIN_DIRECTORY = os.path.abspath(
        os.path.join(PLUGIN_CHILD_DIRECTORY, os.pardir)
    )
    RTMBOT_DIRECTORY = os.path.abspath(
        os.path.join(PLUGIN_DIRECTORY, os.pardir)
    )
    CLIENT_SECRETS = os.path.join(RTMBOT_DIRECTORY, os.version['SECRET_JSON'])
    CREDENTIAL_STORE = os.path.join(
        RTMBOT_DIRECTORY, os.version['CREDENTIAL_DAT']
    )

    def process_message(self, data):
        feedback_pattern = re.compile(
            # ここには、slack users list apiに表示されるUから始まるbotのidを入れてください
            r'.*<@UAAAAAAA.*(gallery).*', re.DOTALL | re.IGNORECASE
        )

        if not (re.match(feedback_pattern, data['text'])):
            return

        self.CHANNEL_POST = data['channel']

        message = u"本日の画像/映像をダウンロードしています！少しお待ち下さい！ "
        message += "動画の場合は、ダウンロードに時間がかかる場合があります。"
        response = self.slack_client.api_call(
            "chat.postMessage",
            channel=self.CHANNEL_POST,
            text=message,
            link_names=1,
            as_user=True
        )

        self.fetch_all_media()
        self.post_random_media()

    def oauth_login(self, client_secrets, credential_store, email):
        scope = 'https://picasaweb.google.com/data/'
        user_agent = 'picasawebuploader'
        storage = Storage(credential_store)
        credentials = storage.get()
        now_time = datetime.utcnow()

        if credentials is None or credentials.invalid:
            flow = flow_from_clientsecrets(
                client_secrets,
                scope=scope,
                redirect_uri='urn:ietf:wg:oauth:2.0:oob'
            )
            uri = flow.step1_get_authorize_url()
            webbrowser.open(uri)
            code = raw_input('Enter the authentication code: ').strip()
            credentials = flow.step2_exchange(code)
            storage.put(credentials)

        if (credentials.token_expiry - now_time) < timedelta(minutes=5):
            http = httplib2.Http()
            http = credentials.authorize(http)
            credentials.refresh(http)

        gd_client = gdata.photos.service.PhotosService(
            source=user_agent,
            email=email,
            additional_headers={
                'Authorization': 'Bearer %s' % credentials.access_token
            }
        )

        return gd_client

    def fetch_all_media(self):
        gd_client = self.oauth_login(
            self.CLIENT_SECRETS,
            self.CREDENTIAL_STORE,
            self.EMAIL
        )

        albums = gd_client.GetUserFeed()
        for album in albums.entry:
            medias = gd_client.GetFeed(
                '/data/feed/api/user/default/albumid/%s' %
                (album.gphoto_id.text)
            )
            for media in medias.entry:
                self.MEDIA_ARR.append(media)

    def get_random_number_in_array(self, arr):
        max_length = len(arr)
        return random.randint(0, max_length)

    def post_random_media(self):
        self.RANDOM_NUMBER = self.get_random_number_in_array(self.MEDIA_ARR)
        media_object = self.MEDIA_ARR[self.RANDOM_NUMBER]
        media_file = open(media_object.title.text, 'wb')
        media_file.write(response.content)
        media_file.close()
        media_path = self.RTMBOT_DIRECTORY + "/" + media_object.title.text

        with open(media_path, 'rb') as f:
            param = {
                'token': self.SLACK_BOT_TOKEN,
                'channels': self.CHANNEL_POST,
                'title': u'Today\'s ' + media
            }
            r = requests.post(
                "https://slack.com/api/files.upload",
                params = param,
                files = {'file': f}
            )
```

そして、rtmbot ディクレトリで、rtmbot コマンドを入力し、rtmbot サーバーを立ち上げます。
そのあと、スラックで、@gallery と入力しましょう。(どのチャンネルでも大丈夫です。)

```bash
$ rtmbot
```

上のコードにある`本日の画像/映像をダウンロードしています！少しお待ち下さい！` と写真がスラックに流れれば、写真 bot の完了です。

## 参考にしたもの

  - [Picasa Web API の Documentation](https://developers.google.com/picasa-web/docs/1.0/developers_guide_python)
  - [Google OAuth の Login のやり方](https://stackoverflow.com/questions/30474269/using-google-picasa-api-with-python)
