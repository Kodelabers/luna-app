# Datumi i vremenske zone (sažetak)

Ovaj projekt mora poštovati `/.cursor/docs/spec.md`:
- DB `DateTime` se tretira kao **UTC**
- UI radi prikaz u **clientTimeZone** (IANA tz, npr. `Europe/Zagreb`)

## Pravila
- **UI → server**:
  - korisnik odabere datum(e) u lokalnoj zoni
  - prije spremanja i prije Prisma upita napraviti konverziju u UTC granice
- **server → UI**:
  - čitati UTC iz baze
  - konvertirati u client TZ za prikaz (`Intl`/date utils)

## Query pravilo za “mjesec”
Za `month/year + clientTimeZone`:
- izračunati `localStart` (prvi dan mjeseca 00:00) i `localEnd` (prvi dan idućeg mjeseca 00:00)
- konvertirati u `utcStart/utcEnd`
- query: `date >= utcStart AND date < utcEnd`


