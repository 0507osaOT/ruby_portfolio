# DBテーブル一覧

## 1. usersテーブル（ユーザー管理）

| カラム名 | データ型 | デフォルト値 | NULL許可 | インデックス種別 | 項目名 | 備考 |
|---------|---------|------------|---------|----------------|--------|------|
| id | bigint | AUTO_INCREMENT | NOT NULL | PRIMARY | ユーザーID | ログイン用のユニークID |
| email | varchar(255) | '' | NOT NULL | UNIQUE | メールアドレス | ログインに使用するメールアドレス |
| encrypted_password | varchar(255) | '' | NOT NULL | - | 暗号化パスワード | ハッシュ化されたパスワード |
| reset_password_token | varchar(255) | NULL | NULL | UNIQUE | パスワードリセットトークン | パスワードリセット用のトークン |
| reset_password_sent_at | datetime | NULL | NULL | - | パスワードリセット送信日時 | パスワードリセットメール送信日時 |
| remember_created_at | datetime | NULL | NULL | - | ログイン状態保持日時 | 「ログイン状態を保持する」機能の日時 |
| admin | boolean | false | NOT NULL | - | 管理者フラグ | 一般ユーザー(false)または管理者(true) |
| name | varchar(255) | NULL | NULL | - | ユーザー名 | 表示用のユーザー名 |
| phone_number | varchar(255) | NULL | NULL | - | 電話番号 | ユーザーの電話番号 |
| created_at | datetime | CURRENT_TIMESTAMP | NOT NULL | - | 作成日時 | レコード作成日時 |
| updated_at | datetime | CURRENT_TIMESTAMP | NULL | NULL | 更新日時 | レコード更新日時 |

## 2. adminsテーブル（管理者管理）

| カラム名 | データ型 | デフォルト値 | NULL許可 | インデックス種別 | 項目名 | 備考 |
|---------|---------|------------|---------|----------------|--------|------|
| id | bigint | AUTO_INCREMENT | NOT NULL | PRIMARY | 管理者ID | 管理者のユニークID |
| email | varchar(255) | '' | NOT NULL | UNIQUE | メールアドレス | ログインに使用するメールアドレス |
| encrypted_password | varchar(255) | '' | NOT NULL | - | 暗号化パスワード | ハッシュ化されたパスワード |
| reset_password_token | varchar(255) | NULL | NULL | UNIQUE | パスワードリセットトークン | パスワードリセット用のトークン |
| reset_password_sent_at | datetime | NULL | NULL | - | パスワードリセット送信日時 | パスワードリセットメール送信日時 |
| remember_created_at | datetime | NULL | NULL | - | ログイン状態保持日時 | 「ログイン状態を保持する」機能の日時 |
| phone_number | varchar(255) | NULL | NULL | - | 電話番号 | 管理者の電話番号 |
| created_at | datetime | CURRENT_TIMESTAMP | NOT NULL | - | 作成日時 | レコード作成日時 |
| updated_at | datetime | CURRENT_TIMESTAMP | NULL | NULL | 更新日時 | レコード更新日時 |

## 3. reservationsテーブル（予約管理）

| カラム名 | データ型 | デフォルト値 | NULL許可 | インデックス種別 | 項目名 | 備考 |
|---------|---------|------------|---------|----------------|--------|------|
| id | bigint | AUTO_INCREMENT | NOT NULL | PRIMARY | 予約ID | 予約のユニークID |
| user_id | bigint | NULL | NULL | INDEX, FOREIGN KEY | ユーザーID | usersテーブルへの外部キー（予約作成者のユーザーID） |
| start_time | datetime | NULL | NULL | - | 予約開始日時 | 予約の開始日時（営業時間: 9:00-18:00、10分刻み） |
| end_time | datetime | NULL | NULL | - | 予約終了日時 | 予約の終了日時（最低1時間、最大9時間） |
| customer_name | varchar(255) | NULL | NULL | - | 顧客名 | 予約者の氏名 |
| customer_email | varchar(255) | NULL | NULL | - | 顧客メールアドレス | 予約者のメールアドレス |
| customer_phone | varchar(255) | NULL | NULL | - | 顧客電話番号 | 予約者の電話番号 |
| notes | text | NULL | NULL | - | 備考 | 予約に関する備考・メモ |
| status | varchar(255) | NULL | NULL | - | 予約ステータス | 予約の状態（confirmed: 確定、cancelled: キャンセルなど） |
| reminder_sent_at | datetime | NULL | NULL | - | リマインダーメール送信日時 | リマインダーメールが送信された日時（重複送信防止用） |
| created_at | datetime | CURRENT_TIMESTAMP | NOT NULL | - | 作成日時 | 予約作成日時 |
| updated_at | datetime | CURRENT_TIMESTAMP | NULL | NULL | 更新日時 | 予約更新日時 |

