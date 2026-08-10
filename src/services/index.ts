import type { Player, TeamEvent, Communication, Convocazione, ConvocazioneWithPlayer, AttendanceStats, ConvocationSummary, PlayerAttendanceDetail, TeamAttendanceStats, AttendanceByEvent, AttendanceByPlayer, CoachAttendanceAlerts, EventType, PlannedAbsence, PlannedAbsenceWithPlayer, RecurrenceRule, EditScope, DeleteScope, ExceptionType, Availability, AvailabilityWithPlayer, AvailabilitySummary, AvailabilityByEventItem, AdminSettings } from '@/types';
import { mockPlayers, mockEvents, mockCommunications, mockConvocazioni, mockPlannedAbsences, mockAvailabilities, mockAdminSettings } from '@/mock-data';
import { generateRecurringEvents } from '@/lib/recurrence';
import { getCertificateStatus, DEFAULT_EXPIRING_SOON_THRESHOLD } from '@/lib/constants';

const delay = (ms = 80) => new Promise((r) => setTimeout(r, ms));

let players = [...mockPlayers];
let events = [...mockEvents];
let communications = [...mockCommunications];
let convocazioni = [...mockConvocazioni];

function genId(): string {
  return 'id-' + Math.random().toString(36).slice(2, 10);
}

export function isTrainingEvent(type: string): boolean {
  return type === 'allenamento';
}

export function requiresConvocations(type: string): boolean {
  return type === 'partita' || type === 'torneo' || type === 'ritiro';
}

export function requiresAvailability(type: string): boolean {
  return type === 'partita' || type === 'torneo' || type === 'ritiro';
}

// ─── Players ───
export const playerService = {
  async getAll(): Promise<Player[]> {
    await delay();
    return [...players].sort((a, b) => a.surname.localeCompare(b.surname));
  },

  async getActive(): Promise<Player[]> {
    await delay();
    return [...players].filter((p) => p.active).sort((a, b) => a.surname.localeCompare(b.surname));
  },

  async getById(id: string): Promise<Player | null> {
    await delay();
    return players.find((p) => p.id === id) || null;
  },

  async countActive(): Promise<number> {
    await delay(50);
    return players.filter((p) => p.active).length;
  },

  async getBirthdaysToday(): Promise<Player[]> {
    await delay(50);
    const todayMD = new Date().toISOString().slice(5, 10);
    return players.filter((p) => p.birth_date && p.birth_date.slice(5) === todayMD);
  },

  async getUpcomingBirthdays(days: number = 30): Promise<Player[]> {
    await delay(50);
    const now = new Date();
    const todayMD = now.toISOString().slice(5, 10);
    return players
      .filter((p) => p.birth_date)
      .map((p) => {
        const md = p.birth_date!.slice(5);
        return { player: p, md };
      })
      .filter(({ md }) => {
        if (md === todayMD) return false;
        const d = new Date(now.getFullYear() + '-' + md + 'T00:00:00');
        const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= days;
      })
      .sort((a, b) => a.md.localeCompare(b.md))
      .map(({ player }) => player);
  },

  async getAttendanceStats(playerId: string): Promise<AttendanceStats> {
    await delay(50);
    const playerConvs = convocazioni.filter((c) => c.player_id === playerId);
    const total = playerConvs.length;
    const confirmed = playerConvs.filter((c) => c.response === 'confermato').length;
    const declined = playerConvs.filter((c) => c.response === 'declinato').length;
    const pending = playerConvs.filter((c) => c.response === 'in_attesa').length;
    const rate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
    return { total, confirmed, declined, pending, rate };
  },

  async create(data: Omit<Player, 'id' | 'created_at'>): Promise<Player> {
    await delay();
    const player: Player = { ...data, id: genId(), created_at: new Date().toISOString() };
    players.push(player);
    return player;
  },

  async update(id: string, data: Partial<Player>): Promise<Player> {
    await delay();
    const idx = players.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Giocatore non trovato');
    players[idx] = { ...players[idx], ...data };
    return players[idx];
  },

  async remove(id: string): Promise<void> {
    await delay();
    players = players.filter((p) => p.id !== id);
    convocazioni = convocazioni.filter((c) => c.player_id !== id);
  },
};

