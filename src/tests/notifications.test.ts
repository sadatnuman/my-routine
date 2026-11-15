import { describe, expect, it } from 'vitest'
import { calculateNotices, uniqueNotices } from '../lib/notifications'
import { defaultActivities, occurrencesFor, occurrencesNear } from '../lib/routine'
import { defaultSettings } from '../storage/db'
const at = (time: string) => new Date(`2026-11-14T${time}:00+06:00`)
describe('local reminders', () => {
  it('shows the upcoming reminder within lead time', () => {
    const now = at('09:51')
    const notices = calculateNotices(occurrencesFor(now,defaultActivities),occurrencesNear(now,defaultActivities),[],defaultSettings,now)
    expect(notices.find(n => n.id.endsWith('office:upcoming'))?.body).toContain('9 minutes')
  })
  it('does not duplicate notices on repeated resume checks', () => {
    const now = at('10:01')
    const incoming = calculateNotices(occurrencesFor(now,defaultActivities),occurrencesNear(now,defaultActivities),[],defaultSettings,now)
    expect(uniqueNotices(incoming,incoming)).toEqual([])
  })
  it('reconciles missed overdue notices on return', () => {
    const now = at('20:40')
    const notices = calculateNotices(occurrencesFor(now,defaultActivities),occurrencesNear(now,defaultActivities),[],defaultSettings,now)
    expect(notices.some(n => n.id.endsWith('office:overdue'))).toBe(true)
    expect(notices.some(n => n.id.endsWith('ielts-sat:overdue'))).toBe(true)
    expect(notices.some(n => n.kind === 'start')).toBe(false)
  })
  it('does not create yesterday start popups at 3 AM', () => {
    const now = new Date('2026-11-16T03:00:00+06:00')
    const notices = calculateNotices(occurrencesFor(now,defaultActivities),occurrencesNear(now,defaultActivities),[],defaultSettings,now)
    expect(notices.filter(n => n.kind === 'start')).toHaveLength(0)
    expect(notices.filter(n => n.kind === 'overdue')).toHaveLength(0)
  })
  it('does not time flexible blocks or notify completed activities', () => {
    const now = new Date('2026-11-17T19:00:00+06:00')
    const today = occurrencesFor(now,defaultActivities)
    const completions = [{ id:'2026-11-17:wfh-midweek',date:'2026-11-17',activityId:'wfh-midweek',status:'completed' as const,updatedAt:now.toISOString() }]
    const notices = calculateNotices(today,occurrencesNear(now,defaultActivities),completions,defaultSettings,now)
    expect(notices.some(n => n.activityId === 'flex-study')).toBe(false)
    expect(notices.some(n => n.activityId === 'wfh-midweek')).toBe(false)
  })
})
