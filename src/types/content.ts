export type SourceKind =
  | "official_site"
  | "official_blog"
  | "github_release"
  | "github_repo"
  | "research_paper"
  | "regulator"
  | "major_media"
  | "independent_blog"
  | "podcast"
  | "youtube"
  | "x"
  | "community";

export type TrustTier = "primary" | "secondary" | "analysis" | "discovery";
export type VerificationStatus = "verified" | "needs_review" | "rejected";
export type Confidence = "high" | "medium" | "low";
export type LaneHint = "daily" | "weekly" | "watchlist";
export type AdapterKind =
  | "rss"
  | "atom"
  | "github_releases"
  | "web_page"
  | "arxiv"
  | "podcast_feed"
  | "youtube_channel"
  | "x_account"
  | "arxiv_recent";

export interface SourceRef {
  name: string;
  kind: SourceKind;
  url: string;
  isOfficial?: boolean;
  independent?: boolean;
  publishedAt?: string;
}

export interface CandidateItem {
  id: string;
  title: string;
  url: string;
  canonicalUrl?: string;
  originalUrl?: string;
  publishedAt: string;
  summary?: string;
  source: SourceRef;
  corroboratingSources?: SourceRef[];
  tags?: string[];
}

export interface SourceDefinition {
  id: string;
  name: string;
  kind: SourceKind;
  adapter: AdapterKind;
  channelUrl: string;
  fetchUrl?: string;
  laneHint: LaneHint;
  notes?: string;
  urlIncludes?: string[];
  urlExcludes?: string[];
  maxItems?: number;
}

export interface SourcePolicy {
  tier: TrustTier;
  directDailyAllowed: boolean;
  directWeeklyAllowed: boolean;
  requiresOriginalSource: boolean;
}

export interface VerificationDecision {
  status: VerificationStatus;
  confidence: Confidence;
  dailyEligible: boolean;
  weeklyEligible: boolean;
  reasons: string[];
}

export interface DedupedCluster {
  canonicalUrl: string;
  primary: CandidateItem;
  members: CandidateItem[];
  supportingSources: SourceRef[];
}

export interface DailySelection {
  leadItems: CandidateItem[];
  rejectedItems: CandidateItem[];
}

export interface WeeklySelection {
  verifiedNews: CandidateItem[];
  deepDives: CandidateItem[];
  watchlist: CandidateItem[];
}

export interface BriefingOptions {
  dailyLimit: number;
  weeklyNewsLimit: number;
  weeklyDeepDiveLimit: number;
}

export interface BriefingResult {
  canonicalItems: CandidateItem[];
  dailySelection: DailySelection;
  weeklySelection: WeeklySelection;
  dailyReport: string;
  weeklyReport: string;
  watchlistReport: string;
}
