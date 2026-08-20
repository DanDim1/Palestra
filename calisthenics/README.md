# Tracker Calisthenics

Pagina statica servita da GitHub Pages: https://dandim1.github.io/Palestra/calisthenics/

## Dove finiscono i progressi

Di default nel `localStorage` del browser (chiavi `calisthenics-4wk-progress` e
`calisthenics-4wk-stamps`), quindi su un solo dispositivo. In più, la pagina mostra
un **codice progressi** di 4 cifre esadecimali che riassume le 16 sessioni: copiabile
e incollabile altrove per spostare lo stato a mano.

## Sincronizzazione su Google Sheets (opzionale)

1. Apri o crea un foglio Google.
2. **Estensioni > Apps Script**, incolla il contenuto di `apps-script.gs`, salva.
3. **Distribuisci > Nuova distribuzione**, tipo **App web**:
   - *Esegui come*: Io
   - *Chi ha accesso*: Chiunque
4. Copia l'URL che termina con `/exec`.
5. In `index.html` valorizza la costante `SHEETS_URL` con quell'URL.

Finché `SHEETS_URL` resta vuota la pagina funziona esattamente come prima, in locale,
e il pulsante *Sincronizza* resta nascosto.

## Come vengono risolti i conflitti

Ogni sessione ha un timestamp di ultima modifica, sia in locale sia nel foglio:

- al caricamento della pagina lo stato viene unito nei due sensi, e per ogni sessione
  vince la modifica più recente;
- toccando una sessione, quella singola riga viene inviata al foglio;
- l'Apps Script ignora le scritture più vecchie di quanto ha già in memoria, così
  telefono e computer non si sovrascrivono i progressi a vicenda.

Nota: l'URL `/exec` di una distribuzione "accessibile a chiunque" è pubblico e finisce
in un repo pubblico. Chi lo trova può leggere e scrivere quel foglio: usa un foglio
dedicato al tracker, senza dati che ti dispiacerebbe esporre.
