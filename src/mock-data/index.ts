import type { Player, TeamEvent, Communication, Convocazione, MockUser, PlannedAbsence, Availability, AdminSettings, PrivacySettings, ParentAssociation } from '@/types';

const today = new Date();
const todayMD = today.toISOString().slice(5, 10);

const pastDate = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

export const mockPlayers: Player[] = [
  { id: 'p1', name: 'Luca', surname: 'Rossi', number: 1, birth_date: '2014-03-15', role: 'portiere', parent1_name: 'Carlo Rossi', parent1_phone: '3331234567', parent1_email: 'carlo.rossi@email.it', parent2_name: 'Maria Rossi', parent2_phone: '3339876543', parent2_email: 'maria.rossi@email.it', notes: 'Allergia alle noci.', avatar_url: null, active: true, medical_certificate_date: pastDate(10), medical_certificate_notes: 'Certificato regolare, nessuna restrizione.', created_at: '2025-09-01T10:00:00Z' },
  { id: 'p2', name: 'Marco', surname: 'Bianchi', number: 4, birth_date: `2014-${todayMD}`, role: 'difensore', parent1_name: 'Gianni Bianchi', parent1_phone: '3332345678', parent1_email: 'gianni.bianchi@email.it', parent2_name: 'Elena Bianchi', parent2_phone: '3341112233', parent2_email: 'elena.bianchi@email.it', notes: null, avatar_url: null, active: true, medical_certificate_date: pastDate(340), medical_certificate_notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'p3', name: 'Giuseppe', surname: 'Verdi', number: 5, birth_date: '2014-01-10', role: 'difensore', parent1_name: 'Antonio Verdi', parent1_phone: '3333456789', parent1_email: 'antonio.verdi@email.it', parent2_name: null, parent2_phone: null, parent2_email: null, notes: null, avatar_url: null, active: true, medical_certificate_date: pastDate(400), medical_certificate_notes: 'Scaduto - contattare famiglia per rinnovo.', created_at: '2025-09-01T10:00:00Z' },
  { id: 'p4', name: 'Andrea', surname: 'Ferrari', number: 7, birth_date: '2014-07-18', role: 'centrocampista', parent1_name: 'Roberto Ferrari', parent1_phone: '3334567890', parent1_email: 'roberto.ferrari@email.it', parent2_name: 'Chiara Ferrari', parent2_phone: '3345556677', parent2_email: 'chiara.ferrari@email.it', notes: null, avatar_url: null, active: true, medical_certificate_date: pastDate(350), medical_certificate_notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'p5', name: 'Francesco', surname: 'Galli', number: 8, birth_date: `2014-${todayMD}`, role: 'centrocampista', parent1_name: 'Stefano Galli', parent1_phone: '3335678901', parent1_email: 'stefano.galli@email.it', parent2_name: 'Giulia Galli', parent2_phone: '3347778899', parent2_email: 'giulia.galli@email.it', notes: 'Asma - porta inalatore.', avatar_url: null, active: true, medical_certificate_date: pastDate(20), medical_certificate_notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'p6', name: 'Alessandro', surname: 'Conti', number: 10, birth_date: '2014-04-12', role: 'attaccante', parent1_name: 'Franco Conti', parent1_phone: '3336789012', parent1_email: 'franco.conti@email.it', parent2_name: 'Sara Conti', parent2_phone: '3342223344', parent2_email: 'sara.conti@email.it', notes: null, avatar_url: null, active: true, medical_certificate_date: pastDate(5), medical_certificate_notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'p7', name: 'Matteo', surname: 'Russo', number: 9, birth_date: '2014-06-30', role: 'attaccante', parent1_name: 'Paolo Russo', parent1_phone: '3337890123', parent1_email: 'paolo.russo@email.it', parent2_name: 'Anna Russo', parent2_phone: '3343334455', parent2_email: 'anna.russo@email.it', notes: null, avatar_url: null, active: true, medical_certificate_date: null, medical_certificate_notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'p8', name: 'Davide', surname: 'Marino', number: 3, birth_date: '2014-08-14', role: 'difensore', parent1_name: 'Luigi Marino', parent1_phone: '3338901234', parent1_email: 'luigi.marino@email.it', parent2_name: null, parent2_phone: null, parent2_email: null, notes: null, avatar_url: null, active: true, medical_certificate_date: pastDate(60), medical_certificate_notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'p9', name: 'Lorenzo', surname: 'Greco', number: 6, birth_date: '2014-09-05', role: 'centrocampista', parent1_name: 'Maurizio Greco', parent1_phone: '3339012345', parent1_email: 'maurizio.greco@email.it', parent2_name: 'Franca Greco', parent2_phone: '3346667788', parent2_email: 'franca.greco@email.it', notes: 'Recupero infortunio caviglia.', avatar_url: null, active: true, medical_certificate_date: pastDate(355), medical_certificate_notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'p10', name: 'Federico', surname: 'Bruno', number: 2, birth_date: '2014-11-20', role: 'difensore', parent1_name: 'Diego Bruno', parent1_phone: '3340123456', parent1_email: 'diego.bruno@email.it', parent2_name: 'Marta Bruno', parent2_phone: '3348889900', parent2_email: 'marta.bruno@email.it', notes: null, avatar_url: null, active: true, medical_certificate_date: pastDate(200), medical_certificate_notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'p11', name: 'Giovanni', surname: 'Costa', number: 11, birth_date: '2014-10-08', role: 'attaccante', parent1_name: 'Vittorio Costa', parent1_phone: '3341234567', parent1_email: 'vittorio.costa@email.it', parent2_name: 'Luisa Costa', parent2_phone: '3349990011', parent2_email: 'luisa.costa@email.it', notes: null, avatar_url: null, active: true, medical_certificate_date: pastDate(15), medical_certificate_notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'p12', name: 'Simone', surname: 'Mancini', number: 12, birth_date: '2014-12-01', role: 'portiere', parent1_name: 'Enrico Mancini', parent1_phone: '3342345678', parent1_email: 'enrico.mancini@email.it', parent2_name: null, parent2_phone: null, parent2_email: null, notes: null, avatar_url: null, active: true, medical_certificate_date: pastDate(365), medical_certificate_notes: null, created_at: '2025-09-01T10:00:00Z' },
];

