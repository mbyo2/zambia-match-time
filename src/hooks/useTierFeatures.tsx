import { useSubscription } from '@/hooks/useSubscription';

export type Tier = 'free' | 'basic' | 'premium' | 'elite';

export interface TierFeatures {
  tier: Tier;
  isLoading: boolean;
  // Hierarchy
  isPaid: boolean;
  isBasicOrHigher: boolean;
  isPremiumOrHigher: boolean;
  isElite: boolean;
  // Daily limits (-1 = unlimited)
  dailySwipes: number;
  dailySuperLikes: number;
  monthlyBoosts: number;
  // Capabilities
  canSeeWhoLikedYou: boolean;
  canUseAdvancedFilters: boolean;
  canUseSuperLike: boolean;
  canUseBoost: boolean;
  canSeeReadReceipts: boolean;
  canRewindSwipe: boolean;
  canHideAds: boolean;
  hasPrioritySupport: boolean;
  hasIncognitoMode: boolean;
  hasTravelMode: boolean;
  // Helpers
  hasAtLeast: (minTier: Tier) => boolean;
  upgradeTarget: (forFeature: Tier) => Tier;
}

const TIER_RANK: Record<Tier, number> = {
  free: 0,
  basic: 1,
  premium: 2,
  elite: 3,
};

/**
 * Single source of truth for tier-based feature gating.
 * Use this instead of `subscription.tier !== 'free'` checks scattered across the app.
 */
export const useTierFeatures = (): TierFeatures => {
  const { subscription } = useSubscription();
  const tier = (subscription.tier || 'free') as Tier;
  const rank = TIER_RANK[tier];

  const hasAtLeast = (minTier: Tier) => rank >= TIER_RANK[minTier];

  return {
    tier,
    isLoading: subscription.isLoading,
    isPaid: rank >= 1,
    isBasicOrHigher: rank >= 1,
    isPremiumOrHigher: rank >= 2,
    isElite: rank >= 3,

    // Limits per tier
    dailySwipes:
      tier === 'free' ? 50 : -1, // unlimited for paid tiers
    dailySuperLikes:
      tier === 'free' ? 0 :
      tier === 'basic' ? 5 :
      tier === 'premium' ? 10 :
      -1, // elite unlimited
    monthlyBoosts:
      tier === 'free' ? 0 :
      tier === 'basic' ? 0 :
      tier === 'premium' ? 5 :
      -1, // elite unlimited

    // Capability matrix
    canSeeWhoLikedYou: rank >= 1,        // basic+
    canUseAdvancedFilters: rank >= 2,    // premium+
    canUseSuperLike: rank >= 1,          // basic+
    canUseBoost: rank >= 2,              // premium+
    canSeeReadReceipts: rank >= 2,       // premium+
    canRewindSwipe: rank >= 1,           // basic+
    canHideAds: rank >= 1,               // basic+
    hasPrioritySupport: rank >= 2,       // premium+
    hasIncognitoMode: rank >= 3,         // elite
    hasTravelMode: rank >= 2,            // premium+

    hasAtLeast,
    upgradeTarget: (forFeature: Tier) => forFeature,
  };
};
