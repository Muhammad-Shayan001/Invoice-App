import type { SupabaseClient } from '@supabase/supabase-js'
import type { TimeEntry } from '@/types/database'

export async function getTimeEntries(
  supabase: SupabaseClient,
  filters?: { clientId?: string; billed?: boolean }
): Promise<TimeEntry[]> {
  let query = supabase
    .from('time_entries')
    .select('*, clients(id, name, hourly_rate, currency)')
    .order('started_at', { ascending: false })

  if (filters?.clientId) {
    query = query.eq('client_id', filters.clientId)
  }

  if (filters?.billed !== undefined) {
    query = query.eq('billed', filters.billed)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getActiveTimer(supabase: SupabaseClient): Promise<TimeEntry | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('time_entries')
    .select('*, clients(id, name, hourly_rate, currency)')
    .eq('user_id', user.id)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .maybeSingle()

  if (error) return null
  return data
}

export async function startTimer(
  supabase: SupabaseClient,
  payload: { client_id?: string; description?: string }
): Promise<TimeEntry> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Stop any active running timer first
  const active = await getActiveTimer(supabase)
  if (active) {
    await stopTimer(supabase, active.id)
  }

  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      user_id: user.id,
      client_id: payload.client_id || null,
      description: payload.description || null,
      started_at: new Date().toISOString(),
      billed: false,
    })
    .select('*, clients(id, name, hourly_rate, currency)')
    .single()

  if (error) throw error
  return data
}

export async function stopTimer(supabase: SupabaseClient, id: string): Promise<TimeEntry> {
  // Fetch entry to calculate duration
  const { data: entry, error: fetchErr } = await supabase
    .from('time_entries')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !entry) throw new Error('Timer not found')

  const endedAt = new Date()
  const startedAt = new Date(entry.started_at)
  const durationMinutes = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000))

  const { data, error } = await supabase
    .from('time_entries')
    .update({
      ended_at: endedAt.toISOString(),
      duration_minutes: durationMinutes,
    })
    .eq('id', id)
    .select('*, clients(id, name, hourly_rate, currency)')
    .single()

  if (error) throw error
  return data
}

export async function createManualTimeEntry(
  supabase: SupabaseClient,
  payload: {
    client_id?: string
    description?: string
    started_at: string
    duration_minutes: number
  }
): Promise<TimeEntry> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const started = new Date(payload.started_at)
  const ended = new Date(started.getTime() + payload.duration_minutes * 60000)

  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      user_id: user.id,
      client_id: payload.client_id || null,
      description: payload.description || null,
      started_at: started.toISOString(),
      ended_at: ended.toISOString(),
      duration_minutes: payload.duration_minutes,
      billed: false,
    })
    .select('*, clients(id, name, hourly_rate, currency)')
    .single()

  if (error) throw error
  return data
}

export async function deleteTimeEntry(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from('time_entries').delete().eq('id', id)
  if (error) throw error
}

export async function getUnbilledTimeEntriesByClient(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('time_entries')
    .select('*, clients(id, name, hourly_rate, currency)')
    .eq('user_id', user.id)
    .eq('billed', false)
    .not('ended_at', 'is', null)

  if (error) return []

  // Group by client
  const clientMap: Record<string, {
    client: { id: string; name: string; hourly_rate?: number; currency?: string }
    entries: TimeEntry[]
    totalMinutes: number
  }> = {}

  for (const entry of data || []) {
    const cId = entry.client_id || 'unassigned'
    const cName = entry.clients?.name || 'No Client'

    if (!clientMap[cId]) {
      clientMap[cId] = {
        client: {
          id: cId,
          name: cName,
          hourly_rate: entry.clients?.hourly_rate || undefined,
          currency: entry.clients?.currency || undefined,
        },
        entries: [],
        totalMinutes: 0,
      }
    }
    clientMap[cId].entries.push(entry)
    clientMap[cId].totalMinutes += entry.duration_minutes || 0
  }

  return Object.values(clientMap)
}