const futureDate = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const mockEvents: TeamEvent[] = [
  { id: 'e1', title: 'Allenamento settimanale', event_type: 'allenamento', date: futureDate(2), meeting_time: '16:45', time_start: '17:00', time_end: '18:30', time_of_day: 'pomeriggio', location: 'Campo Sportivo Cheraschese, Cherasco', description: 'Allenamento tecnico-tattico. Portare borraccia e parastinchi.', opponent: null, status: 'programmato', created_at: '2025-09-01T10:00:00Z', series_id: null, original_date: null, is_exception: false, exception_type: null },
  { id: 'e2', title: 'Allenamento tecnico', event_type: 'allenamento', date: futureDate(5), meeting_time: '16:45', time_start: '17:00', time_end: '18:30', time_of_day: 'pomeriggio', location: 'Campo Sportivo Cheraschese, Cherasco', description: 'Lavoro su schemi e finalizzazione.', opponent: null, status: 'programmato', created_at: '2025-09-01T10:00:00Z', series_id: null, original_date: null, is_exception: false, exception_type: null },
  { id: 'e3', title: 'Cheraschese vs ASD Ciriè', event_type: 'partita', date: futureDate(7), meeting_time: '14:15', time_start: '15:00', time_end: '16:30', time_of_day: 'pomeriggio', location: 'Campo Sportivo Cheraschese, Cherasco', description: 'Amichevole pre-campionato. Ritrovo spogliatoio 30 minuti prima.', opponent: 'ASD Ciriè', status: 'programmato', created_at: '2025-09-01T10:00:00Z', series_id: null, original_date: null, is_exception: false, exception_type: null },
  { id: 'e4', title: 'Torneo Città di Cherasco', event_type: 'torneo', date: futureDate(13), meeting_time: '08:30', time_start: '09:00', time_end: null, time_of_day: 'mattino', location: 'Centro Sportivo Comunale, Cherasco', description: 'Torneo giovanile - 3 partite. Premiazione al termine.', opponent: null, status: 'programmato', created_at: '2025-09-01T10:00:00Z', series_id: null, original_date: null, is_exception: false, exception_type: null },
  { id: 'e5', title: 'Allenamento pre-partita', event_type: 'allenamento', date: futureDate(14), meeting_time: '17:45', time_start: '18:00', time_end: '19:30', time_of_day: 'sera', location: 'Campo Sportivo Cheraschese, Cherasco', description: 'Ultimo allenamento prima della partita.', opponent: null, status: 'programmato', created_at: '2025-09-01T10:00:00Z', series_id: null, original_date: null, is_exception: false, exception_type: null },
  { id: 'e6', title: 'Cheraschese vs ASD Bra', event_type: 'partita', date: futureDate(21), meeting_time: '14:15', time_start: '15:00', time_end: '16:30', time_of_day: 'pomeriggio', location: 'Campo Sportivo Cheraschese, Cherasco', description: 'Prima di campionato.', opponent: 'ASD Bra', status: 'programmato', created_at: '2025-09-01T10:00:00Z', series_id: null, original_date: null, is_exception: false, exception_type: null },
  { id: 'e7', title: 'Ritiro pre-campionato', event_type: 'ritiro', date: futureDate(27), meeting_time: null, time_start: null, time_end: null, time_of_day: 'full_day', location: 'Centro Sportivo Comunale, Cherasco', description: 'Ritiro di due giorni con pernottamento. Programma dettaglio su comunicazione dedicata.', opponent: null, status: 'programmato', created_at: '2025-09-01T10:00:00Z', series_id: null, original_date: null, is_exception: false, exception_type: null },
];

