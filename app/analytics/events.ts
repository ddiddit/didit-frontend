export type AccountType = 'CUSTOMER' | 'TEAM' | 'TEST' | 'UNKNOWN'
export type AppSurface = 'web' | 'ios' | 'android'

export interface CampaignEventProperties {
  entry_channel?: 'email' | 'push'
  campaign_id?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

export interface AnalyticsCommonProperties {
  environment: 'development' | 'production'
  app_surface: AppSurface
  app_version: string
  account_type: AccountType
}

export interface AnalyticsEventProperties {
  campaign_opened: Required<Pick<CampaignEventProperties, 'entry_channel' | 'campaign_id'>> & CampaignEventProperties & {
    link_target: string
  }
  retrospect_start_clicked: {
    source: string
  }
  retrospect_started: CampaignEventProperties & {
    retrospective_id: string
    flow_version: 'V2'
    source: string
  }
  retrospect_start_failed: {
    reason: string
    source: string
  }
  retrospect_restarted: {
    previous_retrospective_id: string
    retrospective_id: string
  }
  retrospect_restart_failed: {
    previous_retrospective_id: string
    reason: string
  }
  retrospect_answer_submitted: {
    retrospective_id: string
    turn_id: string
    turn_number: number
    input_type: 'text' | 'attachment' | 'mixed'
    ready_to_complete: boolean
  }
  retrospect_exited: {
    retrospective_id: string
    last_completed_turn: number
    exit_reason: 'user_confirmed' | 'completion_not_ready'
  }
  retrospect_result_generated: {
    retrospective_id: string
    answer_count: number
  }
  retrospect_completed: CampaignEventProperties & {
    retrospective_id: string
    answer_count: number
    turn_count: number
    elapsed_duration_sec: number
    active_duration_sec: number
  }
  retrospect_complete_failed: {
    retrospective_id: string
    reason: string
    last_completed_turn: number
  }
}

export type AnalyticsEventName = keyof AnalyticsEventProperties

export function createAnalyticsInsertId(
  eventName: AnalyticsEventName,
  retrospectiveId: string,
  discriminator?: string,
): string {
  return [eventName, retrospectiveId, discriminator].filter(Boolean).join(':')
}
