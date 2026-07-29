"use client"

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/toast'
import {
  Clock,
  Play,
  Square,
  Plus,
  Trash2,
  FileText,
  CheckCircle,
  Filter,
  AlertCircle,
  Loader2,
  Calendar,
  Users,
} from 'lucide-react'
import type { TimeEntry, Client } from '@/types/database'
import {
  startTimerAction,
  stopTimerAction,
  createManualTimeEntryAction,
  deleteTimeEntryAction,
  convertTimeEntriesToInvoiceAction,
} from './actions'

function formatDuration(minutes: number | null): string {
  if (!minutes || minutes <= 0) return '0m'
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hrs === 0) return `${mins}m`
  if (mins === 0) return `${hrs}h`
  return `${hrs}h ${mins}m`
}

function formatLiveTimer(startedAt: string): string {
  const diff = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
  const hrs = Math.floor(diff / 3600)
  const mins = Math.floor((diff % 3600) / 60)
  const secs = diff % 60
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function TimeTrackerPage() {
  const toast = useToast()
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [liveClock, setLiveClock] = useState('00:00:00')

  // Form states
  const [clientId, setClientId] = useState<string>('none')
  const [description, setDescription] = useState('')
  const [manualOpen, setManualOpen] = useState(false)
  const [filterClient, setFilterClient] = useState<string>('all')
  const [filterBilled, setFilterBilled] = useState<string>('all')
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([])

  const [isPending, startTransition] = useTransition()

  const loadData = async () => {
    const supabase = createClient()
    const [{ data: timeData }, { data: clientsData }, { data: active }] = await Promise.all([
      supabase.from('time_entries').select('*, clients(id, name, hourly_rate, currency)').order('started_at', { ascending: false }),
      supabase.from('clients').select('*').order('name'),
      supabase.from('time_entries').select('*, clients(id, name, hourly_rate, currency)').is('ended_at', null).order('started_at', { ascending: false }).maybeSingle(),
    ])

    setEntries(timeData || [])
    setClients(clientsData || [])
    setActiveTimer(active || null)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Live timer tick
  useEffect(() => {
    if (!activeTimer) return
    const interval = setInterval(() => {
      setLiveClock(formatLiveTimer(activeTimer.started_at))
    }, 1000)
    setLiveClock(formatLiveTimer(activeTimer.started_at))
    return () => clearInterval(interval)
  }, [activeTimer])

  const handleStartTimer = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const formData = new FormData()
      if (clientId && clientId !== 'none') formData.append('client_id', clientId)
      if (description) formData.append('description', description)

      const res = await startTimerAction(formData)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Timer started!')
        setDescription('')
        loadData()
      }
    })
  }

  const handleStopTimer = (id: string) => {
    startTransition(async () => {
      const res = await stopTimerAction(id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Timer stopped and saved!')
        loadData()
      }
    })
  }

  const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createManualTimeEntryAction(formData)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Time entry logged!')
        setManualOpen(false)
        loadData()
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteTimeEntryAction(id)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Time entry deleted!')
        loadData()
      }
    })
  }

  const handleConvertSelected = () => {
    if (selectedEntryIds.length === 0) return
    const firstSelected = entries.find(e => selectedEntryIds.includes(e.id))
    const selectedClientId = firstSelected?.client_id
    if (!selectedClientId) {
      toast.error('Selected entries must belong to a client to generate an invoice')
      return
    }

    startTransition(async () => {
      const res = await convertTimeEntriesToInvoiceAction(selectedClientId, selectedEntryIds)
      if (res?.error) {
        toast.error(res.error)
      }
    })
  }

  // Filtered list
  const filteredEntries = entries.filter(e => {
    if (filterClient !== 'all' && e.client_id !== filterClient) return false
    if (filterBilled === 'unbilled' && e.billed) return false
    if (filterBilled === 'billed' && !e.billed) return false
    return true
  })

  // Totals
  const unbilledMinutes = entries.filter(e => !e.billed && e.duration_minutes).reduce((acc, e) => acc + (e.duration_minutes || 0), 0)
  const totalMinutes = entries.reduce((acc, e) => acc + (e.duration_minutes || 0), 0)

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Time Tracker</h1>
          <p className="text-sm text-muted-foreground">Track billable hours and turn them into invoices instantly.</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={manualOpen} onOpenChange={setManualOpen}>
            <DialogTrigger>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" /> Log Time Manually
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleManualSubmit}>
                <DialogHeader>
                  <DialogTitle>Log Time Manually</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_id">Client (Optional)</Label>
                    <Select name="client_id">
                      <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                      <SelectContent>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input name="description" placeholder="e.g. Website redesign mockups" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="hours">Hours</Label>
                      <Input name="hours" type="number" step="0.5" defaultValue="1" min="0" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minutes">Minutes</Label>
                      <Input name="minutes" type="number" step="5" defaultValue="0" min="0" max="59" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="started_at">Date</Label>
                    <Input name="started_at" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setManualOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isPending}>Save Entry</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active Timer Bar */}
      <Card className="border-primary/30 bg-primary/5 shadow-md">
        <CardContent className="p-4 sm:p-6">
          {activeTimer ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex items-center justify-center p-3 rounded-full bg-primary/20 text-primary">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-20"></span>
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                      Timer Running
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">
                      {activeTimer.clients?.name || 'General Task'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate max-w-xs sm:max-w-md">
                    {activeTimer.description || 'No description provided'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-border/50">
                <div className="font-mono text-3xl font-bold tracking-tight text-primary">
                  {liveClock}
                </div>
                <Button
                  variant="destructive"
                  size="default"
                  onClick={() => handleStopTimer(activeTimer.id)}
                  disabled={isPending}
                  className="gap-2 shadow"
                >
                  <Square className="w-4 h-4 fill-current" /> Stop & Save
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleStartTimer} className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-48 shrink-0">
                <Select value={clientId} onValueChange={val => val && setClientId(val)}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Client / General</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What are you working on right now?"
                className="flex-1"
              />
              <Button type="submit" disabled={isPending} className="gap-2 shrink-0 w-full sm:w-auto">
                <Play className="w-4 h-4 fill-current" /> Start Timer
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unbilled Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{formatDuration(unbilledMinutes)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to convert to invoice</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Tracked Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalMinutes)}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all clients</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Log Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{entries.filter(e => e.billed).length} invoiced</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Log Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <CardTitle className="text-base font-semibold">Time Log</CardTitle>
            <CardDescription className="text-xs">History of all tracked work sessions</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedEntryIds.length > 0 && (
              <Button
                size="sm"
                className="gap-1.5 bg-primary text-primary-foreground"
                onClick={handleConvertSelected}
                disabled={isPending}
              >
                <FileText className="w-3.5 h-3.5" />
                Convert {selectedEntryIds.length} to Invoice
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <Select value={filterClient} onValueChange={val => val && setFilterClient(val)}>
                <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="All Clients" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterBilled} onValueChange={val => val && setFilterBilled(val)}>
                <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unbilled">Unbilled</SelectItem>
                  <SelectItem value="billed">Invoiced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-sm">No time entries found</p>
              <p className="text-xs text-muted-foreground mt-1">Start the live timer above or log time manually.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <th className="p-3.5 w-8">
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedEntryIds(filteredEntries.filter(e => !e.billed && e.ended_at).map(e => e.id))
                          } else {
                            setSelectedEntryIds([])
                          }
                        }}
                      />
                    </th>
                    <th className="p-3.5">Client & Description</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Duration</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredEntries.map(entry => {
                    const isSelected = selectedEntryIds.includes(entry.id)
                    const isRunning = !entry.ended_at
                    return (
                      <tr key={entry.id} className={`hover:bg-muted/40 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}>
                        <td className="p-3.5">
                          {!entry.billed && !isRunning && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedEntryIds([...selectedEntryIds, entry.id])
                                } else {
                                  setSelectedEntryIds(selectedEntryIds.filter(id => id !== entry.id))
                                }
                              }}
                              className="rounded border-border"
                            />
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="font-medium text-foreground">{entry.clients?.name || 'General Task'}</div>
                          <div className="text-xs text-muted-foreground">{entry.description || 'No description'}</div>
                        </td>
                        <td className="p-3.5 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(entry.started_at).toLocaleDateString()}
                        </td>
                        <td className="p-3.5 font-mono text-xs font-semibold whitespace-nowrap">
                          {isRunning ? (
                            <span className="text-primary font-bold animate-pulse">Running...</span>
                          ) : (
                            formatDuration(entry.duration_minutes)
                          )}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          {entry.billed ? (
                            <span className="status-paid px-2 py-0.5 rounded text-xs font-medium inline-flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Invoiced
                            </span>
                          ) : isRunning ? (
                            <span className="bg-primary/15 text-primary px-2 py-0.5 rounded text-xs font-medium">
                              Active
                            </span>
                          ) : (
                            <span className="status-unpaid px-2 py-0.5 rounded text-xs font-medium">
                              Unbilled
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(entry.id)}
                            className="text-muted-foreground hover:text-destructive"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
