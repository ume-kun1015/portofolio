---
title: '【Google Calendar/Slack/Ruby】Ruby でシフトリマインドスクリプトを書いてみた。'
description: 'リマインドのために、Google Calendarで管理されているシフトをスラックで連絡するスクリプトを書いてみました。'
categories: ['Tech', 'Ruby']
publishedAt: "2017-11-06"
updatedAt: "2017-11-06"
---

## 前書き

  - ある日、シフトを忘れていた人がいたため、リマインドのために、Google Calendarで管理されているシフトをスラックで連絡するスクリプトを書いてみました。
  - 好きな言語がRubyなので、RubyでGoogle CalendarのAPIとSlackのAPIを叩いてやってみました。
  - 結構学べることがあったので、思い切ってメモに残そうと思います。

## 1. 必要なgemのインストール

```ruby [Gemfile]
source 'https://rubygems.org'

git_source(:github) do |repo_name|
  repo_name = "#{repo_name}/#{repo_name}" unless repo_name.include?("/")
  "https://github.com/#{repo_name}.git"
end

# DEBUG
gem 'pry'
gem 'pry-byebug'

# FUNDAMENTAL
gem 'dotenv'

# GOOGLE API CLIENT
gem 'google-api-client'

# SLACK NOTIFICATION
gem 'slack-notifier'

# ENUM
gem 'ruby-enum'
```

```bash
$ bundle install
```

## 2 Google Cloud Platformでの設定

1. Google Calendar APIを有効し、無効になると表示されれば、OK

2. 次に認証情報 -> 認証情報を作成 -> OAuthクライアントID -> その他 -> 認証情報があるjsonを`client_secret.json`という名前で、ダウンロードし、保存する。

## 3. 認証を行なっていく

下の `authorize` メソッドを動かし、Webページに表示されるハッシュ値をコンソールに貼り付ければ、今後APIを叩くことができます。下のコードは、googleの公式にquickstartのページにあるコードを参考にしました。

```ruby [google_authentication.rb]
require 'fileutils'
require 'google/apis/calendar_v3'
require 'googleauth'
require 'googleauth/stores/file_token_store'

class GoogleAuthentication
  SCOPE               = Google::Apis::CalendarV3::AUTH_CALENDAR_READONLY
  OOB_URI             = 'urn:ietf:wg:oauth:2.0:oob'
  CLIENT_SECRETS_PATH = 'client_secret.json'
  CREDENTIALS_PATH    = File.join(Dir.pwd, '.credentials', 'calendar_ruby_sample_quickstart.yaml')

  def self.access_to_calendar_service
    Google::Apis::CalendarV3::CalendarService.new
  end

  def self.authorize
    FileUtils.mkdir_p(File.dirname(CREDENTIALS_PATH))
    client_id = Google::Auth::ClientId.from_file(CLIENT_SECRETS_PATH)
    token_store = Google::Auth::Stores::FileTokenStore.new(file: CREDENTIALS_PATH)
    authorizer = Google::Auth::UserAuthorizer.new(client_id, SCOPE, token_store)
    user_id = 'default'
    credentials = authorizer.get_credentials(user_id)
    if credentials.nil?
      url = authorizer.get_authorization_url(base_url: OOB_URI)
      puts "Open the following URL in the browser and enter the " +
               "resulting code after authorization"
      puts url
      code = gets
      credentials = authorizer.get_and_store_credentials_from_code(
          user_id: user_id, code: code, base_url: OOB_URI)
    end

    credentials
  end
end
```

## 4. アカウントに紐づいている全てのカレンダーを取得する

<!-- markdownlint-disable MD033 -->
<img width="1440" alt="スクリーンショット 2017-11-06 22.18.42.png" src="https://qiita-image-store.s3.amazonaws.com/0/152032/fc1c44ee-8df2-32a7-9499-607488e7f77b.png">

ここで、結構引っかかりました。上のgoogleのサンプルコードは、アカウントがデフォルトで持っているカレンダーのイベント(青色のイベント)しか引っ張ってこないです。「え、アカウント上で作ったカレンダーの情報って、どうやって引っ張ってくるんだ？」と思い、ソースコード(`Google::Apis::CalendarV3::Service` クラス) を実際に読んでみると、

