export default defineNuxtPlugin(async () => {
  const attribution = useAttribution()
  const value = attribution.capture(window.location.href, { ignoreDuplicate: true })
  if (!value) return

  await useProfile().load(true)
  const { trackEvent } = useAmplitude()
  trackEvent('campaign_opened', {
    ...attribution.properties(),
    entry_channel: value.entry_channel,
    campaign_id: value.campaign_id,
    link_target: window.location.pathname,
  })
})