export const mockCommunications: Communication[] = [
  { id: 'c1', title: 'Benvenuti nella nuova stagione!', body: 'Ciao a tutti, benvenuti nella gestione della squadra esordienti del Cheraschese 2015. Qui troverete calendario, convocazioni e comunicazioni. Forza Cheraschese!', priority: 'importante', pinned: true, created_at: '2025-09-01T10:00:00Z' },
  { id: 'c2', title: 'Allenamento di mercoledì', body: 'Ricordo a tutti che l\'allenamento di mercoledì è confermato alle 17:00 al campo. Portare abbigliamento sportivo e borraccia.', priority: 'normale', pinned: false, created_at: '2025-09-02T08:00:00Z' },
  { id: 'c3', title: 'Convocazioni torneo', body: 'Le convocazioni per il torneo di Cherasco saranno pubblicate entro giovedì. Verificate la sezione Convocazioni.', priority: 'urgente', pinned: false, created_at: '2025-09-03T14:00:00Z' },
];

export const mockConvocazioni: Convocazione[] = [
  // Event e3 - Partita vs Ciriè
  { id: 'cv1', event_id: 'e3', player_id: 'p1', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv2', event_id: 'e3', player_id: 'p2', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv3', event_id: 'e3', player_id: 'p3', status: 'convocato', response: 'declinato', notes: 'Impegno di famiglia', created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv4', event_id: 'e3', player_id: 'p4', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv5', event_id: 'e3', player_id: 'p5', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv6', event_id: 'e3', player_id: 'p6', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv7', event_id: 'e3', player_id: 'p7', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv8', event_id: 'e3', player_id: 'p8', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv9', event_id: 'e3', player_id: 'p9', status: 'in_dubbio', response: 'confermato', notes: 'Recupero infortunio', created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv10', event_id: 'e3', player_id: 'p10', status: 'convocato', response: 'declinato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv11', event_id: 'e3', player_id: 'p11', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  // Event e1 - Allenamento (auto-invited, present by default, absent if reported)
  { id: 'cv12', event_id: 'e1', player_id: 'p1', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv13', event_id: 'e1', player_id: 'p2', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv14', event_id: 'e1', player_id: 'p3', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv15', event_id: 'e1', player_id: 'p4', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv16', event_id: 'e1', player_id: 'p5', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv17', event_id: 'e1', player_id: 'p6', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00Z' },
  { id: 'cv18', event_id: 'e1', player_id: 'p7', status: 'convocato', response: 'declinato', notes: 'Malattia', created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv19', event_id: 'e1', player_id: 'p8', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv20', event_id: 'e1', player_id: 'p9', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv21', event_id: 'e1', player_id: 'p10', status: 'convocato', response: 'declinato', notes: 'Impegno famiglia', created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv22', event_id: 'e1', player_id: 'p11', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv23', event_id: 'e1', player_id: 'p12', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  // Event e2 - Allenamento (all present by default)
  { id: 'cv24', event_id: 'e2', player_id: 'p1', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv25', event_id: 'e2', player_id: 'p2', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv26', event_id: 'e2', player_id: 'p3', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv27', event_id: 'e2', player_id: 'p4', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv28', event_id: 'e2', player_id: 'p5', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv29', event_id: 'e2', player_id: 'p6', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv30', event_id: 'e2', player_id: 'p7', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv31', event_id: 'e2', player_id: 'p8', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv32', event_id: 'e2', player_id: 'p9', status: 'convocato', response: 'declinato', notes: 'Recupero infortunio', created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv33', event_id: 'e2', player_id: 'p10', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv34', event_id: 'e2', player_id: 'p11', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv35', event_id: 'e2', player_id: 'p12', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  // Event e5 - Allenamento pre-partita
  { id: 'cv36', event_id: 'e5', player_id: 'p1', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv37', event_id: 'e5', player_id: 'p2', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv38', event_id: 'e5', player_id: 'p3', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv39', event_id: 'e5', player_id: 'p4', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv40', event_id: 'e5', player_id: 'p5', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv41', event_id: 'e5', player_id: 'p6', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv42', event_id: 'e5', player_id: 'p7', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv43', event_id: 'e5', player_id: 'p8', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv44', event_id: 'e5', player_id: 'p9', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv45', event_id: 'e5', player_id: 'p10', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv46', event_id: 'e5', player_id: 'p11', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv47', event_id: 'e5', player_id: 'p12', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  // Event e4 - Torneo
  { id: 'cv48', event_id: 'e4', player_id: 'p1', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv49', event_id: 'e4', player_id: 'p6', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv50', event_id: 'e4', player_id: 'p7', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
  { id: 'cv51', event_id: 'e4', player_id: 'p11', status: 'convocato', response: 'confermato', notes: null, created_at: '2025-09-01T10:00:00Z' },
];

export const mockPlannedAbsences: PlannedAbsence[] = [
  { id: 'pa1', player_id: 'p9', start_date: futureDate(3), end_date: futureDate(18), reason: 'infortunio', notes: 'Recupero infortunio caviglia - prevista visita fisioterapista', created_at: '2025-09-01T10:00:00Z' },
  { id: 'pa2', player_id: 'p10', start_date: futureDate(10), end_date: futureDate(20), reason: 'vacanza', notes: 'Vacanza famiglia al mare', created_at: '2025-09-01T10:00:00Z' },
  { id: 'pa3', player_id: 'p7', start_date: futureDate(6), end_date: futureDate(6), reason: 'scuola', notes: 'Gita scolastica', created_at: '2025-09-01T10:00:00Z' },
  { id: 'pa4', player_id: 'p3', start_date: futureDate(15), end_date: futureDate(25), reason: 'vacanza', notes: null, created_at: '2025-09-01T10:00:00Z' },
];

export const mockAvailabilities: Availability[] = [
  // Only exceptions (non_disponibile) are tracked. All other players are available by default.
  // Match e3 (Cheraschese vs ASD Ciriè)
  { id: 'av3', event_id: 'e3', player_id: 'p3', status: 'non_disponibile', note: 'Visita medica', created_at: '2025-09-01T12:00:00Z', updated_at: '2025-09-01T12:00:00Z' },
  { id: 'av6', event_id: 'e3', player_id: 'p6', status: 'non_disponibile', note: 'Famiglia fuori', created_at: '2025-09-02T11:00:00Z', updated_at: '2025-09-02T11:00:00Z' },
  // Tournament e4 (Torneo Città di Cherasco)
  { id: 'av12', event_id: 'e4', player_id: 'p7', status: 'non_disponibile', note: 'Gita scolastica', created_at: '2025-09-03T11:00:00Z', updated_at: '2025-09-03T11:00:00Z' },
];

export const mockAdminSettings: AdminSettings = {
  expiring_soon_threshold: 30,
  email_reminder_enabled: false,
  whatsapp_reminder_enabled: false,
};

export const mockPrivacySettings: PrivacySettings = {
  parents_can_view_shirt_number: true,
  parents_can_view_position: true,
  parents_can_view_attendance_stats: false,
  parents_can_view_birthdays: true,
  parents_can_view_photos: false,
};

export const mockParentAssociations: ParentAssociation[] = [
  { parent_id: 'u3', parent_name: 'Carlo Rossi', player_id: 'p1', player_name: 'Luca Rossi' },
  { parent_id: 'u4', parent_name: 'Gianni Bianchi', player_id: 'p2', player_name: 'Marco Bianchi' },
  { parent_id: 'u5', parent_name: 'Paolo Verdi', player_id: 'p3', player_name: 'Giuseppe Verdi' },
  { parent_id: 'u6', parent_name: 'Stefano Neri', player_id: 'p4', player_name: 'Andrea Ferrari' },
];

export const mockUsers: MockUser[] = [
  { id: 'u1', name: 'Allenatore Marco', role: 'coach' },
  { id: 'u2', name: 'Dirigente Luca', role: 'manager' },
  { id: 'u3', name: 'Carlo Rossi', role: 'parent', player_ids: ['p1'] },
  { id: 'u4', name: 'Gianni Bianchi', role: 'parent', player_ids: ['p2'] },
  { id: 'u5', name: 'Paolo Verdi', role: 'parent', player_ids: ['p3'] },
  { id: 'u6', name: 'Stefano Neri', role: 'parent', player_ids: ['p4'] },
];
