class ApplicationMailer < ActionMailer::Base
  default from: "onboarding@resend.dev" # 無料の場合はこのアドレスを使用
  layout "mailer"
end
