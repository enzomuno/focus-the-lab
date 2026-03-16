import { schedule } from "@netlify/functions";
import admin from "firebase-admin";
import { Resend } from "resend";

// Inicializa o Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const resend = new Resend(process.env.RESEND_API_KEY);

const handler = async (event) => {
  try {
    const db = admin.firestore();
    const hoje = new Date().toISOString().split('T')[0];

    // Busca usuários que não preencheram hoje
    // Lógica: buscar onde 'last_entry' é menor que a data de hoje
    const snapshot = await db.collection('users')
      .where('last_entry', '<', hoje)
      .get();

    if (snapshot.empty) {
      console.log('Nenhum lembrete necessário hoje.');
      return { statusCode: 200 };
    }

    const emailPromises = snapshot.docs.map(doc => {
      const user = doc.data();
      return resend.emails.send({
        from: 'Foco <onboarding@resend.dev>', 
        to: user.email,
        subject: '⏰ Hora de atualizar seus hábitos!',
        html: `<strong>Olá, ${user.name || 'focado(a)'}!</strong><br>O Focus Mind Lab passando para lembrar do seu compromisso de hoje.`
      });
    });

    await Promise.all(emailPromises);
    console.log(`${snapshot.size} lembretes enviados.`);

    return { statusCode: 200 };
  } catch (error) {
    console.error('Erro:', error);
    return { statusCode: 500 };
  }
};

// Exporta como uma função agendada (Todo dia às 12:00 UTC / 09:00 BRT)
export const github_handler = schedule("0 12 * * *", handler);
