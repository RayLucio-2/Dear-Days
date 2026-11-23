// Depois do "expo export": coloca no index.html o manifesto (site instalável),
// o ícone do iPhone e a prévia de compartilhamento (WhatsApp, Instagram, Google).
// Troque SITE se mudar o endereço.
const fs = require('fs');
const SITE = process.env.SITE_URL || 'https://dear-day.netlify.app';
const file = 'dist/index.html';
let html = fs.readFileSync(file, 'utf8');
const titulo = 'Dear Days: um planner gentil para quem tem dificuldade de se organizar';
const desc = 'Organize o seu dia com leveza: modo foco, tarefas em passos pequenos, hábitos sem culpa e finanças. 7 dias grátis, sem cartão.';
const tags = `
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Dear Days">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Dear Days">
<meta property="og:title" content="${titulo}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${SITE}/">
<meta property="og:image" content="${SITE}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/og.png">
<script>try{var t=localStorage.getItem('dd-tema');if(t==='escuro'||(t!=='claro'&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.style.background='#1B1917';document.querySelector('meta[name=theme-color]').content='#1B1917'}}catch(e){}</script>
`;
html = html.replace(/<title>[^<]*<\/title>/, `<title>${titulo}</title>`);
html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${desc}">`);
if (!html.includes('rel="manifest"')) html = html.replace('</head>', tags + '</head>');
fs.writeFileSync(file, html);
console.log('index.html pronto para instalar e compartilhar.');
