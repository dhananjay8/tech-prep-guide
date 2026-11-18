# Build a Seat Booking Interface

## Interview Prompt
Build a seat map where users can select available seats, see a price summary, and reserve their selection.

## Clarify First
- Can users select adjacent seats only, or any available seats?
- Do prices vary by seat section?
- Is selection held temporarily while the user checks out?

## Selection State
```javascript
function toggleSeat(selected, seat) {
  if (seat.status !== 'available') return selected;
  const next = new Set(selected);
  if (next.has(seat.id)) next.delete(seat.id);
  else next.add(seat.id);
  return next;
}

const totalCents = seats
  .filter(seat => selectedIds.has(seat.id))
  .reduce((sum, seat) => sum + seat.priceCents, 0);
```

## Interview Answer
- Model each seat with a stable ID, section, status, and integer price in minor units.
- Use a `Set` for selected seat IDs and derive the displayed total from the latest seat data.
- Render unavailable seats as disabled buttons with accessible labels; do not communicate state using color alone.
- On reserve, send selected IDs with an idempotency key. The server must atomically verify availability and return conflicts.
- Explain the race: another customer may reserve a seat between rendering and checkout. Refresh conflicted seats and let the user choose again.
- Add an expiring server-side hold for checkout; client timers are display hints, not reservation authority.
