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
