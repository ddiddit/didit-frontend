import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { parseCampaignAttribution, restoreCampaignAttribution } from '../../app/analytics/attribution.ts'

describe('campaign attribution', () => {
  it('이메일 UTM 링크에서 허용된 유입 정보만 읽는다', () => {
    const value = parseCampaignAttribution(
      'https://didit.io.kr/?utm_source=newsletter&utm_medium=email&utm_campaign=relaunch&campaign_id=launch_2026',
      1_000,
    )

    assert.equal(value?.entry_channel, 'email')
    assert.equal(value?.campaign_id, 'launch_2026')
    assert.equal(value?.utm_campaign, 'relaunch')
  })

  it('7일이 지난 유입 정보는 복원하지 않는다', () => {
    const value = parseCampaignAttribution('/?utm_medium=push&campaign_id=push_1', 1_000)
    assert.equal(restoreCampaignAttribution(JSON.stringify(value), 1_000 + 7 * 24 * 60 * 60 * 1_000 + 1), null)
  })
})
