import type { WpcomSite } from './types'

export const seedWpcomSites: WpcomSite[] = [
  { id: 'wpcom-1', name: 'Downstreet Café', url: 'downstreet.cafe', provider: 'wpcom', environmentType: 'production', status: 'syncable' },
  { id: 'wpcom-2', name: 'Downstreet Café Staging', url: 'staging.downstreet.cafe', provider: 'pressable', environmentType: 'staging', status: 'syncable' },
  { id: 'wpcom-3', name: 'Studio Meridian', url: 'studiomeridian.com', provider: 'wpcom', environmentType: 'production', status: 'syncable' },
  { id: 'wpcom-8', name: 'Studio Meridian Staging', url: 'staging.studiomeridian.com', provider: 'pressable', environmentType: 'staging', status: 'syncable' },
  { id: 'wpcom-4', name: 'Meridian Dev', url: 'dev.studiomeridian.com', provider: 'pressable', environmentType: 'development', status: 'syncable' },
  { id: 'wpcom-5', name: 'My Travel Blog', url: 'wanderlustdiaries.com', provider: 'wpcom', environmentType: 'production', status: 'syncable' },
  { id: 'wpcom-6', name: 'Starter Site', url: 'shaun2026.wordpress.com', provider: 'wpcom', environmentType: 'production', status: 'needs-upgrade' },
  { id: 'wpcom-7', name: 'Old Portfolio', url: 'shaundesign.wordpress.com', provider: 'wpcom', environmentType: 'production', status: 'needs-transfer' },
]

/** Wpcom sites for the no-match persona — none share words with "Bright Pixel Agency", "Coastal Eats", or "Neon Notes". */
export const noMatchWpcomSites: WpcomSite[] = [
  { id: 'nm-wpcom-1', name: 'Summit Trail Outfitters', url: 'summittrail.com', provider: 'wpcom', environmentType: 'production', status: 'syncable' },
  { id: 'nm-wpcom-2', name: 'Summit Trail Staging', url: 'staging.summittrail.com', provider: 'pressable', environmentType: 'staging', status: 'syncable' },
  { id: 'nm-wpcom-3', name: 'Velvet Room Records', url: 'velvetroomrecords.com', provider: 'wpcom', environmentType: 'production', status: 'syncable' },
  { id: 'nm-wpcom-4', name: 'Foxglove Floristry', url: 'foxglovefloristry.com', provider: 'wpcom', environmentType: 'production', status: 'needs-upgrade' },
  { id: 'nm-wpcom-5', name: 'Redline Auto Blog', url: 'redlineauto.wordpress.com', provider: 'wpcom', environmentType: 'production', status: 'syncable' },
]
