# CarbageRunSystemV2

<img src="documentation/front_overview.jpg" alt="drawing" width="49%"/>
<img src="documentation/front_close_up.jpg" alt="drawing" width="49%"/>

<video src="documentation/system_activ.mp4" width="49%" type="video/mp4" controls></video>
<video src="documentation/back_lights_activ.mp4" width="49%" type="video/mp4" controls></video>

## Abstract
Jedes Jahr findet der Carbage Run, eine der größten "Schrott" Rallys in Europa, im Spätsommer statt. 

[Carbage Run](https://www.carbagerun.de/)
>Bei Europas größter und abgefahrenster Autorallye erwartet dich ein fünftägiges Abenteuer durch verschiedene Länder, und das in einem Auto, das nicht mehr als 1.000 Euro kosten darf. Erstmals 2009 in den Niederlanden gestartet, ist der Carbage Run mittlerweile ein länderübergreifendes Event mit hunderten begeisterten Teilnehmern. 

Viele Teilnehmer modifizieren ihre Fahrzeuge in dem sie neben kreativen Lackierung/Folierungen auch zusätzliches Equipment wie z.B. Warnleuchten oder Nebelhörner an ihre Fahrzeug anbringen. 

Die Zielsetzung des hier beschriebenen Systems ist es, eine flexible Ansteuerung des an einem Carbage Run Auto (Audi) montierten Equipment von einer  Kommadozentrale (Mittelkonsole) aber auch von einem Smartphone zu ermöglichen.

Die konkret am Fahrzeug montierten Elemente sind den Folgenden Tabellen aufgelistet  
### Lichtanlage
| Funktion | Beschreibung | Farbe |
| ----------- | ----------- | ----------- |
| ON; OFF; ggf. Modus | Warnbalken an Stirnseite des Dachträgers  | LED (Orange) |
| ON; OFF; ggf. Modus | Blitzerlicht in Kühlergrill  | LED (Orange) |
| ON; OFF; ggf. Modus | Warnbalken an Rückseite des Dachträgers  | LED (Orange) |
| ON; OFF | Rundumleuchte Links (noch nicht verbaut) | Halogen (Orange) |
| ON; OFF | Rundumleuchte Rechts (noch nicht verbaut) | Halogen (Orange) |
| ON; OFF | Arbeitsscheinwerfer/ Camping Lichter an Rückseite des Dachträgers  | LED (Weiß) |
| ON; OFF; ggf. Modus | Blitzerlicht an Rückseite von Dachträger  | LED (Orange) |

### Hornanlage
| Funktion | Beschreibung |
| ----------- | ----------- |
| ON; OFF | 95cm Druckluft horn von ehemaligen THW Fahrzeug | 
| ON; OFF | 70cm Druckluft horn von ehemaligen THW Fahrzeug | 
| ON; OFF | vierfach Druckluft (Zughorn)  | 
| ON; OFF | kurzes Druckluft 1 von 6  | 
| ON; OFF | kurzes Druckluft 2 von 6  | 
| ON; OFF | kurzes Druckluft 3 von 6  | 
| ON; OFF | kurzes Druckluft 4 von 6  | 
| ON; OFF | kurzes Druckluft 5 von 6  | 
| ON; OFF | kurzes Druckluft 6 von 6  | 

## Allgemeine Funktionsweise der Applikation
Das System verkörpert ein klassisches Server Client Model. Als Server wird ein am Dachträger montierter Raspberry eingesetzt, der neben Webserver auch als Wifi Router/Accesspoint agiert. 
Zugriff auf den Server ist deshalb nur innerhalb des Wifi Netz möglich. 
Als primärer Client wird ein zweiter Raspberry verwendet, der als Kommandozentrale in der Mittelkonsole des Fahrzeugs eingesetzt wird. Auf diesem wird eine Pyside2 basierte Gui Applikation eingesetzt, die die API Zugriffe steuert. Im Vergleich zur ersten Version, ist die Steuerung des System zusätzlich auch von einem weiteren mobilen Endgerät (Smartphone) möglich. Für diese Geräte ist die Webseite (Client Side) bestimmt. 

![](documentation/System_diagramm.drawio.svg)

## Serverseitigen API Endpoints
die API lässt sich in zwei Bereiche einteilen.
- `/api/lights`
- `/api/horns`

Die Endpunkte beider Bereiche sind gleich aufgebaut und dienen dazu die folgenden Konfigurations Objekte im Server auszulesen oder zu modifizieren.

```JSON
const lights = {flasher_bar_front: '0',  // amber Light bar front of vehicle
		          flasher_bar_back: '0',   // amber Light bar back of vehicle
                flasher_grill: '0',      // amber flashers in radiator grill  
                flasher_roof_back: '0',  // amber flashers on the back of the roof 
                beacon_left: '0',        // rotating amber beacon left side
                beacon_right: '0',       // rotating amber beacon right side
                work_lights_front: '0',  // white working lights on the front of the roof
                work_lights_back: '0'};  // white working lights on the back of the roof

const horns = {thw_low_tone: '0',            // long low tone air horn
	            thw_high_tone: '0',           // long high tone air horn
               quadruple_horn: '0',          // quadruple air horn (train horn sound)
               melodiy_horn_1: '0',          // longest of melodiy air horns 
               melodiy_horn_2: '0',          // ---
               melodiy_horn_3: '0',          // ---
               melodiy_horn_4: '0',          // ---
               melodiy_horn_5: '0',          // ---
               melodiy_horn_6: '0',          // shortest of melodiy air horns
               
               sequencer_melody: [],         // melodiy encoded in array
               sequencer_horns: '0'};        // acticate sequencer thats plays sequencer_melody with the air horns
```

|HTTP Verb| Endpoints | Beschreibung|
|------|-----|-----|
|GET|`/api/{Bereich}/getAll`| lese Konfigurations Objekt|
|GET|`/api/{Bereich}/getKeys`| erhalte alle Key Strings des Konfigurations Objekts|
|GET|`/api/{Bereich}/getValue/:key`| lese Wert einer Variable `key` im Konfigurations Objekt|
|POST|`/api/{Bereich}/setValue/:key`| schreibe neuen Wert in Variable `key` im Konfigurations Objekt|
|POST|`/api/{Bereich}/setConfig`| überschreibt alle Wert im Konfigurations Objekt|


## Beschreibung des Source Codes und Funktionsweise des Clients
Die Client seite wurde Event basiert aufgebaut. Der normale Ablauf ist wie folgt:
1. Nutzer betätigt "toogle" bei beliebigen Element um die Konfiguration zu ändern.
2. Client ließt aktuelle Konfiguration vom Server (single source of truth) 
3. Client modifiziert die Konfiguration
4. Client sendet neue Konfiguration zum Server.  

Die automatische "Refresh" Funktion beider Bereiche ist eine Ausnahme, in dem Sie durch ein Timer ausgelöst. Diese wird benötigt, das Änderungen von anderen Clienten nachverfolgt werden können. 

![](documentation/Funktionsablauf.drawio.svg)

## Abbildung Clientseite 

![](documentation/client_1.png)
![](documentation/client_2.png)
![](documentation/client_3.png)