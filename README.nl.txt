HR-energy integratie voor Homey.

Bedien en monitor je HR-energy Qube warmtepomp rechtstreeks vanuit Homey via Modbus TCP.

Functies:
- Realtime sensordata: aanvoer-, retour-, bron in/uit-, kamer-, warmwater- en buitentemperatuur
- Afgeleide metrieken: Verwarming ΔT (aanvoer − retour), Bron ΔT (bron in − bron uit), Runtime-efficiëntie (thermische kWh / verwarmingsuren)
- Waterdebiet, COP (efficiëntie), elektrisch en thermisch vermogen, energieverbruik
- Monitoring van thermische energieproductie
- Compressorsnelheid, compressorvraag en bedrijfsuren (warmwater, verwarming, koeling)
- Berekende setpoints: warmtepomp aanvoer-, koelings- en warmwatersetpoints zoals berekend door de regelaar
- Digitale uitgangen: bronpomp, CV-pomp, buffervat pomp, kleppen, bijverwarming (1/2/3)
- Regelstatusindicatoren: anti-legionella, BMS-vraag, dag/nacht modus, warmwaterregeling, warmwaterprogramma, stooklijn, PV-overschot, SG Ready modus, interne thermostaatvraag
- Seizoensmodus regeling (Winter/Zomer)
- Dag/nacht verwarmings- en koelingssetpoints
- Warmwatersetpoint instelling
- Geaggregeerde alarmstatus plus 9 individuele alarmindicatoren (globaal, debiet, verwarming, koeling, bron, gebruiker, legionella time-out, warmwater time-out, bedrijfsuren)
- Nauwkeurige unitstatus-decodering via ruwe Modbus-waarden 1–22 (stand-by, verwarmen, koelen, warmwater verwarmen, alarm, toetsenbord uit, compressor start/stop, start mislukt)
- 12 apparaat-statusindicatoren (alarm_generic, measure_* prefix) selecteerbaar op de apparaattegel
- 58 apparaatmogelijkheden in totaal
- 14 aangepaste flow-triggerkaarten: unitstatus gewijzigd, alarmstatus gewijzigd (met AAN/UIT-tags), plus per-metriek wijzigingstriggers voor alle temperaturen, COP, vermogen en afgeleide metrieken
- 25 automatisch gegenereerde triggerkaarten (Homey SDK): drempelwaarde-triggers (wordt groter/kleiner dan) voor alle measure_*-mogelijkheden en alarm aan/uit-triggers voor alarm_generic
- 14 aangepaste flow-conditiekaarten met inversie-ondersteuning (is/is niet): unitstatus, alarm, plus operator-gebaseerde condities voor alle temperaturen, COP, vermogen en afgeleide metrieken
- 1 automatisch gegenereerde conditiekaart (Homey SDK): generiek alarm is aan
- 11 flow-actiekaarten: BMS-vraagsturing, seizoensmodus, verwarmings-/koelingssetpoints (dag/nacht), warmwatersetpoint, warmwaterprogramma forceren, warmwaterprogramma AAN/UIT, anti-legionellacyclus forceren, stooklijn, SG Ready modus, geavanceerd Modbus schrijven
- Volledig gelokaliseerd in het Engels en Nederlands

Ondersteunde apparaten:
- HR-energy Qube warmtepomp (Modbus TCP-verbinding vereist)

Installatie:
1. Installeer de app op je Homey
2. Voeg een nieuw apparaat toe: HR-energy > Qube
3. De installatiewizard vraagt om IP-adres, poort (standaard 502), Modbus unit-ID (standaard 1) en poll-interval (standaard 5000 ms)
4. Bevestig het apparaat om de koppeling te voltooien
5. Het apparaat maakt automatisch verbinding en begint met het uitlezen van data
6. Verbindingsinstellingen kunnen later worden gewijzigd in de apparaatinstellingen

Bekende beperkingen:
- De Qube moet bereikbaar zijn op je lokale netwerk via Modbus TCP
- SG Ready modus vereist Qube firmware >= 4.0.08
- Verwarmings-/koelingssetpoints (dag/nacht) zijn alleen actief wanneer de interne thermostaat actief is; externe thermostaten of stooklijncompensatie kunnen deze overschrijven
- Na app-updates kan het nodig zijn om het apparaat te verwijderen en opnieuw toe te voegen voor nieuwe mogelijkheden
- Als de mobiele app verouderde gegevens of ontbrekende pictogrammen toont, sluit de Homey-app geforceerd en heropen deze, of verwijder het apparaat en voeg het opnieuw toe