// ─── Events ───
export const eventService = {
  async getAll(): Promise<TeamEvent[]> {
    await delay();
    return [...events].sort((a, b) => a.date.localeCompare(b.date));
  },

  async getUpcoming(limit?: number): Promise<TeamEvent[]> {
    await delay();
    const today = new Date().toISOString().slice(0, 10);
    const result = [...events].filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    return limit ? result.slice(0, limit) : result;
  },

  async getById(id: string): Promise<TeamEvent | null> {
    await delay();
    return events.find((e) => e.id === id) || null;
  },

  async create(data: Omit<TeamEvent, 'id' | 'created_at' | 'series_id' | 'original_date' | 'is_exception' | 'exception_type'>): Promise<TeamEvent> {
    await delay();
    const event: TeamEvent = {
      ...data,
      id: genId(),
      created_at: new Date().toISOString(),
      series_id: null,
      original_date: null,
      is_exception: false,
      exception_type: null,
    };
    events.push(event);
    // For training events, auto-invite all active players as PRESENT
    if (isTrainingEvent(data.event_type)) {
      const activePlayers = players.filter((p) => p.active);
      for (const p of activePlayers) {
        convocazioni.push({
          id: genId(),
          event_id: event.id,
          player_id: p.id,
          status: 'convocato',
          response: 'confermato',
          notes: null,
          created_at: new Date().toISOString(),
        });
      }
    }
    return event;
  },

  async createRecurring(rule: RecurrenceRule): Promise<TeamEvent[]> {
    await delay();
    const seriesId = `series_${genId()}`;
    const generated = generateRecurringEvents(rule, seriesId);
    for (const event of generated) {
      events.push(event);
      // Auto-invite all active players as PRESENT for each training session
      const activePlayers = players.filter((p) => p.active);
      for (const p of activePlayers) {
        convocazioni.push({
          id: genId(),
          event_id: event.id,
          player_id: p.id,
          status: 'convocato',
          response: 'confermato',
          notes: null,
          created_at: new Date().toISOString(),
        });
      }
    }
    return generated;
  },

  async update(id: string, data: Partial<TeamEvent>): Promise<TeamEvent> {
    await delay();
    const idx = events.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Evento non trovato');
    events[idx] = { ...events[idx], ...data };
    return events[idx];
  },

  async updateWithScope(id: string, data: Partial<TeamEvent>, scope: EditScope): Promise<TeamEvent[]> {
    await delay();
    const event = events.find((e) => e.id === id);
    if (!event) throw new Error('Evento non trovato');
    const updated: TeamEvent[] = [];

    if (scope === 'single') {
      const idx = events.findIndex((e) => e.id === id);
      if (idx !== -1) {
        events[idx] = { ...events[idx], ...data, is_exception: true };
        updated.push(events[idx]);
      }
    } else if (scope === 'future' && event.series_id) {
      const eventDate = event.original_date || event.date;
      for (let i = 0; i < events.length; i++) {
        if (events[i].series_id === event.series_id && (events[i].original_date || events[i].date) >= eventDate) {
          events[i] = { ...events[i], ...data };
          updated.push(events[i]);
        }
      }
    } else if (scope === 'series' && event.series_id) {
      for (let i = 0; i < events.length; i++) {
        if (events[i].series_id === event.series_id) {
          events[i] = { ...events[i], ...data };
          updated.push(events[i]);
        }
      }
    } else {
      // Fallback to single update
      const idx = events.findIndex((e) => e.id === id);
      if (idx !== -1) {
        events[idx] = { ...events[idx], ...data };
        updated.push(events[idx]);
      }
    }
    return updated;
  },

  async remove(id: string): Promise<void> {
    await delay();
    events = events.filter((e) => e.id !== id);
    convocazioni = convocazioni.filter((c) => c.event_id !== id);
  },

  async removeWithScope(id: string, scope: DeleteScope): Promise<void> {
    await delay();
    const event = events.find((e) => e.id === id);
    if (!event) throw new Error('Evento non trovato');

    if (scope === 'single') {
      const removeIds = new Set([id]);
      events = events.filter((e) => !removeIds.has(e.id));
      convocazioni = convocazioni.filter((c) => !removeIds.has(c.event_id));
    } else if (scope === 'future' && event.series_id) {
      const eventDate = event.original_date || event.date;
      const removeIds = new Set(
        events
          .filter((e) => e.series_id === event.series_id && (e.original_date || e.date) >= eventDate)
          .map((e) => e.id)
      );
      events = events.filter((e) => !removeIds.has(e.id));
      convocazioni = convocazioni.filter((c) => !removeIds.has(c.event_id));
    } else if (scope === 'series' && event.series_id) {
      const removeIds = new Set(
        events.filter((e) => e.series_id === event.series_id).map((e) => e.id)
      );
      events = events.filter((e) => !removeIds.has(e.id));
      convocazioni = convocazioni.filter((c) => !removeIds.has(c.event_id));
    } else {
      events = events.filter((e) => e.id !== id);
      convocazioni = convocazioni.filter((c) => c.event_id !== id);
    }
  },

  async createException(eventId: string, exceptionType: ExceptionType, data: Partial<TeamEvent>): Promise<TeamEvent> {
    await delay();
    const idx = events.findIndex((e) => e.id === eventId);
    if (idx === -1) throw new Error('Evento non trovato');
    events[idx] = {
      ...events[idx],
      ...data,
      is_exception: true,
      exception_type: exceptionType,
    };
    return events[idx];
  },

};