## テーブル間のリレーション

- **reservations.user_id** → **users.id** (外部キー制約)
  - 予約はユーザーに紐づく（オプショナル）
  - ユーザーが削除された場合、関連する予約のuser_idはNULLになる

- **email_logs.reservation_id** → **reservations.id** (外部キー制約、オプショナル)
  - メール送信履歴は予約に紐づく（オプショナル）
  - 予約が削除された場合、関連するメールログのreservation_idはNULLになる

- **email_logs.user_id** → **users.id** (外部キー制約、オプショナル)
  - メール送信履歴はユーザーに紐づく（オプショナル）
  - ユーザーが削除された場合、関連するメールログのuser_idはNULLになる

## 主な制約・バリデーション

### reservationsテーブル
- 同じ時間帯（start_time, end_time）に最大3組まで予約可能（MAX_CAPACITY = 3）
- 過去の日時での予約は不可
- 営業時間外（9:00-18:00以外）の予約は不可
- 予約時間は10分刻みのみ
- 予約時間は最低1時間、最大9時間
- 終了時間は開始時間より後である必要がある
- reminder_sent_atはリマインダーメール送信済みフラグとして使用（重複送信防止）

### usersテーブル
- emailはユニーク制約あり
- reset_password_tokenはユニーク制約あり

### adminsテーブル
- emailはユニーク制約あり
- reset_password_tokenはユニーク制約あり

## 4. email_logsテーブル（メール送信履歴管理）※オプション

| カラム名 | データ型 | デフォルト値 | NULL許可 | インデックス種別 | 項目名 | 備考 |
|---------|---------|------------|---------|----------------|--------|------|
| id | bigint | AUTO_INCREMENT | NOT NULL | PRIMARY | メールログID | メール送信履歴のユニークID |
| reservation_id | bigint | NULL | NULL | INDEX, FOREIGN KEY | 予約ID | reservationsテーブルへの外部キー（関連する予約ID） |
| user_id | bigint | NULL | NULL | INDEX, FOREIGN KEY | ユーザーID | usersテーブルへの外部キー（送信先ユーザーID） |
| email_type | varchar(50) | NULL | NULL | INDEX | メール種別 | メールの種類（confirmation: 確認、update: 変更通知、cancellation: キャンセル、reminder: リマインダー） |
| recipient_email | varchar(255) | NULL | NULL | - | 送信先メールアドレス | メールの送信先アドレス |
| subject | varchar(255) | NULL | NULL | - | メール件名 | 送信したメールの件名 |
| sent_at | datetime | CURRENT_TIMESTAMP | NOT NULL | INDEX | 送信日時 | メール送信日時 |
| status | varchar(50) | 'pending' | NOT NULL | INDEX | 送信ステータス | 送信状態（pending: 送信待ち、sent: 送信成功、failed: 送信失敗） |
| error_message | text | NULL | NULL | - | エラーメッセージ | 送信失敗時のエラーメッセージ |
| created_at | datetime | CURRENT_TIMESTAMP | NOT NULL | - | 作成日時 | レコード作成日時 |
| updated_at | datetime | CURRENT_TIMESTAMP | NULL | NULL | 更新日時 | レコード更新日時 |

### email_logsテーブル
- reservation_idはreservationsテーブルへの外部キー（オプショナル）
- user_idはusersテーブルへの外部キー（オプショナル）
- email_type、sent_at、statusにインデックスを設定（検索・集計の高速化）













