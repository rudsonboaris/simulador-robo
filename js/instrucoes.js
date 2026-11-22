/* Mensagem de instruções do treinamento, personalizada com o nome da pessoa. */
window.INSTRUCOES = function (nome) {
  var n = String(nome).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; });
  return '<p><b>Tudo certo, ' + n + '!</b> Antes de começar, veja como funciona:</p>' +
    '<ol class="passos">' +
    '<li><b>Habilitar o robô:</b> toque em <b>HABILITAR</b> no Teach Pendant (o painel ao lado do robô, ou abaixo dele no celular). Sem isso, o robô não se move.</li>' +
    '<li><b>Mover os eixos:</b> segure <b>+</b> ou <b>−</b> na linha do eixo (A1 a A6). Ao soltar, o robô para. Use o controle de <b>Velocidade</b> para ir mais devagar ou mais rápido.</li>' +
    '<li><b>Segurança:</b> em qualquer dúvida, toque em <b>STOP</b>: o robô para na hora. O botão <b>HOME</b> leva o robô à posição inicial.</li>' +
    '<li><b>Como continuar:</b> escolha <b>Missões</b>, desafios guiados do 01 ao 08, ou <b>Modo livre</b>, para operar sem roteiro.</li>' +
    '</ol>' +
    '<p class="nota">Ao concluir as 8 missões, você recebe um certificado de conclusão.</p>';
};
