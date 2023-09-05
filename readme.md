# **Gestione autorizzazioni**
**Gestionale per l'autorizzazione di cantieri stradali e traslochi sul territorio urbano**

## INTRODUZIONE
Lo scopo principale di questa applicazione è la gestione web-based delle richieste di manutenzione stradale e trasloco effettuate dalle aziende competenti

## Licenza
Il software è rilasciato con licenza aperta ai sensi dell'art. 69 comma 1 del Codice dell’[Amministrazione Digitale](https://www.agid.gov.it/it/design-servizi/riuso-open-source/linee-guida-acquisizione-riuso-software-pa) con una licenza [AGPL-3.0 or later](https://spdx.org/licenses/AGPL-3.0-or-later.html)

## INFORMAZIONI GENERALI
Il Comune di Bari ha avviato un percorso programmatico (“Bari Smart City”) finalizzato alla conversione della propria realtà urbana a “smart” mediante l’attuazione di interventi finalizzati al miglioramento della qualità della vita dei cittadini rendendo al contempo più sostenibile la città dal punto di vista energetico. Tali interventi hanno come obiettivi principali quello di potenziare il processo in corso di dematerializzazione dei procedimenti tecnici ed amministrativi (e‐government), il miglioramento dell’erogazione dei servizi al cittadino in termini di efficienza ed efficacia, il rinnovamento e l’efficientamento dei servizi pubblici. In coerenza con la programmazione nazionale/regionale in ambito “Città e comunità intelligenti” ed in linea con gli obiettivi dell’Agenda Digitale dell’amministrazione comunale, il progetto “Città Connessa: Sistema Informativo per il controllo degli oggetti” (cod. progetto BA 1.1.1.d – CUP J91J17000130007, a valere su risorse di finanziamento PON METRO 2014-2020 – Asse 1 "Agenda Digitale") persegue l'obiettivo di realizzare una piattaforma nella quale sono descritti e monitorati dati, metadati e riferimenti geospaziali degli oggetti della città ed i servizi connessi, in maniera omogenea e integrata. In tale ambito si innesta l'applicazione “Gestione Autorizzazioni” per la gestione delle richieste di cantieri stradali e di traslochi sul territorio urbano.

Si tratta di una applicazione web basata su una architettura conforme alla tipica struttura three-tier che rappresenta un paradigma caratterizzato da rilevanti benefici in termini di scalabilità e di uso efficiente delle risorse. I tre livelli "logici" (front-end, back-end e database) sono realizzati sfruttando i principali framework di riferimento per lo sviluppo quali ad esempio AngularJs e Bootstrap oltreché di settore come OpenLayers (per lo sviluppo delle funzionalità cartografiche del sistema), Node.JS (per l'implementazione di soluzioni "server-side"), Geoserver (come map server) e RDBMS PostgreSQL/PostGIS (per l'archiviazione dei dati). 

![alt-text](https://github.com/comunedibari/gestione-autorizzazioni/blob/main/immagini/img1.png)

Di seguito i sotto-moduli che costituiscono il front-end ed il back-end
- back-end: contiene i seguenti moduli di backend:
    - **EntityManager**: componente principale del back end deputata alla gestione delle entità  rappresenta l'astrazione del livello dei dati nell'architettura del sistema di centrale in quanto fornisce una rappresentazione a oggetti dei dati del dominio e l'astrazione del DBMS adottato, ovvero l'assoluta indipendenza delle funzioni dell'applicazione dal RDBMS
    - **EventEngine**:  gestore eventi è un modulo di fondamentale importanza per l'intero funzionamento del sistema: il suo compito è quello di ricevere tutti gli eventi emessi da un qualsiasi componente interno al sistema o esterno, classificarli, processarli, salvarli nella base dati. L'evento è rappresentato da un'entità contenente alcuni attributi obbligatori (sorgente, tipo, data di creazione, ...) ed una serie di attributi custom che caratterizzano il particolare tipo di evento. Dal punto di vista pratico può essere visto come una notifica che un qualunque modulo, in un certo istante, deve inviare ad altri moduli del sistema.
    - **RuleEngine**: modulo che si occupa delle definizione di regole e operazioni pianificate; è utilizzato per l'invio delle notifiche push all'app mobile.
    - **middleware-protocolli**: modulo per la gestione dei protocollli.
- front-end: contiene i seguenti moduli di frontend:
	- **core**: contiene le funzioni di core quali gestione form, tabelle, etc.
    - **management**: contiene le funzionalità di gestione degli utenti e dei ruoli
    - **move**: modulo di front end per la gestione dei traslochi
    - **registration**: contiene tutte le funzionalità di registrazione e accreditamento delle aziende
    - **roadsite**: contiene la gestione dei cantieri stradali
    - **Webgis**: modulo di frontend del motore cartografico


### Funzionalità del gestionale
**MODULO "MANUTENZIONE STRADE"**
Il modulo in oggetto consente alle Società preposte di avviare l’interlocuzione con gli uffici competenti del Comune al fine di ricevere idonea autorizzazione per l’esecuzione dei lavori su sede stradale.
Gli operatori delle Società e gli utenti amministratori della piattaforma hanno accesso con credenziali custom. Tali credenziali sono generate e gestite attraverso un pannello dedicato di amministrazione (per il Comune).
La fase di richiesta di rilascio autorizzazione all’esecuzione dei lavori prevede la compilazione di un form con informazioni alfanumeriche e allegati; tale richiesta, inviata attraverso il sistema, viene protocollata (integrazione con il sistema di protocollazione dell'Ente) e valutata dagli operatori comunali ai fini dell’approvazione.

**MODULO TRASLOCHI**
Il modulo consente di gestire le richieste di trasloco effettuate da parte delle specifiche aziende. Anche in questo caso sono gestite le funzioni di registrazione e relativo controllo dell’accesso degli utenti abilitati.
Le aziende di traslochi accedono alla piattaforma con credenziali ad hoc e con ruolo specifico e possono segnalare un trasloco; l’elenco dei traslochi è poi visibile agli operatori di Polizia municipale che approvano o negano la richiesta. 

Per i dettagli funzionali si rimanda ai manuali utente.

**Installazione di un ambiente locale di sviluppo**
Per i dettagli sull'architettura del software e sulle procedure di installazione fare riferimento al manuale di installazione e gestione
