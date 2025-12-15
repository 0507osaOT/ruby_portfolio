class AddPhoneNumberToAdmins < ActiveRecord::Migration[8.0]
  def change
    add_column :admins, :phone_number, :string
  end
end
