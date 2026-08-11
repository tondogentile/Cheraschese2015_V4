# Cheraschese 2015 Esordienti - Project Context

## Project Goal

This is a Progressive Web App for managing the Cheraschese 2015 Esordienti youth football team.

The application is inspired by SportEasy, but customized for the real workflow of the team.

The app is currently based on:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Mock data / in-memory services
- Vercel deployment

Supabase, authentication, notifications and real database integration are not implemented yet.

---

## Main Roles

The current roles are simulated.

### Coach / Allenatore

Can:

- Manage events
- Manage recurring trainings
- Manage convocations
- Manage attendance
- Manage communications
- Manage players
- View medical certificate alerts

Future:

- Assign MVP badge
- Add technical notes
- Track match results and goal scorers

### Manager / Dirigente

Currently has almost the same permissions as Coach.

Important future difference:

- Manager must not assign MVP badges.

### Parent / Genitore

Mostly read-only.

Can:

- View calendar
- View event details
- View published convocations
- View roster list
- Read communications
- Mark own child as absent for trainings
- Mark own child as not available for matches, tournaments and retreats

Future:

- Parent account will be associated with one or more players.

---

## Core Workflow Philosophy

The app follows an exception-based workflow.

Default state is positive.

Parents only report exceptions.

Examples:

- Trainings: everyone is present by default
- Matches / tournaments / retreats: everyone is available by default
- Convocations: convocated players are confirmed by default

The system should avoid "pending confirmation" workflows whenever possible.

---

## Trainings

Training events:

- No convocations
- All players present by default
- Parents report only absences
- Coach and Manager can override attendance
- Trainings can be recurring

Recurring trainings support:

- Days of week
- Start time
- End time
- Start date
- End date
- Edit only this occurrence
- Edit this and future occurrences
- Edit entire series
- Delete only this occurrence
- Delete this and future occurrences
- Delete entire series
- Exceptions such as holiday, cancellation, schedule change, special training

---

## Matches / Tournaments / Retreats

These event types use availability and convocations.

Availability:

- All players are available by default
- Only unavailable exceptions are stored
- Parents can mark own child as not available
- Coach and Manager can override availability

Convocations:

- Coach and Manager create convocations
- Convocated players are confirmed by default
- Parents report only not available / unavailable
- No pending confirmation workflow

---

## Home Page Philosophy

Home should work as an exception noticeboard.

Show only useful information requiring attention.

For Coach / Manager:

- Unavailable players for upcoming matches, tournaments, retreats
- Absent players for upcoming trainings
- Medical certificates expired or expiring soon
- Events requiring management

For Parent:

- Birthdays today if any
- Published convocations
- Next important event
- Latest communication
- Upcoming birthdays

---

## Parent Mode Rules

Parent mode needs to remain simple.

Parent should not:

- Create events
- Edit events
- Delete events
- Manage convocations
- Modify other players
- Create communications
- Edit communications
- Delete communications
- Pin communications
- Use WhatsApp share buttons

Parent should see full profile only for own child in the future.

Other players should show only limited public information:

- Name
- Shirt number
- Position

---

## Medical Certificates

Player details include:

- Last medical examination date
- Certificate notes

Certificate expiry is calculated as one year after last examination.

Statuses:

- Valid
- Expiring soon
- Expired
- Missing

Coach and Manager see alerts only for certificates requiring attention.

Admin/settings allow:

- Expiring soon threshold in days
- Future email reminder toggle
- Future WhatsApp reminder toggle

No real notifications are implemented yet.

---

## Phase 11.2: GENI Privacy Read Model (Completed)

Parent roster filtering and privacy toggles are implemented as frontend-only mock privacy simulation.

### What was done

- Parent role sees only players associated via `player_ids` on the simulated user; Coach and Manager see the full roster unchanged.
- Parent role opening a non-associated player detail route gets a friendly restricted-access card with a back-to-roster button instead of a blank page or crash.
- Roster privacy settings (shirt number, position, attendance statistics, birthdays, photos) are applied to Parent view only. Coach and Manager are unaffected by these toggles.
- A note in Admin Settings explains the privacy settings are now used by the mock parent roster/player detail view.

### Limitations

This is frontend-only mock privacy, not real security. A determined user can bypass it by changing client state. Real enforcement requires Supabase RLS policies and server-side auth, planned for a later phase.

---

## Current Deployment

The app is deployed on Vercel.

A `vercel.json` file is required for SPA routing fallback:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
  *   "destination": "/index.html"
  * }
  ]
}
