import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, defaultSettings, exportBackup, importBackup, initialize, restoreDefaults, validateBackup } from '../storage/db'
import { defaultActivities } from '../lib/routine'
beforeEach(async () => { await db.delete(); await db.open() })
describe('local persistence and backups', () => {
  it('seeds only once and persists edits after reopening', async () => {
    await initialize()
    expect(await db.activities.count()).toBe(defaultActivities.length)
    await db.activities.update('office',{title:'My Office'})
    await db.close(); await db.open(); await initialize()
    expect((await db.activities.get('office'))?.title).toBe('My Office')
  })
  it('adds, deletes and restores routine', async () => {
    await initialize()
    const extra = { ...defaultActivities[0], id:'new-one', title:'Walk' }
    await db.activities.put(extra)
    expect(await db.activities.get('new-one')).toBeDefined()
    await db.activities.delete('new-one')
    expect(await db.activities.get('new-one')).toBeUndefined()
    await db.activities.update('office',{title:'Changed'})
    await restoreDefaults()
    expect((await db.activities.get('office'))?.title).toBe('Office')
  })
  it('exports, validates and imports data', async () => {
    await initialize()
    await db.activities.update('office',{title:'My Office'})
    const backup = await exportBackup()
    expect(validateBackup(JSON.parse(JSON.stringify(backup))).activities).toHaveLength(defaultActivities.length)
    await restoreDefaults(); await importBackup(backup)
    expect((await db.activities.get('office'))?.title).toBe('My Office')
    expect(await db.settings.get('settings')).toEqual(defaultSettings)
  })
  it('rejects malformed or malicious backup records', async () => {
    await initialize()
    const backup = await exportBackup()
    expect(() => validateBackup({ format:'my-routine-backup',version:99 })).toThrow()
    expect(() => validateBackup({ ...backup, activities:[{ ...backup.activities[0], title:'<img onerror=alert(1)>', color:'red' }] })).toThrow()
    expect(() => validateBackup({ ...backup, activities:[backup.activities[0],backup.activities[0]] })).toThrow()
  })
})
