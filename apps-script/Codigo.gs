/* Registro de entradas: grava Nome, Sobrenome e Data e Hora na PRIMEIRA aba da planilha
   (colunas A, B e C). Cole este código em Extensões > Apps Script, na própria planilha. */

/* Só preencha se este script NÃO foi criado por Extensões > Apps Script dentro da planilha.
   O ID é o trecho entre /d/ e /edit no endereço da planilha. */
var ID_PLANILHA = '';

function planilha() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss && ID_PLANILHA) ss = SpreadsheetApp.openById(ID_PLANILHA);
  return ss;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var d = JSON.parse(e.postData.contents);
    var nome = limpa(d.nome), sobrenome = limpa(d.sobrenome);
    if (!nome || !sobrenome) return resp({ ok: false });
    var sh = planilha().getSheets()[0];
    if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, 3).setValues([['Nome', 'Sobrenome', 'Data e Hora']]);
    var dataHora = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');
    /* formato texto: a planilha nunca interpreta o conteúdo como fórmula ou data */
    sh.getRange(sh.getLastRow() + 1, 1, 1, 3).setNumberFormat('@').setValues([[nome, sobrenome, dataHora]]);
    return resp({ ok: true });
  } catch (err) {
    return resp({ ok: false });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/* abrir o endereço /exec no navegador mostra que o serviço está no ar */
function doGet() { return resp({ ok: true, servico: 'registro de entradas' }); }

function limpa(v) { return String(v || '').replace(/\s+/g, ' ').trim().slice(0, 60); }
function resp(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
