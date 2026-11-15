import { describe, expect, it } from 'vitest'
import { addDays } from 'date-fns'
import { activityTime, currentActivities, dateKey, defaultActivities, freeWindowsFor, nextActivity, occurrencesFor, progressFor, statusOf, weekDays } from '../lib/routine'
import type { Completion } from '../types'
const at = (day: string, time: string) => new Date(`${day}T${time}:00+06:00`)
const completion = (id: string, date: string, status: 'completed' | 'skipped'): Completion => ({ id: `${date}:${id}`, activityId: id, date, status, updatedAt: new Date().toISOString() })
describe('default weekly routine', () => {
  it('has all seven days from Saturday to Friday and preserves exact scheduled blocks', () => {
    expect(weekDays).toHaveLength(7)
    const dates = ['2026-11-14','2026-11-15','2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-20']
    expect(dates.map(d => occurrencesFor(at(d,'12:00'), defaultActivities).length)).toEqual([4,5,5,5,5,5,4])
    const sat = occurrencesFor(at(dates[0],'12:00'),defaultActivities)
    expect(sat.find(o => o.activity.id === 'office')?.activity).toMatchObject({ start:'10:00',end:'18:00' })
    expect(sat.find(o => o.activity.id === 'ielts-sat')?.activity).toMatchObject({ start:'18:30',end:'20:30' })
    const thu = occurrencesFor(at(dates[5],'12:00'),defaultActivities)
    expect(thu.find(o => o.activity.id === 'bedtime-thursday')?.activity).toMatchObject({ start:'00:00',end:null,overnight:true })
  })
  it('places bedtime after midnight while keeping it on the previous routine date', () => {
    const sat = occurrencesFor(at('2026-11-14','12:00'),defaultActivities)
    const bed = sat.find(o => o.activity.id === 'bedtime-window')!
    expect(dateKey(bed.start!)).toBe('2026-11-15')
    expect(dateKey(bed.end!)).toBe('2026-11-15')
    expect(bed.date).toBe('2026-11-14')
    expect(activityTime(bed,'12')).toContain('next day')
  })
  it('keeps both Friday 8 AM activities', () => {
    const now = at('2026-11-20','08:30')
    expect(occurrencesFor(now,defaultActivities).filter(o => o.activity.start === '08:00')).toHaveLength(2)
    expect(currentActivities(now,defaultActivities).map(o => o.activity.title)).toContain('Work From Home')
  })
  it('finds the current duration and the next event', () => {
    const now = at('2026-11-14','11:00')
    expect(currentActivities(now,defaultActivities).map(o => o.activity.title)).toEqual(['Office'])
    expect(nextActivity(now,defaultActivities)?.activity.title).toBe('IELTS Class')
  })
  it('tracks dates independently and does not count bedtime as progress', () => {
    const sun = at('2026-11-15','12:00')
    const events = occurrencesFor(sun,defaultActivities)
    expect(progressFor(events,[])).toEqual({complete:0,total:4})
    expect(progressFor(events,[completion('wake-week','2026-11-15','completed')])).toEqual({complete:1,total:4})
    expect(statusOf(events.find(o => o.activity.id === 'wake-week')!,[completion('wake-week','2026-11-14','completed')],sun)).toBe('Overdue')
  })
  it('uses end time for overdue duration, one hour for point events, and respects skip', () => {
    const sun = at('2026-11-15','12:00')
    const events = occurrencesFor(sun,defaultActivities)
    const gym = events.find(o => o.activity.id === 'gym-sun-mon')!
    expect(statusOf(gym,[],at('2026-11-15','15:00'))).toBe('In Progress')
    expect(statusOf(gym,[],at('2026-11-15','17:01'))).toBe('Overdue')
    expect(statusOf(gym,[completion('gym-sun-mon','2026-11-15','skipped')],at('2026-11-15','18:00'))).toBe('Skipped')
    expect(statusOf(events.find(o => o.activity.id === 'wake-week')!,[],at('2026-11-15','09:30'))).toBe('Pending')
    expect(statusOf(events.find(o => o.activity.id === 'wake-week')!,[],at('2026-11-15','10:00'))).toBe('Overdue')
  })
  it('calculates free windows without inventing flexible study times', () => {
    const friday = at('2026-11-20','12:00')
    const windows = freeWindowsFor(friday,defaultActivities)
    expect(windows.map(w => [w.start.getHours(),w.end.getHours()])).toEqual([[15,16],[20,22]])
  })
  it('recurs by weekday and edits do not change the seed', () => {
    const edited = defaultActivities.map(a => a.id === 'office' ? { ...a, start:'11:00' } : a)
    expect(occurrencesFor(addDays(at('2026-11-14','12:00'),7),edited).find(o => o.activity.id === 'office')?.activity.start).toBe('11:00')
    expect(defaultActivities.find(a => a.id === 'office')?.start).toBe('10:00')
    const without = edited.filter(a => a.id !== 'office')
    expect(occurrencesFor(at('2026-11-14','12:00'),without).some(o => o.activity.id === 'office')).toBe(false)
  })
})
