const admin = require('firebase-admin');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// 1. Configure aqui o seu domínio verificado
const FROM_EMAIL = 'The Lab <contato@focusml.com.br>'; // Altere para o seu domínio verificado
const APP_URL = 'https://habits-the-lab.enzomacedomuno.workers.dev/';

async function run() {
  console.log("Iniciando envio de lembretes...");
  
  const listUsers = await admin.auth().listUsers();
  
  for (const user of listUsers.users) {
    if (user.email) {
      console.log(`Enviando para: ${user.email}`);
      
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: 'Sua constância vale ouro.',
        html: `
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
            .container { max-width: 600px; margin: 0 auto; padding: 60px 20px; text-align: center; }
            .logo { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #a1a1aa; margin-bottom: 40px; }
            .quote { font-size: 24px; line-height: 1.4; color: #18181b; margin-bottom: 10px; font-weight: 400; letter-spacing: -0.5px; }
            .subtext { font-size: 16px; color: #71717a; margin-bottom: 40px; }
            .button { background-color: #18181b; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 14px; font-weight: 500; display: inline-block; transition: opacity 0.2s; }
            .footer { margin-top: 60px; font-size: 11px; color: #d4d4d8; letter-spacing: 0.5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">The Lab — Habits</div>
            <div class="quote">"Independente do resultado,<br>mantenha sua constância."</div>
            <p class="subtext">Um registro rápido separa quem você é de quem você quer ser.</p>
            <a href="${url}" class="button">Registrar progresso do dia</a>
            <div class="footer">
              Você está recebendo isso porque faz parte do Focus Mind Lab.<br>
              Um dia de cada vez.
            </div>
          </div>
        </body>
        </html>
        `
      });
    }
  }
}

run().catch(console.error);
