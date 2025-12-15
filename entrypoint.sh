#!/bin/bash
set -e # エラーが発生するとスクリプトを終了する意味

# server.pid が存在するとサーバーが起動できない対策のために server.pid を削除するように設定
rm -f /myapp/tmp/pids/server.pid

# データベース接続確認とマイグレーション実行
echo "🔌 データベース接続確認中..."
bundle exec rails db:version 2>/dev/null || echo "データベース未初期化"

echo "📊 データベースマイグレーション実行中..."
bundle exec rails db:migrate

echo "🌱 シードデータ投入中..."
bundle exec rails db:seed 2>/dev/null || echo "シードデータ投入スキップ（重複エラー等）"

echo "✅ データベース初期化完了！"

# DockerfileのCMDで渡されたコマンド（Railsサーバー起動）を実行
exec "$@"