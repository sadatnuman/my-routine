import type { Completion, Notice, Occurrence, Settings } from '../types'
import { dateKey, statusOf } from './routine'

export function calculateNotices(today: Occurrence[], near: Occurrence[], completions: Completion[], settings: Settings, now: Date): Notice[] {
  const createdAt = now.toISOString()
  const notices: Notice[] = []
  const add = (id: string, date: string, kind: Notice['kind'], title: string, body: string, activityId?: string) => notices.push({ id, date, kind, title, body, activityId, read: false, dismissed: false, createdAt })
  if (settings.summary) {
    const pending = today.filter(o => o.activity.track && statusOf(o, completions, now) !== 'Completed' && statusOf(o, completions, now) !== 'Skipped').length
    add(`summary:${dateKey(now)}`, dateKey(now), 'summary', 'Your day at a glance', `${today.length} activities today · ${pending} still to do`)
  }
  if (!settings.reminders) return notices
  for (const o of near) {
    if (!o.start || !o.activity.reminder || statusOf(o, completions, now) === 'Completed' || statusOf(o, completions, now) === 'Skipped') continue
    const lead = o.activity.reminderMinutes
    const before = o.start.getTime() - now.getTime()
    if (lead > 0 && before <= lead * 60_000 && before > 0) add(`${o.key}:upcoming`, o.date, 'upcoming', `${o.activity.title} is coming up`, `Starts in ${Math.ceil(before / 60_000)} minutes`, o.activity.id)
    if (now >= o.start && now.getTime() - o.start.getTime() < 5 * 60_000) add(`${o.key}:start`, o.date, 'start', `It's time for ${o.activity.title}`, 'Your scheduled activity has started.', o.activity.id)
    if (settings.overdue && o.date === today[0]?.date && o.activity.track && statusOf(o, completions, now) === 'Overdue') add(`${o.key}:overdue`, o.date, 'overdue', `${o.activity.title} needs attention`, 'This activity has passed and is still incomplete.', o.activity.id)
  }
  return notices
}
export function uniqueNotices(existing: Notice[], incoming: Notice[]) {
  const ids = new Set(existing.map(n => n.id))
  return incoming.filter(n => !ids.has(n.id))
}
