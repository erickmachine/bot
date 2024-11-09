const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações do Twilio
const accountSid = 'ACd21ba7f07f8aaf62f2ca6dc25dc2b6aa'; // Seu Account SID do Twilio
const authToken = '92cf0cb1a57707149d87588e2b71435f'; // Seu Auth Token do Twilio
const client = twilio(accountSid, authToken);

app.use(bodyParser.urlencoded({ extended: true }));

// Rota para o caminho raiz
app.get('/', (req, res) => {
    res.send('Bem-vindo ao servidor de mensagens! Use o endpoint /message para interagir.');
});

// Rota "Sobre"
app.get('/sobre', (req, res) => {
    res.send('Este servidor responde a mensagens enviadas via WhatsApp utilizando Twilio.');
});

// Endpoint para receber mensagens do WhatsApp
app.post('/message', (req, res) => {
    const usuario = req.body.Body.toLowerCase();
    console.log('Nova mensagem:', usuario);

    let resposta;

    // Lógica simples de resposta
    if (usuario.includes('ajuda')) {
        resposta = 'Como posso ajudar você hoje?';
    } else if (usuario.includes('horário')) {
        resposta = 'Estamos disponíveis das 9h às 18h, de segunda a sexta.';
    } else if (usuario.includes('produto')) {
        resposta = 'Você pode consultar nossos produtos no nosso site.';
    } else {
        resposta = 'Desculpe, não entendi sua pergunta. Por favor, tente novamente.';
    }

    // Responder ao usuário
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(resposta);

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
});

// Endpoint para enviar uma mensagem via WhatsApp
app.post('/send-message', (req, res) => {
    const { to, message } = req.body; // Espera que o corpo da requisição tenha 'to' e 'message'

    client.messages.create({
        body: message,
        from: 'whatsapp:+5592999652961', // Número do Sandbox ou seu número registrado
        to: `whatsapp:${to}` // Número do destinatário
    })
    .then(message => {
        console.log('Mensagem enviada:', message.sid);
        res.status(200).send(`Mensagem enviada com sucesso para ${to}`);
    })
    .catch(error => {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).send('Erro ao enviar mensagem');
    });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor ativo na porta ${PORT}!`);
});