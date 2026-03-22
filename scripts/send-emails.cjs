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
            .wrapper { width: 100%; table-layout: fixed; background-color: #ffffff; padding-bottom: 40px; }
            .container { max-width: 600px; margin: 0 auto; padding: 60px 20px; text-align: center; }
            .label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #a1a1aa; margin-bottom: 40px; }
            .content { font-size: 22px; line-height: 1.5; color: #18181b; margin-bottom: 30px; font-weight: 400; letter-spacing: -0.5px; }
            .button { background-color: #18181b; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 14px; font-weight: 500; display: inline-block; }
            .footer { margin-top: 80px; font-size: 11px; color: #d4d4d8; border-top: 1px solid #f4f4f5; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="label">Focus Mind Lab</div>
              <div class="content">
                "Independente do resultado,<br>
                <strong>mantenha sua constância.</strong>"
              </div>
              <p style="color: #71717a; font-size: 15px; margin-bottom: 35px;">
                Um registro rápido separa quem você é de quem você deseja se tornar.
              </p>
              <a href="${APP_URL}" class="button">Registrar progresso de hoje</a>
              <div class="footer">
                The Lab — Construindo o futuro um hábito por vez.
              </div>
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