```ruby [service.rb]
 def list_calendar_lists(max_results: nil, min_access_role: nil, page_token: nil, show_deleted: nil, show_hidden: nil, sync_token: nil, fields: nil, quota_user: nil, user_ip: nil, options: nil, &block)
　　　　command =  make_simple_command(:get, 'users/me/calendarList', options)
  ...
 end
```

むむっ！　`get`と`me`って書いてあって、`calendarList` ってある！
試しにやってみたら、思った通り、複数のカレンダーのシフト（イベント）が取得されました。
gem内のコードを読むのは、大事だな〜と新卒の始めの時期に改めて思いました。
ログインしているアカウントのデフォルトのカレンダーには、シフトがないので、 `reject` で、デフォルトのカレンダーのidを省きます。

```ruby [calendar.rb]
require 'rubygems'
require 'dotenv'
require 'pry'
require './util/google_authentication'
require '../v2/calendar_item'

Dotenv.overload

class Calendar
  @@calendar = Util::GoogleAuthentication.access_to_calendar_service

  def ids
    @@calendar.list_calendar_lists.items.reject{ |calendar| calendar.id == ENV['GMAIL_ACCOUNT'] }.map(&:id)
  end
end
```

## 5. イベントを全取得して、次の日のシフトをフィルターを通して、取得する

```ruby [google_calendar.rb]
require 'rubygems'
require 'dotenv'
require 'pry'
require './util/google_authentication'
require '../v2/calendar_item'

class Calendar
  # Get items
  # @return GoogleCalendarItem[]
  class << self
    def shifts_tomorrow
      tomorrow_shifts = []
      ids.each { |calendar_id|
        @@calendar.list_events(calendar_id).items.each { |event|
          calendar_item = CalendarItem.new( { calendar_name: event.summary, start_time: event.start.date_time } )
          tomorrow_shifts.push(calendar_item) if calendar_item.tomorrow_shift?
        }
      }
      tomorrow_shifts
    end

    private
    def ids
      @@calendar.list_calendar_lists.items.reject{ |calendar| calendar.id == ENV['GMAIL_ACCOUNT'] }.map(&:id)
    end
  end
end

```

## 6. 取得したイベントのクラスを定義する

```ruby [util/array_iterator.rb]
require '../v2/mentor_registry'

# Data object to wrap and carry an item originally from Google Calendar.
class CalendarItem

  # Constructor
  # @return CalendarItem
  def initialize(calendar_item)
    @calendar_item = calendar_item
  end

  # Return a mentor who is a participant of this calendar item.
  # @return Mentor
  def mentor
    MentorRegistry.instance.find_by_name(calendar_name)
  end

  # Return a calendar_name assigned to the item.
  # In this application, the calendar_name is always a name for a mentor.
  # @return String
  def calendar_name
    @calendar_item[:calendar_name]
  end

  # Return when the item starts.
  # @return String
  def start_time
    @calendar_item[:start_time].strftime('%m/%d %H:%M')
  end

  # Checks if calendar_item is a tomorrow_shift
  # @return Boolean
  def tomorrow_shift?
    start_time_nil? && between_today_and_tomorrow?
  end

  private
  # Checks if the calendar item object does not have any start_time in it.
  # @return Boolean
  def start_time_nil?
    !@calendar_item[:start_time].nil?
  end

  # Checks if the calendar item is from today to tomorrow.
  # @return Boolean
  def between_today_and_tomorrow?
    current_time = DateTime.now
    @calendar_item[:start_time].between?(current_time, current_time + 1)
  end
end
```

## 7. シフトに入っている人のデータを管理するクラスを定義

一つのインスタンスしか生成されたくなかったので、シングルトンパターンで書きました。

```ruby [mentor_registry.rb]
require 'yaml'
require 'pry'
require 'singleton'
require '../v2/mentor'

# List of Mentors
class MentorRegistry
  include Singleton
  MENTOR_CONFIG_FILENAME = 'mentors.yml'

  # Factory, setup registry
  # @return MentorRegistry
  def initialize
    @settings = YAML.load_file(MENTOR_CONFIG_FILENAME)
    @list = {}
  end

  # Find mentors who has a specific name
  # @return Mentor
  def find_by_name(name)
    @list[name] ||= Mentor.new(@settings[name])
  end
end
```

## 8. シフトに入っている人のクラスを定義

