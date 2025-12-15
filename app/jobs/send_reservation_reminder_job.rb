class SendReservationReminderJob < ApplicationJob
  queue_as :default

  def perform(reservation_id)
    reservation = Reservation.find(reservation_id)
    ReservationMailer.reminder_email(reservation).deliver_now
  end
end

