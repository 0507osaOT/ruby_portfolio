# frozen_string_literal: true

class ReservationPolicy < ApplicationPolicy
  # 一般ユーザーは自分の予約のみ閲覧可能
  def show?
    user.present? && (record.user_id == user.id || admin?)
  end

  # 一般ユーザーは予約を作成可能
  def create?
    user.present?
  end

  def new?
    create?
  end

  def index?
    user.present?
  end

  def available_slots?
    create?
  end

  def calendar?
    new?
  end

  def calendars?
    new?
  end

  def calendar_events?
    new?
  end

  # 一般ユーザーは自分の予約のみ更新可能
  def update?
    user.present? && (record.user_id == user.id || admin?)
  end

  def edit?
    update?
  end

  # 一般ユーザーは自分の予約のみ削除可能
  def destroy?
    user.present? && (record.user_id == user.id || admin?)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      # 管理者は全ての予約を閲覧可能
      if user.present? && user.admin?
        scope.all
      # 一般ユーザーは自分の予約のみ閲覧可能
      elsif user.present?
        scope.where(user_id: user.id)
      else
        scope.none
      end
    end
  end
end