// ─── Convocazioni ───
export const convocazioneService = {
  async getByEventId(eventId: string): Promise<ConvocazioneWithPlayer[]> {
    await delay();
    const result = convocazioni
      .filter((c) => c.event_id === eventId)
      .map((c) => ({ ...c, player: players.find((p) => p.id === c.player_id)! }))
      .filter((c) => c.player);
    return result.sort((a, b) => a.player.surname.localeCompare(b.player.surname));
  },

  async getByEventIds(eventIds: string[]): Promise<Record<string, ConvocazioneWithPlayer[]>> {
    await delay();
    const map: Record<string, ConvocazioneWithPlayer[]> = {};
    for (const id of eventIds) {
      map[id] = convocazioni
        .filter((c) => c.event_id === id)
        .map((c) => ({ ...c, player: players.find((p) => p.id === c.player_id)! }))
        .filter((c) => c.player)
        .sort((a, b) => a.player.surname.localeCompare(b.player.surname));
    }
    return map;
  },

  async getSummary(eventId: string): Promise<ConvocationSummary> {
    await delay(50);
    const convs = convocazioni.filter((c) => c.event_id === eventId);
    const convocati = convs.filter((c) => c.status === 'convocato');
    const invited = convocati.length;
    const confirmed = convocati.filter((c) => c.response === 'confermato').length;
    const declined = convocati.filter((c) => c.response === 'declinato').length;
    const pending = convocati.filter((c) => c.response === 'in_attesa').length;
    const inDubbio = convs.filter((c) => c.status === 'in_dubbio').length;
    const total = invited || 1;
    return {
      invited,
      confirmed,
      declined,
      pending,
      inDubbio,
      confirmedPct: Math.round((confirmed / total) * 100),
      declinedPct: Math.round((declined / total) * 100),
      pendingPct: Math.round((pending / total) * 100),
    };
  },

  async setResponse(convocazioneId: string, response: Convocazione['response']): Promise<void> {
    await delay(50);
    const idx = convocazioni.findIndex((c) => c.id === convocazioneId);
    if (idx !== -1) {
      convocazioni[idx].response = response;
    }
  },

  async replaceForEvent(eventId: string, items: { player_id: string; status: Convocazione['status']; response: Convocazione['response'] }[]): Promise<void> {
    await delay();
    convocazioni = convocazioni.filter((c) => c.event_id !== eventId);
    for (const item of items) {
      convocazioni.push({
        id: genId(),
        event_id: eventId,
        ...item,
        response: item.response || 'confermato',
        notes: null,
        created_at: new Date().toISOString(),
      });
    }
  },
};

