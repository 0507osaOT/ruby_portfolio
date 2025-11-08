class CreateReservations < ActiveRecord::Migration[8.0]
  def change
    create_table :reservations do |t|
      t.datetime :start_time
      t.datetime :end_time
      t.string :customer_name
      t.string :customer_email
      t.string :customer_phone
      t.text :notes
      t.string :status

      t.timestamps
    end
  end
end