```ruby [mentor.rb]
# Mentor
class Mentor

  # Constructor
  # @param [Hash] data The hash variable that has mentor info in it.
  # @return Mentor
  def initialize(data)
    @data = data
  end

  # Return the mention on slack in data instance variable.
  # @return String
  def mention
    @data['mention']
  end

  # Check if his/her birth day is a day before the given date.
  # @return boolean
  def day_before_birthday?
    @data['birthday'] == (Date.today+1).strftime('%m/%d')
  end
end
```

## 9. 最後にスラックに送信

```ruby [slack_for_notifiacation.rb]
require 'rubygems'
require 'pry'
require '../v2/util/slack_notifier'
require '../v2/calendar_item'

# Slack
class SlackForNotification

  STARTER_NOTIFICATION      = '明日のシフトはこちら！'
  HOPING_REACTION_STATEMENT = '`こちらにメンションがついている方は今日23時までに必ず本通知にリアクション` をお願いします!'
  NO_SHIFT_STATEMENT        = '明日のシフトはありません！'
  BIRTHDAY_STATEMENT        = 'そして、なんと明日誕生日のメンターが!!! そのメンターは...!!!'
  CELERATION_ENCOURAGEMENT_STATEMENT = '明日会ったときに、「誕生日おめでとう」と言おう！'

  @notifier = SlackNotifier.notifier

  class << self
    def sends_starter_notification
      @notifier.post(text: STARTER_NOTIFICATION)
      @notifier.post(text: HOPING_REACTION_STATEMENT)
    end

    def sends_shift_notification(mention:, calendar_name:, start_time:)
      notification = "<#{mention}> : #{calendar_name} : #{start_time}"
      @notifier.post(text: notification)
    end

    def sends_birthday_notification(mention:, calendar_name:)
      @notifier.post(text: "#{BIRTHDAY_STATEMENT}")
      @notifier.post(text: "<#{mention}>#{calendar_name}　:tada: :tada:")
      @notifier.post(text: CELERATION_ENCOURAGEMENT_STATEMENT)
    end

    def sends_no_shift_notification
      @notifier.post(text: NO_SHIFT_STATEMENT)
    end
  end
end
```

```ruby [slack_notifier.rb]
require 'slack-notifier'

# Slack Notifier
class SlackNotifier
  @notifier = nil

  def self.notifier
    @notifier ||= Slack::Notifier.new(ENV['TIMES_JIO_SLACK_WEBHOOK_URL'], username: 'TECH::CAMP WASEDA SHIFT REMINDER')
  end

  def self.post(text:)
    @notifier.post(text: text)
  end
end
```

## 8. crontab で、毎日通知がくるように

```ruby [main_script.rb]
require 'rubygems'
require 'yaml'
require 'pry'
require 'dotenv'
require '../v2/mentor_registry'
require '../v2/calendar'
require '../v2/calendar_item'
require '../v2/slack_for_notification'

shifts_tomorrow = Calendar.shifts_tomorrow

if shifts_tomorrow.empty?
  SlackForNotification.sends_no_shift_notification
else
  SlackForNotification.sends_starter_notification

  shifts_tomorrow.each do |calendar_item|
    SlackForNotification.sends_shift_notification(
        mention:       calendar_item.mentor.mention,
        calendar_name: calendar_item.calendar_name,
        start_time:    calendar_item.start_time
    )
  end
end
```

```bash [cron_script.bash]
#!/usr/bin/env bash

export PATH="$HOME/.rbenv/bin:$PATH"
eval "$(rbenv init -)"

bundle exec ruby main_script.rb
```

```bash [crontab]
➜  ~ crontab -l
CRON_TZ=Asia/Tokyo

30 22 * * * cd /home/user_name/RubyAlgorithm/notification_on_slack && sh ./cron_script.sh >> /home/user_name/RubyAlgorithm/notification_on_slack/text.txt  2>&1
```

## 10. こうなりました

<img width="398" alt="スクリーンショット 2017-11-06 22.33.39.png" src="https://qiita-image-store.s3.amazonaws.com/0/152032/902aaa92-c6ac-b9c7-dc89-acfa69219dd5.png">

## まとめ

  - 上にも書きましたが、gem内のコードを読むことで、得られることがものすごく多いなと気づきました。
  - これで、シフトを忘れる人が出てきませんように！
  - 全てのコードは下にあります！
    - <https://github.com/r-ume/RubyAlgorithm/tree/master/notification_on_slack>
  - 最後まで読んでいただき、ありがとうございました！