// ─── Communications ───
export const communicationService = {
  async getAll(): Promise<Communication[]> {
    await delay();
    return [...communications].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.created_at.localeCompare(a.created_at);
    });
  },

  async getRecent(limit: number): Promise<Communication[]> {
    await delay();
    return [...communications]
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.created_at.localeCompare(a.created_at);
      })
      .slice(0, limit);
  },

  async create(data: Omit<Communication, 'id' | 'created_at'>): Promise<Communication> {
    await delay();
    const comm: Communication = { ...data, id: genId(), created_at: new Date().toISOString() };
    communications.push(comm);
    return comm;
  },

  async update(id: string, data: Partial<Communication>): Promise<Communication> {
    await delay();
    const idx = communications.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Comunicazione non trovata');
    communications[idx] = { ...communications[idx], ...data };
    return communications[idx];
  },

  async remove(id: string): Promise<void> {
    await delay();
    communications = communications.filter((c) => c.id !== id);
  },
};

// ─── Attendance ───
export const attendanceService = {
  async getPlayerDetail(playerId: string): Promise<PlayerAttendanceDetail> {
    await delay();
    const playerConvs = convocazioni.filter((c) => c.player_id === playerId);
    // For training events, present by default unless explicitly declined
    const trainingEvents = events.filter((e) => e.event_type === 'allenamento');
    let present = 0;
    let absent = 0;
    let pending = 0;
    let total = 0;

    // Training: auto-invited, present by default
    for (const tev of trainingEvents) {
      const c = playerConvs.find((pc) => pc.event_id === tev.id);
      total++;
      if (!c || c.response === 'confermato') present++;
      else if (c.response === 'declinato') absent++;
      else pending++;
    }
    // Non-training: use convocation responses
    const nonTrainingConvs = playerConvs.filter((c) => {
      const ev = events.find((e) => e.id === c.event_id);
      return ev && ev.event_type !== 'allenamento';
    });
    for (const c of nonTrainingConvs) {
      total++;
      if (c.response === 'confermato') present++;
      else if (c.response === 'declinato') absent++;
      else pending++;
    }

    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    const byType = (type: EventType) => {
      if (type === 'allenamento') {
        const tEvents = trainingEvents;
        const t = tEvents.length;
        const p = tEvents.filter((tev) => {
          const c = playerConvs.find((pc) => pc.event_id === tev.id);
          return !c || c.response === 'confermato';
        }).length;
        return { total: t, present: p, rate: t > 0 ? Math.round((p / t) * 100) : 0 };
      }
      const typeConvs = nonTrainingConvs.filter((c) => {
        const ev = events.find((e) => e.id === c.event_id);
        return ev?.event_type === type;
      });
      const t = typeConvs.length;
      const p = typeConvs.filter((c) => c.response === 'confermato').length;
      return { total: t, present: p, rate: t > 0 ? Math.round((p / t) * 100) : 0 };
    };

    const recentAttended = [
      ...trainingEvents.filter((tev) => {
        const c = playerConvs.find((pc) => pc.event_id === tev.id);
        return !c || c.response === 'confermato';
      }).map((ev) => ({ eventId: ev.id, eventTitle: ev.title, date: ev.date, eventType: ev.event_type })),
      ...nonTrainingConvs.filter((c) => c.response === 'confermato').map((c) => {
        const ev = events.find((e) => e.id === c.event_id)!;
        return { eventId: ev.id, eventTitle: ev.title, date: ev.date, eventType: ev.event_type };
      }),
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    return {
      playerId,
      total,
      present,
      absent,
      pending,
      rate,
      training: byType('allenamento'),
      match: byType('partita'),
      tournament: byType('torneo'),
      recentAttended,
    };
  },

  async getTeamStats(): Promise<TeamAttendanceStats> {
    await delay();
    const activePlayers = players.filter((p) => p.active);
    const playerDetails = await Promise.all(activePlayers.map((p) => this.getPlayerDetail(p.id)));

    const rates = playerDetails.map((d) => d.rate).filter((r) => r > 0);
    const averageRate = rates.length > 0 ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;
    const totalPresent = playerDetails.reduce((sum, d) => sum + d.present, 0);
    const totalAbsent = playerDetails.reduce((sum, d) => sum + d.absent, 0);
    const totalPending = playerDetails.reduce((sum, d) => sum + d.pending, 0);

    const mostPresent = activePlayers
      .map((player, i) => ({ player, rate: playerDetails[i].rate, present: playerDetails[i].present }))
      .filter((x) => x.present > 0)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);

    const pendingConfirmations = activePlayers
      .map((player, i) => ({ player, count: playerDetails[i].pending }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);

    // Monthly trend
    const monthMap: Record<string, { present: number; absent: number; total: number }> = {};
    for (const c of convocazioni) {
      const ev = events.find((e) => e.id === c.event_id);
      if (!ev) continue;
      const monthKey = ev.date.slice(0, 7);
      if (!monthMap[monthKey]) monthMap[monthKey] = { present: 0, absent: 0, total: 0 };
      monthMap[monthKey].total++;
      if (c.response === 'confermato') monthMap[monthKey].present++;
      if (c.response === 'declinato') monthMap[monthKey].absent++;
    }
    const monthLabels = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    const monthlyTrend = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({
        month: key,
        label: monthLabels[parseInt(key.slice(5)) - 1] || key,
        rate: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
        present: v.present,
        absent: v.absent,
      }));

    return { averageRate, totalPresent, totalAbsent, totalPending, mostPresent, pendingConfirmations, monthlyTrend };
  },

  async getAttendanceByEvent(eventId?: string, monthFilter?: string, typeFilter?: string): Promise<AttendanceByEvent[]> {
    await delay();
    let filteredEvents = [...events];
    if (eventId) filteredEvents = filteredEvents.filter((e) => e.id === eventId);
    if (monthFilter) filteredEvents = filteredEvents.filter((e) => e.date.slice(0, 7) === monthFilter);
    if (typeFilter && typeFilter !== 'all') filteredEvents = filteredEvents.filter((e) => e.event_type === typeFilter);

    filteredEvents.sort((a, b) => b.date.localeCompare(a.date));

    const result: AttendanceByEvent[] = [];
    for (const ev of filteredEvents) {
      const isTraining = ev.event_type === 'allenamento';
      let records = convocazioni
        .filter((c) => c.event_id === ev.id)
        .map((c) => ({ ...c, player: players.find((p) => p.id === c.player_id)! }))
        .filter((c) => c.player)
        .sort((a, b) => a.player.surname.localeCompare(b.player.surname));

      let summary: ConvocationSummary;
      if (isTraining) {
        // Training: all active players auto-invited, present by default
        const activePlayers = players.filter((p) => p.active);
        const total = activePlayers.length;
        const present = activePlayers.filter((p) => {
          const c = records.find((r) => r.player_id === p.id);
          return !c || c.response === 'confermato';
        }).length;
        const absent = activePlayers.filter((p) => {
          const c = records.find((r) => r.player_id === p.id);
          return c && c.response === 'declinato';
        }).length;
        summary = {
          invited: total, confirmed: present, declined: absent, pending: 0, inDubbio: 0,
          confirmedPct: total > 0 ? Math.round((present / total) * 100) : 0,
          declinedPct: total > 0 ? Math.round((absent / total) * 100) : 0,
          pendingPct: 0,
        };
      } else {
        const convocati = records.filter((c) => c.status === 'convocato');
        const invited = convocati.length;
        const confirmed = convocati.filter((c) => c.response === 'confermato').length;
        const declined = convocati.filter((c) => c.response === 'declinato').length;
        const pending = convocati.filter((c) => c.response === 'in_attesa').length;
        const inDubbio = records.filter((c) => c.status === 'in_dubbio').length;
        const total = invited || 1;
        summary = {
          invited, confirmed, declined, pending, inDubbio,
          confirmedPct: Math.round((confirmed / total) * 100),
          declinedPct: Math.round((declined / total) * 100),
          pendingPct: Math.round((pending / total) * 100),
        };
      }
      result.push({ event: ev, summary, records });
    }
    return result;
  },

  async getAttendanceByPlayer(monthFilter?: string, typeFilter?: string): Promise<AttendanceByPlayer[]> {
    await delay();
    const activePlayers = players.filter((p) => p.active);

    let filteredEventIds = new Set(events.map((e) => e.id));
    if (monthFilter) filteredEventIds = new Set(events.filter((e) => e.date.slice(0, 7) === monthFilter).map((e) => e.id));
    if (typeFilter && typeFilter !== 'all') filteredEventIds = new Set(events.filter((e) => e.event_type === typeFilter).map((e) => e.id));

    const result: AttendanceByPlayer[] = [];
    for (const player of activePlayers) {
      const playerConvs = convocazioni.filter((c) => c.player_id === player.id && filteredEventIds.has(c.event_id));
      const total = playerConvs.length;
      const present = playerConvs.filter((c) => c.response === 'confermato').length;
      const absent = playerConvs.filter((c) => c.response === 'declinato').length;
      const pending = playerConvs.filter((c) => c.response === 'in_attesa').length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      result.push({
        player,
        detail: { playerId: player.id, total, present, absent, pending, rate, training: { total: 0, present: 0, rate: 0 }, match: { total: 0, present: 0, rate: 0 }, tournament: { total: 0, present: 0, rate: 0 }, recentAttended: [] },
      });
    }
    return result.sort((a, b) => b.detail.rate - a.detail.rate);
  },

  async getCoachAlerts(): Promise<CoachAttendanceAlerts> {
    await delay();
    const today = new Date().toISOString().slice(0, 10);
    const upcomingEvents = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));

    // Missing confirmations
    const missingConfirmations: { player: Player; eventName: string; eventId: string; eventDate: string }[] = [];
    for (const ev of upcomingEvents) {
      const pending = convocazioni
        .filter((c) => c.event_id === ev.id && c.response === 'in_attesa' && c.status === 'convocato')
        .map((c) => ({ ...c, player: players.find((p) => p.id === c.player_id)! }))
        .filter((c) => c.player);
      for (const c of pending) {
        missingConfirmations.push({ player: c.player, eventName: ev.title, eventId: ev.id, eventDate: ev.date });
      }
    }

    // Frequent absences
    const activePlayers = players.filter((p) => p.active);
    const frequentAbsences = activePlayers
      .map((player) => {
        const playerConvs = convocazioni.filter((c) => c.player_id === player.id);
        const absentCount = playerConvs.filter((c) => c.response === 'declinato').length;
        const totalEvents = playerConvs.length;
        const rate = totalEvents > 0 ? Math.round((absentCount / totalEvents) * 100) : 0;
        return { player, absentCount, totalEvents, rate };
      })
      .filter((x) => x.absentCount > 0)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 5);

    // Unavailable for next events (declined or planned absence)
    const unavailableNext: { player: Player; eventName: string; eventId: string }[] = [];
    for (const ev of upcomingEvents.slice(0, 3)) {
      const declined = convocazioni
        .filter((c) => c.event_id === ev.id && c.response === 'declinato')
        .map((c) => ({ ...c, player: players.find((p) => p.id === c.player_id)! }))
        .filter((c) => c.player);
      for (const c of declined) {
        unavailableNext.push({ player: c.player, eventName: ev.title, eventId: ev.id });
      }
      // Also check planned absences
      const absentPlayers = plannedAbsences
        .filter((a) => a.start_date <= ev.date && a.end_date >= ev.date)
        .map((a) => ({ player: players.find((p) => p.id === a.player_id)!, reason: a.reason }))
        .filter((a) => a.player && !unavailableNext.some((u) => u.player.id === a.player.id && u.eventId === ev.id));
      for (const a of absentPlayers) {
        unavailableNext.push({ player: a.player, eventName: ev.title, eventId: ev.id });
      }
    }

    return { missingConfirmations, frequentAbsences, unavailableNext };
  },

};

