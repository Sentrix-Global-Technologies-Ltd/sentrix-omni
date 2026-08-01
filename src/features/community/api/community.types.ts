export type CommunityAlertStatus = "unverified" | "active" | "resolved" | "expired";

export type CommunityAlertSource = "community" | "official" | "ai";

export interface PlatformCommunityAlert {
  id: string;
  category: string;
  title: string;
  note: string | null;
  is_anonymous: boolean;
  photo_url: string | null;
  video_url: string | null;
  impact: string;
  status: CommunityAlertStatus;
  source: CommunityAlertSource;
  verified: boolean;
  confidence: number;
  location: { lat: number; lng: number };
  confirmations_count: number;
  dismissals_count: number;
  likes_count: number;
  helpful_count: number;
  comments_count: number;
  reporter_id: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  expires_at: string | null;
  created_at: string | null;
}

export interface PlatformCommunityComment {
  id: string;
  body: string;
  author_name: string;
  mine: boolean;
  created_at: string | null;
}
