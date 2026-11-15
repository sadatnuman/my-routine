export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type Category = 'Wellness' | 'Work' | 'Study' | 'Fitness' | 'Rest' | 'Personal'
export type Activity = {
  id: string; title: string; category: Category; notes: string; start: string | null; end: string | null;
  days: Weekday[]; flexible: boolean; reminder: boolean; reminderMinutes: number;
  track: boolean; active: boolean; color: string; icon: string; overnight: boolean
}
export type Completion = { id: string; activityId: string; date: string; status: 'completed' | 'skipped'; updatedAt: string }
export type Notice = { id: string; date: string; activityId?: string; kind: 'summary' | 'upcoming' | 'start' | 'overdue'; title: string; body: string; read: boolean; dismissed: boolean; createdAt: string }
export type Settings = { id: 'settings'; theme: 'system' | 'light' | 'dark'; timeFormat: '12' | '24'; reminders: boolean; summary: boolean; overdue: boolean; badges: boolean; defaultLead: number }
export type Occurrence = { activity: Activity; date: string; start: Date | null; end: Date | null; key: string }
export type Backup = { format: 'my-routine-backup'; version: 1; exportedAt: string; activities: Activity[]; completions: Completion[]; notices: Notice[]; settings: Settings }
