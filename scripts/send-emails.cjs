const admin = require('firebase-admin');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const FROM_EMAIL = 'The Lab <contato@focusml.com.br>';
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
        // HTML simplificado para máxima entregabilidade
        html: `
        <div style="font-family: -apple-system, sans-serif; color: #18181b; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
          <p style="font-size: 11px; letter-spacing: 1px; color: #a1a1aa; text-transform: uppercase; margin-bottom: 30px;">The Lab — Habits</p>
          
          <h2 style="font-weight: 400; font-size: 22px; line-height: 1.4; margin-bottom: 10px;">
            "Independente do resultado, <br/>mantenha sua constância."
          </h2>
          
          <p style="color: #71717a; font-size: 16px; margin-bottom: 30px;">
            Um registro rápido separa quem você é de quem você deseja se tornar.
          </p>
          
          <a href="${APP_URL}" style="background-color: #18181b; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-size: 14px; display: inline-block;">
            Registrar progresso do dia
          </a>
          
          <div style="margin-top: 60px; font-size: 11px; color: #d4d4d8; border-top: 1px solid #f4f4f5; padding-top: 20px;">
            Você faz parte do Focus Mind Lab. <br/>
            Um dia de cada vez.
          </div>
        </div>
        `
      });
    }
  }
}

run().catch(console.error);
