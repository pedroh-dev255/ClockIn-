import { sendMail } from "./configs/mailer.js";

(async () => {
  const emailEnviado = await sendMail(
    "henriquepedro1912@gmail.com",
    "Solicitação de Compra",
    `
      <p>Bom dia,</p>
      <p>Venho por meio deste solicitar a compra de 3 (ou mais) headsets.</p>
      <p>Sendo eles 1 para a nova Aux de Analista de Dados (BI) e dois para estoque.</p>
      <p><a href="https://exemplo.com/modelo" target="_blank">Clique aqui para ver o modelo</a>.</p>
      <p>Att,<br>Pedro Henrique<br>Suporte TI</p>
    `
  );

  if (!emailEnviado) {
    console.error("Falha no envio do e-mail.");
  }
})();
