import Dexie, { type EntityTable } from 'dexie'
import type { Activity, Backup, Completion, Notice, Settings } from '../types'
import { defaultActivities } from '../lib/routine'

export const defaultSettings: Settings = { id: 'settings', theme: 'system', timeFormat: '12', reminders: true, summary: true, overdue: true, badges: true, defaultLead: 10 }
export const db = new Dexie('my-routine') as Dexie & {
  activities: EntityTable<Activity, 'id'>; completions: EntityTable<Completion, 'id'>; notices: EntityTable<Notice, 'id'>; settings: EntityTable<Settings, 'id'>
}
db.version(1).stores({ activities: 'id, category, active', completions: 'id, date, activityId', notices: 'id, date, read, dismissed', settings: 'id' })

export async function initialize() {
  await db.transaction('rw', db.activities, db.settings, async () => {
    const settings = await db.settings.get('settings')
    if (!settings) await db.settings.put(defaultSettings)
    if (await db.activities.count() === 0 && !settings) await db.activities.bulkPut(defaultActivities)
  })
  if (navigator.storage?.persist) void navigator.storage.persist().catch(() => {})
}
export async function exportBackup(): Promise<Backup> {
  const settings = await db.settings.get('settings')
  return { format: 'my-routine-backup', version: 1, exportedAt: new Date().toISOString(), activities: await db.activities.toArray(), completions: await db.completions.toArray(), notices: await db.notices.toArray(), settings: settings ?? defaultSettings }
}
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const validTime = (x: unknown) => x === null || (typeof x === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(x))
const validActivity = (x: unknown): x is Activity => isObject(x) && typeof x.id === 'string' && x.id.length > 0 && x.id.length < 100 && typeof x.title === 'string' && x.title.length > 0 && x.title.length <= 120 && ['Wellness','Work','Study','Fitness','Rest','Personal'].includes(String(x.category)) && typeof x.notes === 'string' && x.notes.length <= 5000 && validTime(x.start) && validTime(x.end) && Array.isArray(x.days) && x.days.length > 0 && x.days.every(d => Number.isInteger(d) && d >= 0 && d <= 6) && typeof x.flexible === 'boolean' && typeof x.reminder === 'boolean' && Number.isInteger(x.reminderMinutes) && Number(x.reminderMinutes) >= 0 && Number(x.reminderMinutes) <= 1440 && typeof x.track === 'boolean' && typeof x.active === 'boolean' && typeof x.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(x.color) && typeof x.icon === 'string' && typeof x.overnight === 'boolean'
export function validateBackup(value: unknown): Backup {
  if (!isObject(value) || value.format !== 'my-routine-backup' || value.version !== 1 || typeof value.exportedAt !== 'string' || !Array.isArray(value.activities) || !Array.isArray(value.completions) || !Array.isArray(value.notices) || !isObject(value.settings)) throw new Error('Invalid or unsupported backup file.')
  if (value.activities.length > 10000 || value.completions.length > 200000 || value.notices.length > 200000 || !value.activities.every(validActivity)) throw new Error('Backup contains invalid activities.')
  const ids = new Set(value.activities.map((a: Activity) => a.id))
  if (ids.size !== value.activities.length) throw new Error('Backup has duplicate activity IDs.')
  const completions = value.completions as unknown[]
  const notices = value.notices as unknown[]
  if (!completions.every(c => isObject(c) && typeof c.id === 'string' && typeof c.activityId === 'string' && typeof c.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(c.date) && ['completed','skipped'].includes(String(c.status)) && typeof c.updatedAt === 'string')) throw new Error('Backup contains invalid completion records.')
  if (!notices.every(n => isObject(n) && typeof n.id === 'string' && typeof n.date === 'string' && ['summary','upcoming','start','overdue'].includes(String(n.kind)) && typeof n.title === 'string' && typeof n.body === 'string' && typeof n.read === 'boolean' && typeof n.dismissed === 'boolean' && typeof n.createdAt === 'string' && (n.activityId === undefined || typeof n.activityId === 'string'))) throw new Error('Backup contains invalid notifications.')
  const s = value.settings
  if (s.id !== 'settings' || !['system','light','dark'].includes(String(s.theme)) || !['12','24'].includes(String(s.timeFormat)) || !['reminders','summary','overdue','badges'].every(k => typeof s[k] === 'boolean') || !Number.isInteger(s.defaultLead) || Number(s.defaultLead) < 0 || Number(s.defaultLead) > 1440) throw new Error('Backup contains invalid settings.')
  return value as Backup
}
export async function importBackup(backup: Backup) {
  const safe = validateBackup(backup)
  await db.transaction('rw', db.activities, db.completions, db.notices, db.settings, async () => {
    await Promise.all([db.activities.clear(), db.completions.clear(), db.notices.clear(), db.settings.clear()])
    await db.activities.bulkPut(safe.activities)
    await db.completions.bulkPut(safe.completions)
    await db.notices.bulkPut(safe.notices)
    await db.settings.put(safe.settings)
  })
}
export async function restoreDefaults() {
  await db.transaction('rw', db.activities, db.completions, db.notices, async () => {
    await db.activities.clear(); await db.activities.bulkPut(defaultActivities)
    await db.completions.clear(); await db.notices.clear()
  })
}
