# FITLOVE

> "Evoluindo juntos todos os dias."

Plataforma fitness premium para casais — Next.js 16, TypeScript, Supabase, Framer Motion.

---

## Projeto Supabase

- **URL:** `https://ecxinxxbeaspzfkgawbe.supabase.co`
- **Painel:** https://supabase.com/dashboard/project/ecxinxxbeaspzfkgawbe

---

## PASSO 1 — Banco de dados

### Execute o supabase-init.sql

1. Acesse: https://supabase.com/dashboard/project/ecxinxxbeaspzfkgawbe/sql/new
2. Copie todo o conteúdo do arquivo `supabase-init.sql`
3. Cole no editor SQL e clique **Run**

Isso cria automaticamente:
- Todas as 11 tabelas
- Todas as RLS policies
- Bucket de Storage `fitlove`
- Realtime para posts/likes/comentários
- Trigger para auto-criar perfil no signup
- Indexes de performance

---

## PASSO 2 — Autenticação Email

1. Acesse: https://supabase.com/dashboard/project/ecxinxxbeaspzfkgawbe/auth/providers
2. Em **Email**, certifique-se que está habilitado
3. Opcionalmente desabilite "Confirm email" para testes

---

## PASSO 3 — Login Google (OAuth)

1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Crie ou abra um projeto
3. Vá em **APIs & Services → Credentials**
4. Clique **Create Credentials → OAuth 2.0 Client ID**
5. Tipo: **Web application**
6. Em **Authorized redirect URIs**, adicione:
   ```
   https://ecxinxxbeaspzfkgawbe.supabase.co/auth/v1/callback
   ```
7. Copie o **Client ID** e **Client Secret**
8. No Supabase, acesse: https://supabase.com/dashboard/project/ecxinxxbeaspzfkgawbe/auth/providers
9. Habilite **Google** e cole o Client ID e Client Secret
10. Clique **Save**

---

## PASSO 4 — URLs de Redirect

### Para desenvolvimento local:

Acesse: https://supabase.com/dashboard/project/ecxinxxbeaspzfkgawbe/auth/url-configuration

Adicione:
- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** `http://localhost:3000/auth/callback`

### Para produção (Vercel), adicione também:
- **Site URL:** `https://SEU-APP.vercel.app`
- **Redirect URLs:** `https://SEU-APP.vercel.app/auth/callback`

---

## PASSO 5 — Rodar localmente

```bash
cd fitlove
npm install
npm run dev
```

Acesse: http://localhost:3000

---

## PASSO 6 — Criar usuários (Hygor e Júlia)

1. Acesse http://localhost:3000/login
2. Clique em **Criar conta** e cadastre `hygor@email.com`
3. Repita para `julia@email.com`
4. Faça login com cada um e acesse **Perfil**
5. Use os **Presets Rápidos** para configurar as metas

**Metas do Hygor:**
- 2750 kcal | 150g proteína | 400g carbs | 60g gordura | 3L água
- Objetivo: Ganhar massa muscular

**Metas da Júlia:**
- 1650 kcal | 140g proteína | 145g carbs | 55g gordura | 3L água
- Objetivo: Perder gordura e definir

---

## PASSO 7 — Deploy na Vercel

### Opção A: Via CLI

```bash
npm install -g vercel
vercel
```

### Opção B: Via painel Vercel

1. Acesse https://vercel.com/new
2. Importe o repositório GitHub
3. Em **Environment Variables**, adicione:

| Nome | Valor |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ecxinxxbeaspzfkgawbe.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_lRueNfJn5i38O2XJhG2xog_oXd_UgP0` |

4. Clique **Deploy**
5. Após o deploy, copie a URL (ex: `https://fitlove.vercel.app`)
6. Volte ao Supabase → Auth → URL Configuration e adicione a URL de produção

---

## Stack

| Tecnologia | Uso |
|-----------|-----|
| Next.js 16 | Framework React com App Router |
| TypeScript | Tipagem estática |
| TailwindCSS | Estilização + glassmorphism |
| Framer Motion | Animações premium |
| Supabase | Auth, Database, Storage, Realtime |
| Recharts | Gráficos de estatísticas |
| shadcn/ui | Componentes base |

## Módulos

| Rota | Descrição |
|------|-----------|
| `/` | Landing page premium |
| `/login` | Login por email ou Google |
| `/dashboard` | Ranking do casal + score + ações rápidas |
| `/agua` | Tracker de hidratação animado |
| `/treinos` | Log de treinos com 12 tipos |
| `/nutricao` | Log de refeições com macros |
| `/feed` | Feed estilo Threads (curtidas, comentários, realtime) |
| `/mural` | Mensagens motivacionais entre o casal |
| `/progresso` | Fotos antes/depois + medidas + comparador |
| `/estatisticas` | 4 gráficos + heatmap de frequência |
| `/perfil` | Metas personalizadas + presets Hygor/Júlia |

## Sistema de Pontuação FITLOVE Score

| Ação | Pontos |
|------|--------|
| Check-in diário | +5 |
| Meta de água batida | +10 |
| Treino registrado | +15 |
| Meta calórica atingida | +10 |

Ranking diário com 1o e 2o lugar exibido no dashboard.
