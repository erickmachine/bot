const wppconnect = require('@wppconnect-team/wppconnect');
const Tesseract = require('tesseract.js'); // Importando a biblioteca Tesseract.js
const pdf = require('pdf-parse'); // Importando a biblioteca pdf-parse
const axios = require('axios'); // Para fazer requisições HTTP

// Estrutura para armazenar comandos e respostas
const commands = {
  '!plano': `
*PLANO DE STREAMING* 
Confira nossa tabela de planos disponíveis:

🎁 **Plano Plus** - R$17,90/mês
- Qualidade 720p
- Globoplay incluso
- Suporte via E-mail
- Atualização Prioritária
- Pacote interativo incluso
- + de 6 streamings
- Bônus Extras

🌟 **Plano Master** - R$32,90/mês
- Qualidade 720p e HD
- 03 conexões simultâneas
- Assistir em qualquer aparelho
- Netflix incluso
- Atualização Prioritária
- Bônus Extras
- + de 10 streamings

🏆 **Plano Anual** - R$58,90/mês
- Qualidade Full HD e 4K (+HDR)
- 05 conexões simultâneas
- Assistir em qualquer aparelho
- Liberdade de sugerir
- Atualização Prioritária

*Assine pelo site:* https://assinarplano.netlify.app 😃 
uma forma rápida para ter seus filmes em mãos!
  `,
  '!pix': `
*FORMAS DE PAGAMENTO - PIX*

Para efetuar o pagamento via Pix, utilize a seguinte chave:

🔑 **Chave Pix:** 10c3c19a-2ed8-4361-89c2-dce43539752f

Você pode fazer o pagamento diretamente pelo seu aplicativo bancário. Após o pagamento, por favor, envie uma mensagem para confirmar.

Se precisar de ajuda, estou à disposição! 😊
  `,
  '!ticket': 'Para abrir um ticket de suporte, envie: !ticket <mensagem>. Para consultar o status, use: !status <ticket_id>.',
  '!notificar': 'Envie a mensagem que deseja notificar todos os usuários.'
};

let tickets = [];
let ticketIdCounter = 1; // Contador para gerar IDs únicos para os tickets
let userNumbers = []; // Array para armazenar os números dos usuários

// Função para adicionar novos comandos
function addCommand(command, response) {
  commands[command] = response;
}

// Função para abrir um novo ticket
function createTicket(client, from, messageText) {
  const ticketId = ticketIdCounter++;
  const newTicket = {
    id: ticketId,
    message: messageText,
    status: 'aberto' // Status inicial do ticket
  };
  
  tickets.push(newTicket);
  
  client.sendText(from, `*Seu ticket foi criado com sucesso!* 🆔: ${ticketId}. Estamos analisando sua solicitação e você receberá atualizações em breve. Verificar !status (id: 123)`)
    .then((result) => {
      console.log('Resultado: ', result); // Retorno de sucesso
    })
    .catch((erro) => {
      console.error('Erro ao enviar: ', erro); // Retorno de erro
    });
}

// Função para consultar o status de um ticket
function checkTicketStatus(client, from, ticketId) {
  const ticket = tickets.find(t => t.id === parseInt(ticketId));

  if (ticket) {
    client.sendText(from, `Status do seu ticket (ID: ${ticketId}): ${ticket.status}. Mensagem: ${ticket.message}`)
      .then((result) => {
        console.log('Resultado: ', result); // Retorno de sucesso
      })
      .catch((erro) => {
        console.error('Erro ao enviar: ', erro); // Retorno de erro
      });
  } else {
    client.sendText(from, `Ticket com ID: ${ticketId} não encontrado.`)
    .then((result) => {
      console.log('Resultado: ', result); // Retorno de sucesso
    })
    .catch((erro) => {
      console.error('Erro ao enviar: ', erro); // Retorno de erro
    });
}
}

// Função para enviar notificações a todos os usuários
function sendNotification(client, message) {
userNumbers.forEach(number => {
  client.sendText(number, message)
    .then((result) => {
      console.log(`Notificação enviada para ${number}: `, result); // Retorno de sucesso
    })
    .catch((erro) => {
      console.error(`Erro ao enviar notificação para ${number}: `, erro); // Retorno de erro
    });
});
}

wppconnect
.create({
  session: 'sessionName', // Nome da sessão do cliente
  catchQR: (base64Qrimg, asciiQR, attempts, urlCode) => {
    console.log('Número de tentativas para ler o QR code: ', attempts);
    console.log('QR code no terminal: ', asciiQR);
    console.log('Imagem base64 do QR code: ', base64Qrimg);
    console.log('urlCode (data-ref): ', urlCode);
  },
  statusFind: (statusSession, session) => {
    console.log('Status da Sessão: ', statusSession);
    console.log('Nome da sessão: ', session);
  },
  headless: true, // Chrome sem interface
  devtools: false, // Não abrir devtools por padrão
  useChrome: true, // Usar instância do Chrome
  debug: false, // Abre uma sessão de depuração
  logQR: true, // Registra QR automaticamente no terminal
  autoClose: 60000, // Fecha automaticamente após 60 segundos
  tokenStore: 'file', // Como trabalhar com tokens
  folderNameToken: './tokens', // Nome da pasta para salvar tokens
})
.then((client) => start(client))
.catch((error) => console.log(error));

