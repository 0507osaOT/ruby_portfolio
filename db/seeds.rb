# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# 管理者ユーザーを作成
admin_user = User.find_or_initialize_by(email: 'admin@example.com')
if admin_user.new_record?
  admin_user.password = 'password123'
  admin_user.password_confirmation = 'password123'
  admin_user.admin = true
  admin_user.save!
  puts "管理者ユーザーを作成しました: #{admin_user.email}"
else
  # 既存のユーザーの場合、パスワードと管理者フラグを更新
  admin_user.password = 'password123'
  admin_user.password_confirmation = 'password123'
  admin_user.admin = true
  admin_user.save!
  puts "管理者ユーザーを更新しました: #{admin_user.email}"
end

# 一般ユーザーを作成
general_user = User.find_or_initialize_by(email: 'sample@gmail.com')
if general_user.new_record?
  general_user.password = 'password'
  general_user.password_confirmation = 'password'
  general_user.admin = false
  general_user.save!
  puts "一般ユーザーを作成しました: #{general_user.email}"
else
  # 既存のユーザーの場合、パスワードを更新
  general_user.password = 'password'
  general_user.password_confirmation = 'password'
  general_user.admin = false
  general_user.save!
  puts "一般ユーザーを更新しました: #{general_user.email}"
end
