const admin = require('firebase-admin');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Inicializa o Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function run() {
  console.log("Iniciando busca de usuários...");
  
  // Pega todos os usuários cadastrados no Firebase Auth
  const listUsers = await admin.auth().listUsers();
  
  for (const user of listUsers.users) {
    if (user.email) {
      console.log(`Enviando para: ${user.email}`);
      
      await resend.emails.send({
        from: 'onboarding@resend.dev', // Depois você pode configurar seu domínio próprio
        to: user.email,
        subject: '🧠 Hora da sua reflexão no Focus Mind Lab!',
        html: `
          <h1>E aí, como foi seu dia?</h1>
          <p>São 22h! Hora de registrar suas vitórias e lições de hoje para manter o foco.</p>
          <a href="https://focus-the-lab.pages.dev">Acessar meu Dashboard</a>
        `
      });
    }
  }
}

run().catch(console.error);