function start(client) {
client.onMessage((message) => {
  const command = message.body.toLowerCase();

  // Armazenar o número do usuário se não estiver já armazenado
  if (!userNumbers.includes(message.from)) {
    userNumbers.push(message.from);
  }

  // Verifica se o comando existe
  if (commands[command]) {
    client.sendText(message.from, commands[command])
      .then((result) => {
        console.log('Resultado: ', result); // Retorno de sucesso
      })
      .catch((erro) => {
        console.error('Erro ao enviar: ', erro); // Retorno de erro
      });
  }

  // Comando para abrir um novo ticket
  if (command.startsWith('!ticket ')) {
    const messageText = command.replace('!ticket ', '');
    createTicket(client, message.from, messageText);
  }

  // Comando para consultar o status de um ticket
  if (command.startsWith('!status ')) {
    const ticketId = command.replace('!status ', '');
    checkTicketStatus(client, message.from, ticketId);
  }

  // Comando para processar imagens de comprovantes
  if (message.type === 'image') {
    const imageUrl = message.body; // URL da imagem recebida

    // Baixando a imagem para um buffer
    axios.get(imageUrl, { responseType: 'arraybuffer' })
      .then(response => {
        const imageBuffer = Buffer.from(response.data, 'binary');

        // Usando Tesseract.js para reconhecer texto na imagem
        Tesseract.recognize(
          imageBuffer,
          'por', // Idioma português
          {
            logger: info => console.log(info), // Log do progresso do OCR
          }
        ).then(({ data: { text } }) => {
          processText(client, message.from, text);
        }).catch(err => {
          console.error('Erro ao reconhecer texto:', err);
          client.sendText(message.from, 'Estou verificando... te retorno já já!');
        });
      })
      .catch(err => {
        console.error('Erro ao baixar a imagem:', err);
        client.sendText(message.from, 'Estou verificando... te retorno já já!');
      });
  }

  // Função para processar arquivos PDF
  if (message.type === 'document' && message.mimeType === 'application/pdf') {
    console.log('PDF recebido:', message); // Log do PDF recebido

    // Baixando o PDF e extraindo texto
       // Baixando o PDF e extraindo texto
       client.getFile(message.id).then(fileBuffer => {
        pdf(fileBuffer).then(data => {
          const text = data.text; // Texto extraído do PDF
          processText(client, message.from, text);
        }).catch(err => {
          console.error('Erro ao processar PDF:', err);
          client.sendText(message.from, 'Desculpe, não consegui ler o PDF. Tente novamente mais tarde.');
        });
      }).catch(err => {
        console.error('Erro ao baixar o PDF:', err);
        client.sendText(message.from, 'Desculpe, não consegui baixar o PDF. Tente novamente mais tarde.');
      });
    }

    // Comando para adicionar novos comandos
    if (command.startsWith('!addcommand ')) {
      const parts = command.split(' ');
      const newCommand = parts[1]; // O novo comando
      const response = parts.slice(2).join(' '); // A resposta associada

      if (newCommand && response) {
        addCommand(newCommand, response);
        client.sendText(message.from, `Comando ${newCommand} adicionado com sucesso!`)
          .then((result) => {
            console.log('Resultado: ', result); // Retorno de sucesso
          })
          .catch((erro) => {
            console.error('Erro ao enviar: ', erro); // Retorno de erro
          });
      } else {
        client.sendText(message.from, 'Formato inválido. Use: !addcommand <comando> <resposta>')
          .then((result) => {
            console.log('Resultado: ', result); // Retorno de sucesso
          })
          .catch((erro) => {
            console.error('Erro ao enviar: ', erro); // Retorno de erro
          });
      }
    }

    // Comando para enviar notificações
    if (command.startsWith('!notificar ')) {
      const notificationMessage = command.replace('!notificar ', '');
      sendNotification(client, notificationMessage);
    }
  });
}

// Função para processar o texto reconhecido
function processText(client, from, text) {
  console.log('Texto reconhecido:', text); // Log do texto reconhecido

  // Verificando se os valores estão presentes no texto reconhecido
  const valoresAceitos = ['R$ 9,90', 'R$ 17,90', 'R$ 32,90', 'R$ 58,90'];
  const valorAprovado = valoresAceitos.some(valor => text.includes(valor));

  if (valorAprovado) {
    const approvalMessage = `
🎉 *Pagamento Aprovado!* 🎉

Recebemos seu comprovante e o valor foi confirmado. Obrigado por sua assinatura! Se precisar de mais alguma coisa, estou à disposição. 😊
    `;

    client.sendText(from, approvalMessage)
      .then((result) => {
        console.log('Resultado: ', result); // Retorno de sucesso
      })
      .catch((erro) => {
        console.error('Erro ao enviar: ', erro); // Retorno de erro
      });
  } else {
    const rejectionMessage = `
❌ *Pagamento Não Aprovado!* ❌

O valor do comprovante não corresponde a nenhum dos planos disponíveis. Por favor, verifique o valor e tente novamente.
    `;

    client.sendText(from, rejectionMessage)
      .then((result) => {
        console.log('Resultado: ', result); // Retorno de sucesso
      })
      .catch((erro) => {
        console.error('Erro ao enviar: ', erro); // Retorno de erro
      });
  }
}