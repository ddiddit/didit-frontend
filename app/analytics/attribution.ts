export interface CampaignAttribution {
  entry_channel: 'email' | 'push'
  campaign_id: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  captured_at_ms: number
  expires_at_ms: number
}

const ATTRIBUTION_TTL_MS = 7 * 24 * 60 * 60 * 1_000
const SAFE_VALUE = /^[a-zA-Z0-9._-]{1,100}$/

export function parseCampaignAttribution(url: string, nowMs = Date.now()): CampaignAttribution | null {
  const parsed = new URL(url, 'https://didit.io.kr')
  const medium = parsed.searchParams.get('utm_medium')
  const campaignId = parsed.searchParams.get('campaign_id')
  if ((medium !== 'email' && medium !== 'push') || !campaignId || !SAFE_VALUE.test(campaignId)) return null

  const safe = (name: string) => {
    const value = parsed.searchParams.get(name)
    return value && SAFE_VALUE.test(value) ? value : undefined
  }
  return {
    entry_channel: medium,
    campaign_id: campaignId,
    utm_source: safe('utm_source'),
    utm_medium: medium,
    utm_campaign: safe('utm_campaign'),
    captured_at_ms: nowMs,
    expires_at_ms: nowMs + ATTRIBUTION_TTL_MS,
  }
}

export function restoreCampaignAttribution(serialized: string | null, nowMs = Date.now()): CampaignAttribution | null {
  if (!serialized) return null
  try {
    const value = JSON.parse(serialized) as CampaignAttribution
    if (!value.campaign_id || !SAFE_VALUE.test(value.campaign_id) || value.expires_at_ms <= nowMs) return null
    if (value.entry_channel !== 'email' && value.entry_channel !== 'push') return null
    return value
  } catch {
    return null
  }
}
