export interface Hackathon {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  source: string;
  source_url: string;
  organizer: string | null;
  registration_deadline: string | null;
  start_date: string | null;
  end_date: string | null;
  prize_amount: string | null;
  tags: string[];
  mode: 'online' | 'offline' | 'hybrid';
  location: string | null;
  participants_count: number;
  created_at: string;
  updated_at: string;
  userStatus?: 'registered' | 'shortlisted' | null;
}

export interface UserHackathon {
  id: string;
  user_id: string;
  hackathon_id: string;
  status: 'registered' | 'shortlisted';
  notes: string | null;
  created_at: string;
  hackathon?: Hackathon;
}

export interface UserStats {
  registered: number;
  shortlisted: number;
  total: number;
}

export type FilterMode = 'all' | 'online' | 'offline' | 'hybrid';
export type SortBy = 'newest' | 'deadline' | 'prize' | 'participants';
export type DeadlineFilter = 'all' | 'today' | 'week' | 'month';
