require "test_helper"

class Admin::ReservationsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get admin_reservations_index_url
    assert_response :success
  end

  test "should get calendar" do
    get admin_reservations_calendar_url
    assert_response :success
  end

  test "should get available_slots" do
    get admin_reservations_available_slots_url
    assert_response :success
  end
end
