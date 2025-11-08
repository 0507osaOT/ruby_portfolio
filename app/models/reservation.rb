class Reservation < ApplicationRecord
  belongs_to :user, optional: true
  
  validates :start_time, :end_time, :customer_name, presence: true
  validate :capacity_limit, :within_business_hours
  
  # 同時間帯の予約数制限
  MAX_CAPACITY = 3
  
  scope :on_date, ->(date) {
    where('DATE(start_time) = ?', date)
  }
  
  scope :between, ->(start_time, end_time) {
    where('start_time < ? AND end_time > ?', end_time, start_time)
  }
  
  # 特定の時間帯の予約
  scope :at_time_slot, ->(start_time, end_time) {
    where(start_time: start_time, end_time: end_time)
  }
  
  # 時間が重なる予約を取得
  scope :overlapping, ->(start_time, end_time) {
    where('start_time < ? AND end_time > ?', end_time, start_time)
  }
  
  # 時間が重なるかどうかを判定
  def overlaps?(other)
    start_time < other.end_time && end_time > other.start_time
  end
  
  # 重なる予約を異なる枠に割り当てる（グラフ彩色アルゴリズム）
  def self.assign_slot_indices(reservations)
    return {} if reservations.empty?
    
    # 予約を開始時間順にソート
    sorted_reservations = reservations.sort_by { |r| [r.start_time, r.created_at, r.id] }
    slot_assignments = {}
    
    sorted_reservations.each do |reservation|
      # この予約と重なる既に割り当て済みの予約を取得
      overlapping_reservations = sorted_reservations.select do |r|
        r.id != reservation.id && 
        slot_assignments.key?(r.id) && 
        reservation.overlaps?(r)
      end
      
      # 使用されている枠番号を取得
      used_slots = overlapping_reservations.map { |r| slot_assignments[r.id] }.compact.uniq.sort
      
      # 使用可能な最小の枠番号を見つける
      slot_index = 0
      used_slots.each do |used_slot|
        if slot_index == used_slot
          slot_index += 1
        else
          break
        end
      end
      
      slot_assignments[reservation.id] = slot_index
    end
    
    slot_assignments
  end
  
  # FullCalendar用のJSON形式
  def to_fullcalendar_event(slot_index = nil)
    # slot_indexが指定されていない場合は、同じ時間帯の予約から計算
    if slot_index.nil?
      slot_reservations = Reservation.at_time_slot(start_time, end_time).order(:created_at, :id)
      slot_index = slot_reservations.index(self) || 0
    end
    
    {
      id: id,
      title: customer_name,
      start: start_time.iso8601,
      end: end_time.iso8601,
      resourceId: (slot_index + 1).to_s,
      extendedProps: {
        email: customer_email,
        phone: customer_phone,
        notes: notes,
        status: status || 'confirmed',
        slot_index: slot_index,
        user_id: user_id
      }
    }
  end
  
  # ★★★ Ransack用の設定（ここに追加）★★★
  def self.ransackable_attributes(auth_object = nil)
    [
      "id",
      "customer_name",
      "customer_email",
      "customer_phone",
      "start_time",
      "end_time",
      "status",
      "notes",
      "created_at",
      "updated_at"
    ]
  end
  
  def self.ransackable_associations(auth_object = nil)
    []
  end
  # ★★★ ここまで追加 ★★★
  
  private
  
  # 容量チェック：同じ時間帯に3組まで
  def capacity_limit
    return if start_time.blank? || end_time.blank?
    
    overlapping_count = Reservation.where.not(id: id)
                                   .at_time_slot(start_time, end_time)
                                   .count
    
    if overlapping_count >= MAX_CAPACITY
      errors.add(:base, "この時間帯は既に#{MAX_CAPACITY}組の予約で満員です")
    end
  end
  
  def within_business_hours
    return if start_time.blank? || end_time.blank?
    
    business_start = start_time.change(hour: 9, min: 0)
    business_end = start_time.change(hour: 18, min: 0)
    
    unless start_time >= business_start && end_time <= business_end
      errors.add(:base, '営業時間外です（9:00-18:00）')
    end
    
    # 10分刻みでのみ予約可能
    unless [0, 10, 20, 30, 40, 50].include?(start_time.min) && [0, 10, 20, 30, 40, 50].include?(end_time.min)
      errors.add(:base, '予約は10分刻みでお願いします（例: 9:10-10:10）')
    end
    
    # 終了時間が開始時間より後であることを確認
    if end_time <= start_time
      errors.add(:base, '終了時間は開始時間より後である必要があります')
      return
    end
    
    # 予約時間の長さを確認（1時間以上、最大9時間まで）
    duration = (end_time - start_time) / 3600.0
    if duration < 1.0
      errors.add(:base, '予約は最低1時間以上必要です')
    elsif duration > 9.0
      errors.add(:base, '予約は最大9時間までです')
    end
  end
end