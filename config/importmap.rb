# Pin npm packages by running ./bin/importmap

pin "application"
pin "@hotwired/turbo-rails", to: "turbo.min.js"
pin "@hotwired/stimulus", to: "stimulus.min.js"
pin "@hotwired/stimulus-loading", to: "stimulus-loading.js"
pin_all_from "app/javascript/controllers", under: "controllers"

# 既存の設定
pin "index-schedule", to: "index-schedule.js"

# カレンダー用のJavaScriptを追加
pin "calendar-script", to: "calendar-script.js"

# FullCalendar用（CDNから読み込む場合）
pin "fullcalendar", to: "https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js"