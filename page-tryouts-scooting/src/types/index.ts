export interface Player {
  id: string;
  username: string;
  team_category: TeamCategory;
  role: ValorantRole;
  contact_status: ContactStatus;
  rank: ValorantRank | null;
  nationality: string;
  last_contact: Date | null;
  managed_by: string | null;
  contacted_by: string | null;
  notes: string;
  links: string;
  created_at: Date;
  updated_at: Date;
}

export type ContactStatus = 'not_contacted' | 'contacted' | 'tryout' | 'accepted' | 'subs' | 'rejected' | 'left';
export type TeamCategory = 'mens' | 'gc' | 'academy';
export type ValorantRole = 'duelist' | 'initiator' | 'controller' | 'sentinel' | 'flex';
export type ValorantRank = 'ascendant_1' | 'ascendant_2' | 'ascendant_3' | 'immortal_1' | 'immortal_2' | 'immortal_3' | 'radiant';
export type StaffMember = 'Dexter' | 'Zarqx' | 'Zazu' | 'Honox';
export type TryoutStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// Time slot for hourly availability (15 = 3PM, 23 = 11PM)
export type HourSlot = 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23;

// Time slots structure: { monday: { 15: true, 16: false, ... }, tuesday: { ... }, ... }
export type TimeSlots = {
  [day in DayOfWeek]?: {
    [hour: number]: boolean;
  };
};

// Tryout Week - Represents a full week of tryouts for a specific team
export interface TryoutWeek {
  id: string;
  team_category: TeamCategory;
  week_start: Date; // Monday
  week_end: Date; // Sunday
  week_label: string; // e.g., "Week 1", "January Tryouts"
  status: TryoutStatus;
  notes: string;
  created_by: StaffMember | null;
  created_at: Date;
  updated_at: Date;
}

// Player Availability - Links players to tryout weeks with their response
export interface PlayerAvailability {
  id: string;
  tryout_week_id: string;
  player_id: string;
  token: string; // Unique token for player access
  /** @deprecated Use time_slots instead. Legacy field kept for backward compatibility. */
  available: boolean | null; // Legacy: null = no response, true = available, false = not available
  time_slots: TimeSlots; // Hourly availability per day
  /** @deprecated No longer used with hourly calendar system. */
  response_note: string;
  submitted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  // Joined data
  player?: Player;
  tryout_week?: TryoutWeek;
}

export interface CreateTryoutWeekData {
  team_category: TeamCategory;
  week_start: Date | string;
  week_end: Date | string;
  week_label: string;
  status?: TryoutStatus;
  notes?: string;
  created_by?: StaffMember;
}

export interface CreatePlayerAvailabilityData {
  tryout_week_id: string;
  player_id: string;
  token: string;
}

export interface UpdateAvailabilityData {
  /** @deprecated Use time_slots instead */
  available?: boolean;
  /** @deprecated No longer used with hourly calendar */
  response_note?: string;
  time_slots?: TimeSlots;
}


export interface CreatePlayerData {
  username: string;
  team_category: TeamCategory;
  role: ValorantRole;
  contact_status: ContactStatus;
  rank?: ValorantRank | null;
  nationality?: string;
  last_contact?: Date | string;
  managed_by?: string;
  contacted_by?: string;
  notes?: string;
  links?: string;
}

export interface UpdatePlayerData extends Partial<CreatePlayerData> {
  id: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
}

export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          username: string;
          team_category: TeamCategory;
          role: ValorantRole;
          contact_status: ContactStatus;
          last_contact: string | null;
          managed_by: string | null;
          contacted_by: string | null;
          notes: string;
          links: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          team_category: TeamCategory;
          role: ValorantRole;
          contact_status: ContactStatus;
          last_contact?: string | null;
          managed_by?: string | null;
          contacted_by?: string | null;
          notes?: string;
          links?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          team_category?: TeamCategory;
          role?: ValorantRole;
          contact_status?: ContactStatus;
          last_contact?: string | null;
          managed_by?: string | null;
          contacted_by?: string | null;
          notes?: string;
          links?: string;
          created_at: string;
          updated_at: string;
        };
      };
      tryout_weeks: {
        Row: {
          id: string;
          team_category: TeamCategory;
          week_start: string;
          week_end: string;
          week_label: string;
          status: TryoutStatus;
          notes: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_category: TeamCategory;
          week_start: string;
          week_end: string;
          week_label: string;
          status?: TryoutStatus;
          notes?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          team_category?: TeamCategory;
          week_start?: string;
          week_end?: string;
          week_label?: string;
          status?: TryoutStatus;
          notes?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      player_availabilities: {
        Row: {
          id: string;
          tryout_week_id: string;
          player_id: string;
          token: string;
          available: boolean | null;
          response_note: string;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tryout_week_id: string;
          player_id: string;
          token: string;
          available?: boolean | null;
          response_note?: string;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tryout_week_id?: string;
          player_id?: string;
          token?: string;
          available?: boolean | null;
          response_note?: string;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}