HR-energy integratie voor Homey.

Bedien en monitor je HR-energy Qube warmtepomp rechtstreeks vanuit Homey via Modbus TCP.

Functies:
- Realtime sensordata: aanvoer-, retour-, bron-, kamer-, warmwater- en buitentemperatuur
- Waterdebiet, COP (efficiëntie), elektrisch en thermisch vermogen, energieverbruik
- Monitoring van thermische energieproductie
- Compressorsnelheid en bedrijfsuren (warmwater, verwarming, koeling)
- Digitale uitgangen: bronpomp, CV-pomp, kleppen, bijverwarming
- Seizoensmodus regeling (Winter/Zomer) en stooklijn schakelaar
- Instelling van verwarmings-, koelings- en warmwatersetpoints
- 9 alarmindicatoren (globaal, debiet, verwarming, koeling, bron, gebruiker, legionella time-out, warmwater time-out, bedrijfsuren)
- 20 flow-triggerkaarten voor automatiseringen (statuswijzigingen, alarmen, compressorgebeurtenissen)
- 10 flow-actiekaarten (setpoints, seizoensmodus, stooklijn, warmwaterprogramma, SG Ready, anti-legionella, geavanceerd Modbus schrijven)
- "Willekeurig alarm AAN" trigger met alarmnaam-tag voor flexibele meldingen
- Volledig gelokaliseerd in het Engels en Nederlands

Ondersteunde apparaten:
- HR-energy Qube warmtepomp (Modbus TCP-verbinding vereist)

Installatie:
1. Installeer de app op je Homey
2. Voeg een nieuw apparaat toe: HR-energy > Qube
3. Ga naar de apparaatinstellingen en voer het IP-adres van je Qube in
4. Pas optioneel de poort (standaard 502), Modbus unit-ID (standaard 1) en poll-interval (standaard 5 seconden) aan
5. Het apparaat maakt automatisch verbinding en begint met het uitlezen van data

Bekende beperkingen:
- De Qube moet bereikbaar zijn op je lokale netwerk via Modbus TCP
- SG Ready modus vereist Qube firmware >= 4.0.08
- Na app-updates kan het nodig zijn om het apparaat te verwijderen en opnieuw toe te voegen voor nieuwe mogelijkheden
