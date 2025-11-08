# frozen_string_literal: true

class AdminReservationPolicy < ApplicationPolicy
  # 管理者のみがアクセス可能
  def index?
    admin?
  end

  def show?
    admin?
  end

  def create?
    admin?
  end

  def new?
    admin?
  end

  def update?
    admin?
  end

  def edit?
    admin?
  end

  def destroy?
    admin?
  end

  def calendar?
    admin?
  end

  def calendars?
    admin?
  end

  def calendar_events?
    admin?
  end

  def available_slots?
    admin?
  end

  def list?
    admin?
  end

  def confirm?
    admin?
  end

  def cancel?
    admin?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      # 管理者のみが予約を閲覧可能
      if user.present? && user.admin?
        scope.all
      else
        scope.none
      end
    end
  end
end

