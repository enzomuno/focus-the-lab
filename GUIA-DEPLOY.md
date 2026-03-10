# Focus Mind Lab — Guia de Deploy

## Arquitetura

```
focus-mind-lab/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx          ← Entry point React
│   ├── App.jsx            ← Router (Login ↔ Tracker)
│   ├── AuthContext.jsx    ← Google Auth context
│   ├── firebase.js        ← Config Firebase (editar aqui!)
│   ├── useFirestore.js    ← Hook para Firestore
│   ├── LoginScreen.jsx    ← Tela de login
│   └── HabitTracker.jsx   ← App principal (hábitos)
├── firestore.rules         ← Regras de segurança
├── netlify.toml            ← Config Netlify (SPA redirect)
├── package.json
├── vite.config.js
└── index.html
```

## Passo 1 — Criar Projeto no Firebase (5 min)

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique **"Adicionar projeto"** → nome: `focus-mind-lab` → Criar
3. Vá em **Criação > Authentication**
   - Clique "Começar"
   - Ative o provedor **Google**
   - Selecione seu email de suporte → Salvar
4. Vá em **Criação > Firestore Database**
   - Clique "Criar banco de dados"
   - Selecione a região mais próxima (ex: `southamerica-east1`)
   - Inicie no **modo de teste** (vamos configurar as regras depois)
5. Vá em **Configurações do Projeto** (engrenagem) > **Geral**
   - Role até "Seus apps" → clique no ícone **Web** `</>`
   - Apelido: `focus-mind-lab-web` → Registrar
   - Copie o objeto `firebaseConfig` que aparece

## Passo 2 — Configurar o Código (2 min)

Abra o arquivo `src/firebase.js` e substitua os valores placeholder:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",               // Cole sua apiKey
  authDomain: "focus-mind-lab.firebaseapp.com",
  projectId: "focus-mind-lab",
  storageBucket: "focus-mind-lab.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Passo 3 — Configurar Regras Firestore (1 min)

No console Firebase:
1. Vá em **Firestore Database > Regras**
2. Substitua as regras existentes por:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Clique **Publicar**

Isso garante que cada usuário só acessa seus próprios dados.

## Passo 4 — Rodar Localmente (3 min)

Requisitos: **Node.js 18+** instalado ([nodejs.org](https://nodejs.org))

```bash
# 1. Acesse a pasta do projeto
cd focus-mind-lab

# 2. Instale as dependências
npm install

# 3. Rode o servidor de desenvolvimento
npm run dev
```

Abra **http://localhost:5173** no navegador. Deve ver a tela de login!

## Passo 5 — Deploy no Netlify (5 min)

### Opção A: Via Interface (mais fácil)

1. Acesse [netlify.com](https://www.netlify.com) → Crie conta grátis
2. Rode o build local:
   ```bash
   npm run build
   ```
3. Arraste a pasta `dist/` para o Netlify (dashboard > "Deploy manually")
4. Pronto! Você recebe uma URL tipo `https://seu-site.netlify.app`

### Opção B: Via Git (deploy automático)

1. Suba o projeto no GitHub:
   ```bash
   git init
   git add .
   git commit -m "Focus Mind Lab v1"
   git remote add origin https://github.com/SEU_USER/focus-mind-lab.git
   git push -u origin main
   ```
2. No Netlify: **"Import from Git"** → selecione o repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy! Cada push no GitHub atualiza o site automaticamente.

## Passo 6 — Configurar Domínio no Firebase Auth (importante!)

Depois do deploy, você precisa autorizar o domínio do Netlify no Firebase:

1. Firebase Console > **Authentication > Settings > Domínios autorizados**
2. Adicione: `seu-site.netlify.app`
3. Se tiver domínio customizado depois, adicione ele também

Sem isso, o login com Google não vai funcionar no site publicado.

## Passo Extra — Domínio Customizado (opcional)

Se quiser usar `app.focusml.com.br`:

1. No Netlify: **Domain settings > Add custom domain**
2. Configure o DNS no seu provedor:
   - CNAME: `app` → `seu-site.netlify.app`
3. Netlify gera SSL automaticamente (HTTPS grátis)
4. Lembre de adicionar `app.focusml.com.br` nos domínios autorizados do Firebase Auth

## Limites do Free Tier

### Firebase (Spark Plan - Grátis)
- **Auth**: Ilimitado de usuários
- **Firestore**: 1GB armazenamento, 50K leituras/dia, 20K escritas/dia
- Para um MVP com poucos usuários, isso é mais que suficiente

### Netlify (Free Tier)
- 100GB bandwidth/mês
- Deploy automático do GitHub
- HTTPS grátis
- Domínio customizado
- Também mais que suficiente para MVP

## Compartilhar com Alguém para Testar

Basta enviar a URL do Netlify! A pessoa:
1. Abre o link
2. Faz login com a conta Google dela
3. Recebe seus próprios dados isolados (cada user tem seu painel)

## Troubleshooting

**Login não funciona no deploy?**
→ Verifique se o domínio está autorizado no Firebase Auth

**Dados não salvam?**
→ Verifique as regras do Firestore e se o Authentication está ativo

**Tela branca?**
→ Abra o Console do navegador (F12) para ver erros.
Geralmente é a config do Firebase incorreta.

**CORS error?**
→ Geralmente é domínio não autorizado no Firebase Auth
