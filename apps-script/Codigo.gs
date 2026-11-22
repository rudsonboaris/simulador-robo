/* Registro de entradas: grava Data, Hora, Nome e Sobrenome na planilha onde este script foi criado.
   Cole este código em Extensões > Apps Script e publique como Aplicativo da Web (veja LEIAME.txt). */
var ABA = 'Entradas';

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var d = JSON.parse(e.postData.contents);
    var nome = limpa(d.nome), sobrenome = limpa(d.sobrenome);
    if (!nome || !sobrenome) return resp({ ok: false });
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(ABA) || ss.insertSheet(ABA);
    if (sh.getLastRow() === 0) sh.appendRow(['Data', 'Hora', 'Nome', 'Sobrenome']);
    var agora = new Date(), fuso = 'America/Sao_Paulo';
    sh.appendRow([Utilities.formatDate(agora, fuso, 'dd/MM/yyyy'), Utilities.formatDate(agora, fuso, 'HH:mm:ss'), nome, sobrenome]);
    return resp({ ok: true });
  } catch (err) {
    return resp({ ok: false });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function doGet() { return resp({ ok: true, servico: 'registro de entradas' }); }

/* limpa o texto e evita que a planilha trate o conteúdo como fórmula */
function limpa(v) {
  v = String(v || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  if (/^[=+\-@]/.test(v)) v = "'" + v;
  return v;
}
function resp(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
