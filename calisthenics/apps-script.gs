/**
 * Apps Script per il tracker Calisthenics.
 *
 * Installazione:
 *   1. apri (o crea) un foglio Google
 *   2. Estensioni > Apps Script, incolla questo file, salva
 *   3. Distribuisci > Nuova distribuzione > tipo "App web"
 *        - Esegui come: Io
 *        - Chi ha accesso: Chiunque
 *   4. copia l'URL che finisce con /exec e mettilo in SHEETS_URL dentro index.html
 *
 * Contratto:
 *   GET  -> [{settimana, giorno, fatta, ts}, ...]
 *   POST -> {settimana, giorno, fatta, ts} oppure un array di questi oggetti.
 *
 * Ogni sessione occupa una sola riga, aggiornata sul posto. "ts" e' il momento
 * della modifica in millisecondi: una scrittura piu' vecchia di quella gia'
 * presente viene ignorata, cosi' due dispositivi non si sovrascrivono a vicenda.
 */

const SHEET_NAME = 'Calisthenics';
const HEADERS = ['settimana', 'giorno', 'fatta', 'quando', 'ts'];

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  return sh;
}

function isVero(v) {
  return v === true || v === 1 || String(v).toLowerCase() === 'true' || String(v) === '1';
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  const sh = getSheet();
  const values = sh.getDataRange().getValues();
  const out = [];
  for (let i = 1; i < values.length; i++) {
    const riga = values[i];
    if (riga[0] === '' || riga[0] === null) continue;
    out.push({
      settimana: Number(riga[0]),
      giorno: Number(riga[1]),
      fatta: isVero(riga[2]),
      ts: Number(riga[4]) || 0
    });
  }
  return json(out);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json({ ok: false, errore: 'lock non ottenuto' });
  }
  try {
    const body = JSON.parse(e.postData.contents);
    const entries = Array.isArray(body) ? body : [body];
    const sh = getSheet();
    const values = sh.getDataRange().getValues();

    // "settimana-giorno" -> {riga, ts} di cio' che e' gia' nel foglio
    const esistenti = {};
    for (let i = 1; i < values.length; i++) {
      const chiave = Number(values[i][0]) + '-' + Number(values[i][1]);
      esistenti[chiave] = { riga: i + 1, ts: Number(values[i][4]) || 0 };
    }

    const adesso = Date.now();
    let scritte = 0;
    let ignorate = 0;

    entries.forEach(function (entry) {
      const settimana = Number(entry.settimana);
      const giorno = Number(entry.giorno);
      if (!(settimana >= 1 && settimana <= 4)) return;
      if (!(giorno >= 1 && giorno <= 4)) return;

      const fatta = isVero(entry.fatta);
      const ts = Number(entry.ts) || adesso;
      const chiave = settimana + '-' + giorno;
      const attuale = esistenti[chiave];

      if (attuale && attuale.ts > ts) {
        // il foglio ha una modifica piu' recente: questa e' vecchia, la scarto
        ignorate++;
        return;
      }

      if (attuale) {
        sh.getRange(attuale.riga, 3, 1, 3).setValues([[fatta, new Date(ts), ts]]);
        attuale.ts = ts;
      } else {
        sh.appendRow([settimana, giorno, fatta, new Date(ts), ts]);
        esistenti[chiave] = { riga: sh.getLastRow(), ts: ts };
      }
      scritte++;
    });

    return json({ ok: true, scritte: scritte, ignorate: ignorate });
  } catch (err) {
    return json({ ok: false, errore: String(err) });
  } finally {
    lock.releaseLock();
  }
}