// ─── Planned Absences ───
let plannedAbsences: PlannedAbsence[] = [...mockPlannedAbsences];

export const absenceService = {
  async getByPlayer(playerId: string): Promise<PlannedAbsence[]> {
    await delay();
    return plannedAbsences.filter((a) => a.player_id === playerId).sort((a, b) => b.start_date.localeCompare(a.start_date));
  },

  async getActive(): Promise<PlannedAbsenceWithPlayer[]> {
    await delay();
    const today = new Date().toISOString().slice(0, 10);
    return plannedAbsences
      .filter((a) => a.end_date >= today)
      .map((a) => ({ ...a, player: players.find((p) => p.id === a.player_id)! }))
      .filter((a) => a.player)
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
  },

};

// ─── Availability Service ──────────────────────────────────────────────
let availabilities: Availability[] = [...mockAvailabilities];

export const availabilityService = {
  async getByEventId(eventId: string): Promise<AvailabilityWithPlayer[]> {
    await delay();
    return availabilities
      .filter((a) => a.event_id === eventId)
      .map((a) => {
        const player = mockPlayers.find((p) => p.id === a.player_id);
        return { ...a, player: player! };
      })
      .filter((a) => a.player);
  },

  async getSummary(eventId: string): Promise<AvailabilitySummary> {
    await delay();
    const eventAvs = availabilities.filter((a) => a.event_id === eventId);
    const activePlayers = mockPlayers.filter((p) => p.active);
    const unavailable = eventAvs.filter((a) => a.status === 'non_disponibile').length;
    const available = activePlayers.length - unavailable;
    return {
      available,
      unavailable,
      total: activePlayers.length,
    };
  },

  async getUpcomingWithAvailability(): Promise<AvailabilityByEventItem[]> {
    await delay();
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = mockEvents.filter((e) => e.date >= today && requiresAvailability(e.event_type));
    const result: AvailabilityByEventItem[] = [];
    for (const event of upcoming) {
      const eventAvs = availabilities.filter((a) => a.event_id === event.id);
      const activePlayers = mockPlayers.filter((p) => p.active);
      const unavailable = eventAvs.filter((a) => a.status === 'non_disponibile').length;
      const available = activePlayers.length - unavailable;
      result.push({
        event,
        summary: { available, unavailable, total: activePlayers.length },
      });
    }
    return result.sort((a, b) => a.event.date.localeCompare(b.event.date));
  },

  async setAvailability(
    eventId: string,
    playerId: string,
    status: 'disponibile' | 'non_disponibile',
    note: string | null = null
  ): Promise<Availability> {
    await delay();
    const existing = availabilities.find((a) => a.event_id === eventId && a.player_id === playerId);
    if (status === 'disponibile') {
      // Available is the default — remove the exception record
      if (existing) {
        availabilities = availabilities.filter((a) => a.id !== existing.id);
        return { ...existing, status, note: null, updated_at: new Date().toISOString() };
      }
      // No record needed for default state
      return {
        id: `av${Date.now()}`,
        event_id: eventId,
        player_id: playerId,
        status,
        note: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    // non_disponibile: create or update exception record
    if (existing) {
      const updated = { ...existing, status, note, updated_at: new Date().toISOString() };
      availabilities = availabilities.map((a) => (a.id === existing.id ? updated : a));
      return updated;
    }
    const newAv: Availability = {
      id: `av${Date.now()}`,
      event_id: eventId,
      player_id: playerId,
      status,
      note,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    availabilities = [...availabilities, newAv];
    return newAv;
  },

  async getByEventIds(eventIds: string[]): Promise<Record<string, AvailabilityWithPlayer[]>> {
    await delay();
    const map: Record<string, AvailabilityWithPlayer[]> = {};
    for (const eventId of eventIds) {
      map[eventId] = availabilities
        .filter((a) => a.event_id === eventId)
        .map((a) => {
          const player = mockPlayers.find((p) => p.id === a.player_id);
          return { ...a, player: player! };
        })
        .filter((a) => a.player);
    }
    return map;
  },
};

// ─── Admin Settings ───
let adminSettings: AdminSettings = { ...mockAdminSettings };

export const settingsService = {
  async get(): Promise<AdminSettings> {
    await delay(50);
    return { ...adminSettings };
  },

  async update(data: Partial<AdminSettings>): Promise<AdminSettings> {
    await delay();
    adminSettings = { ...adminSettings, ...data };
    return { ...adminSettings };
  },
};

// ─── Medical Certificates ───
export const certificateService = {
  async getExpiringOrExpired(thresholdDays?: number): Promise<Player[]> {
    await delay(50);
    const threshold = thresholdDays ?? adminSettings.expiring_soon_threshold;
    return players
      .filter((p) => p.active)
      .filter((p) => {
        const status = getCertificateStatus(p.medical_certificate_date, threshold);
        return status === 'expiring_soon' || status === 'expired' || status === 'missing';
      })
      .sort((a, b) => a.surname.localeCompare(b.surname));
  },

};
