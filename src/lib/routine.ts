import { addDays, format, startOfDay } from 'date-fns'
import type { Activity, Completion, Occurrence, Weekday } from '../types'

export const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
export const plannerDays: Weekday[] = [6, 0, 1, 2, 3, 4, 5]
const make = (id: string, title: string, category: Activity['category'], days: Weekday[], start: string | null, end: string | null, options: Partial<Activity> = {}): Activity => ({
  id, title, category, days, start, end, notes: '', flexible: start === null, reminder: start !== null,
  reminderMinutes: 10, track: category !== 'Rest', active: true, color: { Wellness: '#e6a46c', Work: '#6c8ee5', Study: '#9b83df', Fitness: '#65b99b', Rest: '#8893a4', Personal: '#d985ad' }[category],
  icon: { Wellness: 'sun', Work: 'briefcase', Study: 'book', Fitness: 'dumbbell', Rest: 'moon', Personal: 'sparkles' }[category], overnight: false, ...options
})
export const defaultActivities: Activity[] = [
  make('wake-week', 'Wake Up', 'Wellness', [6,0,1,2,3,4], '09:00', null, { reminderMinutes: 0 }),
  make('wake-friday', 'Wake Up', 'Wellness', [5], '08:00', null, { reminderMinutes: 0 }),
  make('office', 'Office', 'Work', [6], '10:00', '18:00'),
  make('ielts-sat', 'IELTS Class', 'Study', [6], '18:30', '20:30', { reminderMinutes: 15 }),
  make('study-morning', 'Self Study', 'Study', [0,1], '10:00', '12:00', { reminderMinutes: 5 }),
  make('gym-sun-mon', 'Gym', 'Fitness', [0,1], '14:00', '17:00'),
  make('study-evening', 'Self Study', 'Study', [0,1], '20:00', '22:00', { reminderMinutes: 5 }),
  make('gym-midweek', 'Gym', 'Fitness', [2,3,4], '10:00', '13:00'),
  make('wfh-midweek', 'Work From Home', 'Work', [2,3,4], '14:00', '22:00'),
  make('flex-study', 'Flexible Self Study', 'Study', [2,3,4], null, null, { notes: 'During available work breaks', reminder: false }),
  make('wfh-friday', 'Work From Home', 'Work', [5], '08:00', '15:00'),
  make('ielts-friday', 'IELTS Class', 'Study', [5], '16:00', '20:30', { reminderMinutes: 15 }),
  make('bedtime-window', 'Bedtime Window', 'Rest', [6,0,1,2,3,5], '00:00', '01:00', { overnight: true, reminderMinutes: 15, track: false }),
  make('bedtime-thursday', 'Bedtime Target', 'Rest', [4], '00:00', null, { overnight: true, reminderMinutes: 15, track: false }),
]
export function dateKey(date: Date) { return format(date, 'yyyy-MM-dd') }
export function timeOn(date: Date, time: string, nextDay = false) {
  const [hours, minutes] = time.split(':').map(Number)
  const result = startOfDay(date)
  if (nextDay) result.setDate(result.getDate() + 1)
  result.setHours(hours, minutes, 0, 0)
  return result
}
export function occurrencesFor(date: Date, activities: Activity[]): Occurrence[] {
  const key = dateKey(date)
  return activities.filter(a => a.active && a.days.includes(date.getDay() as Weekday)).map(activity => {
    const start = activity.start ? timeOn(date, activity.start, activity.overnight) : null
    let end = activity.end ? timeOn(date, activity.end, activity.overnight) : null
    if (start && end && end <= start) end = addDays(end, 1)
    return { activity, date: key, start, end, key: `${key}:${activity.id}` }
  }).sort((a,b) => (a.start?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.start?.getTime() ?? Number.MAX_SAFE_INTEGER))
}
export function occurrencesNear(now: Date, activities: Activity[]) {
  return [-1,0,1].flatMap(offset => occurrencesFor(addDays(now,offset), activities))
}
export function completionFor(o: Occurrence, completions: Completion[]) { return completions.find(c => c.id === o.key) }
export type Status = 'Upcoming' | 'In Progress' | 'Pending' | 'Completed' | 'Skipped' | 'Overdue'
export function statusOf(o: Occurrence, completions: Completion[], now: Date): Status {
  const done = completionFor(o, completions)
  if (done) return done.status === 'completed' ? 'Completed' : 'Skipped'
  if (!o.start) return 'Pending'
  if (now < o.start) return 'Upcoming'
  const deadline = o.end ?? new Date(o.start.getTime() + 60 * 60_000)
  if (now >= deadline) return o.activity.track ? 'Overdue' : 'Pending'
  return o.end ? 'In Progress' : 'Pending'
}
export function currentActivities(now: Date, activities: Activity[]) {
  return occurrencesNear(now, activities).filter(o => o.start && o.end && o.start <= now && now < o.end)
}
export function nextActivity(now: Date, activities: Activity[]) {
  return occurrencesNear(now, activities).filter(o => o.start && o.start > now).sort((a,b) => a.start!.getTime() - b.start!.getTime())[0]
}
export function formatTime(date: Date, mode: '12' | '24') { return format(date, mode === '12' ? 'h:mm a' : 'HH:mm') }
export function activityTime(o: Occurrence, mode: '12' | '24') {
  if (!o.start) return 'Flexible'
  return `${formatTime(o.start, mode)}${o.end ? ` – ${formatTime(o.end, mode)}` : ''}${o.activity.overnight ? ' · next day' : ''}`
}
export function progressFor(occurrences: Occurrence[], completions: Completion[]) {
  const tracked = occurrences.filter(o => o.activity.track)
  return { complete: tracked.filter(o => completionFor(o, completions)?.status === 'completed').length, total: tracked.length }
}
export function freeWindowsFor(date: Date, activities: Activity[]) {
  const from = timeOn(date, '08:00')
  const to = timeOn(date, '22:00')
  const busy = occurrencesFor(date, activities).filter(o => o.start && o.end && o.start < to && o.end > from)
    .map(o => ({ start: new Date(Math.max(o.start!.getTime(), from.getTime())), end: new Date(Math.min(o.end!.getTime(), to.getTime())) }))
    .sort((a,b) => a.start.getTime() - b.start.getTime())
  const open: { start: Date; end: Date }[] = []
  let cursor = from.getTime()
  for (const slot of busy) {
    if (slot.start.getTime() - cursor >= 30 * 60_000) open.push({ start: new Date(cursor), end: slot.start })
    cursor = Math.max(cursor, slot.end.getTime())
  }
  if (to.getTime() - cursor >= 30 * 60_000) open.push({ start: new Date(cursor), end: to })
  return open
}
