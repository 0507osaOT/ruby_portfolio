# config/initializers/assets.rb

Rails.application.config.assets.version = "1.0"

Rails.application.config.assets.precompile += %w( 
  admin/calendar-styles.css 
  admin/index-schedule.css
  admin/list-styles.css
  admin/reservations.css 
  calendar-script.js
  index-schedule.js
  devise.css
)