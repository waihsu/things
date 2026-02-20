export type FollowSummary = {
  user_id: string;
  followers_count: number;
  following_count: number;
  is_following: boolean;
};

export type FollowSummaryResponse = {
  follow: FollowSummary;
};
