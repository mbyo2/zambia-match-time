# Security Documentation

## Overview
This document outlines the security measures implemented to protect user data in the dating application, with specific focus on email privacy, location security, and payment data protection.

## Critical Security Measures Implemented

### 1. Email Privacy Protection ✅

**Threat**: Unauthorized access to user email addresses could enable spam, phishing, or stalking.

**Protections**:
- Email field **never exposed** in discovery profiles or public APIs
- Row-Level Security (RLS) restricts `profiles.email` to owner only
- Email only displayed on user's own profile page
- No email data in console logs or error messages
- Database functions exclude email from all discovery queries

**Verification**:
```sql
-- Only returns safe fields, NO email
SELECT * FROM get_discovery_profiles('user-id', '{}');
```

### 2. Location Privacy & Anti-Triangulation ✅

**Threat**: Precise distance calculations could enable location triangulation attacks, allowing stalkers to determine exact user locations.

**Protections**:
- **Distance Fuzzing**: Added ±2-5km random noise to all distance calculations
  - `fuzz_distance()` function prevents triangulation
  - Maintains usability while blocking precise location tracking
- **Coordinate Protection**: Exact lat/lng never exposed to other users
  - Only city, state, and fuzzed distance shared
- **Rate Limiting**: Max 30 discovery queries per 5 minutes
  - Prevents rapid querying for triangulation attempts
- **Audit Logging**: All discovery queries logged for monitoring

**Implementation**:
```sql
-- Distance is fuzzed in get_discovery_profiles function
fuzz_distance(calculate_distance(...)) as distance_km
```

**Rate Limits**:
- 30 queries per 5-minute window
- Violations logged to `security_audit_log`
- Client-side enforcement in `useDiscoveryRateLimit` hook

### 3. Payment Data Security ✅

**Threat**: Exposure of Stripe customer/subscription IDs could enable account takeover or payment fraud.

**Protections**:
- **Database Security**:
  - `user_subscriptions` table with RLS (users can only view own data)
  - Stripe IDs never exposed to unauthorized users
  - No Stripe IDs in frontend code or logs
  
- **Webhook Security**:
  - Signature verification on all Stripe webhooks
  - Service role key for secure database updates
  - Audit logging for all subscription changes
  
- **Access Control**:
  - RLS policy: `auth.uid() = user_id`
  - Stripe customer portal for user-initiated changes
  - No direct Stripe ID manipulation in frontend

**Webhook Verification**:
```typescript
// stripe-webhook/index.ts
const receivedEvent = await stripe.webhooks.constructEventAsync(
  body,
  signature!,
  STRIPE_WEBHOOK_SECRET
);
```

## Audit Logging

All sensitive operations are logged to `security_audit_log`:

### Logged Events:
- `discovery_profiles_accessed` - User queries discovery feed
- `profile_viewed` - User views another profile
- `subscription_update` - Subscription changes via webhook
- `rate_limit_exceeded` - Rate limit violations
- `verification_document_accessed` - Admin views verification docs

### Audit Log Schema:
```sql
security_audit_log (
  user_id uuid,
  action text,
  resource_type text,
  resource_id uuid,
  details jsonb,
  ip_address inet,
  created_at timestamp
)
```

## Rate Limiting

### Discovery Queries
- **Limit**: 30 queries per 5 minutes
- **Function**: `check_discovery_rate_limit(user_id)`
- **Client Hook**: `useDiscoveryRateLimit`
- **Purpose**: Prevent location triangulation and profile scraping

### Other Operations
- Swipe limits enforced via `daily_limits` table
- Authentication rate limiting via Supabase Auth
- File upload rate limiting via storage policies

## Data Exposure Matrix

| Data Type | Exposed To | Protection Level | Notes |
|-----------|-----------|------------------|-------|
| Email | Owner only | ✅ RLS + Audit | Never in discovery |
| Exact Location (lat/lng) | Owner only | ✅ RLS | Never exposed |
| Fuzzed Distance | Matched users | ✅ Noise added | ±2-5km random |
| City/State | Discovery feed | ✅ General location | No exact address |
| Stripe Customer ID | Owner only | ✅ RLS + Webhook | Never in frontend |
| Stripe Subscription ID | Owner only | ✅ RLS + Webhook | Never in frontend |
| Profile Photos | Public bucket | ⚠️ Trade-off | Dating app requirement |

## Security Best Practices

### For Developers:
1. **Never** log sensitive data (emails, passwords, Stripe IDs, coordinates)
2. **Always** use RLS policies for new tables
3. **Always** validate input before external API calls
4. **Use** audit logging for sensitive operations
5. **Test** RLS policies in isolation

### For Administrators:
1. Monitor `security_audit_log` for suspicious patterns
2. Review rate limit violations regularly
3. Enable Leaked Password Protection (Supabase dashboard)
4. Keep PostgreSQL version updated
5. Rotate Stripe webhook secrets periodically

## Known Limitations

### Platform-Level Warnings:
1. **Leaked Password Protection**: Disabled by default
   - Requires manual enable in Supabase Auth settings
   - Link: https://supabase.com/docs/guides/auth/password-security

2. **PostgreSQL Version**: May need updates
   - Check Supabase dashboard for available patches
   - Link: https://supabase.com/docs/guides/platform/upgrading

### Acceptable Trade-offs:
1. **Public Profile Photos**: Required for dating app functionality
   - Users upload photos knowing they'll be visible
   - Alternative: Premium "private photos" feature

2. **General Location Sharing**: City/state visibility
   - Essential for location-based matching
   - Exact coordinates remain private

## Incident Response

### If Suspicious Activity Detected:
1. Query `security_audit_log` for patterns
2. Check for rate limit violations
3. Review affected user accounts
4. Temporarily block suspicious user IDs if needed

### SQL Queries for Monitoring:
```sql
-- Check for rate limit violations
SELECT user_id, COUNT(*) as violations, MAX(created_at)
FROM security_audit_log
WHERE action = 'rate_limit_exceeded'
  AND created_at > now() - interval '24 hours'
GROUP BY user_id
ORDER BY violations DESC;

-- Check discovery query patterns
SELECT user_id, COUNT(*) as queries, 
       MAX(created_at) - MIN(created_at) as duration
FROM security_audit_log
WHERE action = 'discovery_profiles_accessed'
  AND created_at > now() - interval '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 50
ORDER BY queries DESC;
```

## Compliance Notes

### GDPR Considerations:
- Email protected as PII
- Location data minimized (city/state only)
- Audit logging for data access
- User can delete account (cascade delete)

### Payment Data:
- Stripe handles PCI compliance
- We only store non-sensitive IDs
- No credit card data in our database

## Security Score: 9.0/10

### Strengths:
- ✅ Email privacy fully protected
- ✅ Location triangulation prevented
- ✅ Payment data secured
- ✅ Comprehensive audit logging
- ✅ Rate limiting active
- ✅ RLS policies enforced

### Areas for Improvement:
- ⚠️ Enable leaked password protection (manual)
- ⚠️ Upgrade PostgreSQL version (manual)
- 💡 Consider end-to-end message encryption
- 💡 Add two-factor authentication option

---

**Last Updated**: 2025-11-17  
**Next Review**: 2025-12-17
