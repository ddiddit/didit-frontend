import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  isSameCampaignAttribution,
  parseCampaignAttribution,
  resolveCampaignAttribution,
  restoreCampaignAttribution,
} from '../../app/analytics/attribution.ts'

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

  it('SSR 상태가 비어 있으면 브라우저에 저장된 유입 정보를 복원한다', () => {
    const stored = parseCampaignAttribution('/?utm_medium=email&campaign_id=email_1', 1_000)

    assert.deepEqual(resolveCampaignAttribution(null, JSON.stringify(stored), 2_000), JSON.parse(JSON.stringify(stored)))
  })

  it('수집 시각만 다른 동일 캠페인은 새 유입으로 보지 않는다', () => {
    const current = parseCampaignAttribution('/?utm_medium=email&campaign_id=email_1&utm_campaign=relaunch', 1_000)
    const reloaded = parseCampaignAttribution('/?utm_medium=email&campaign_id=email_1&utm_campaign=relaunch', 2_000)

    assert.equal(isSameCampaignAttribution(current, reloaded), true)
  })
})
