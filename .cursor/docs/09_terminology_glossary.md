# Terminologija (UI) — odsutnost

Ovaj dokument standardizira **korisničku terminologiju**. Cilj je da aplikacija izgleda kao normalno **planiranje odsutnosti** (godišnji, bolovanje, slobodni dani…), bez knjigovodstvenih termina.

## Osnovni pojmovi (što korisnik vidi)

- **Odsutnost**: umbrella pojam za sve situacije kada zaposlenik nije dostupan za rad (npr. godišnji, bolovanje, edukacija, slobodan dan).
- **Vrsta odsutnosti** (`UnavailabilityReason`): konfigurirana vrsta odsutnosti (npr. “Godišnji odmor”, “Bolovanje”). Definira pravila (treba li odobrenje, troši li dane, itd.).
- **Zahtjev za odsutnost** (`Application`): korisnički zahtjev za odsutnost u određenom periodu (može imati odobrenja).
- **Plan / Kalendar odsutnosti** (`DaySchedule`): stvarni upis po danu koji predstavlja “što je u planu” za taj datum (iz odobrenog zahtjeva ili drugih flowova).
- **Stanje dana**: korisnički prikaz koliko dana postoji za određenu **vrstu odsutnosti** i godinu.

## Standardni nazivi u prikazu “Stanje dana”
U prikazima “Stanje dana” korisnik želi odgovor na pitanje: **koliko dana ima na raspolaganju u godini**.

Da bi UI bio intuitivan i konzistentan (posebno kad postoji prijenos iz prethodne godine), preporučeni nazivi su:
- **Ukupno na raspolaganju**: “pravo za godinu” (uključuje osnovnu dodjelu + prenesene dane + ispravke)
- **Iskorišteno**
- **Na čekanju**
- **Preostalo**

Napomena:
- Ako UI prikaže samo osnovnu dodjelu (`ALLOCATION`) kao "Dodijeljeno", može doći do zbunjujućih prikaza tipa "Dodijeljeno 20 / Preostalo 25" kad je dio dana prenesen u novu godinu (prijenos se u novoj godini pojavljuje kao `TRANSFER` entry).
- Kanonska definicija “Ukupno na raspolaganju” je dokumentirana u `/.cursor/docs/06_ledger_rules.md` (sekcija 5.1).

## Pravilo: UI terminologija vs internal mehanizam

- UI copy (naslovi, labeli, poruke) **ne smije koristiti**: *ledger, allocation, usage, correction, transfer, knjiženje, alokacija, saldo*.
- Interno (services + baza) se koristi ledger mehanizam (`UnavailabilityLedgerEntry`) kao **Single Source of Truth** za stanje dana.
- U UI se ledger prikazuje isključivo kroz korisničke pojmove: **Dodijeljeno / Iskorišteno / Na čekanju / Preostalo** + (opc.) “Povijest promjena”.

## Mapiranje internal pojmova (ledger) → korisnički naziv (UI)

Ako se ikada prikazuje povijest promjena, koristiti sljedeća imena:

- `ALLOCATION` → **Dodjela**
- `USAGE` → **Iskorištenje**
- `TRANSFER` → **Prijenos**
- `CORRECTION` → **Ispravak**

## Kontrolna lista (prije implementacije novih modula)

- U UI se koristi: **odsutnost**, **vrsta odsutnosti**, **zahtjev za odsutnost**, **plan/kalendar odsutnosti**, **stanje dana**.
- Nigdje u UI tekstovima ne piše: alokacija/ledger/knjiženje (ili eng. allocation/ledger).
- Dokumentacija eksplicitno razlikuje:
  - `Application` (zahtjev) vs `DaySchedule` (plan) vs `UnavailabilityLedgerEntry` (internal stanje dana).


