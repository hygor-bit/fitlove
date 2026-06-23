-- ============================================================
-- FITLOVE — Inicialização Completa do Banco de Dados
-- Execute este arquivo no Supabase SQL Editor
-- Projeto: ecxinxxbeaspzfkgawbe.supabase.co
-- ============================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. REMOVER TABELAS EXISTENTES (ordem respeitando FK)
-- ============================================================
DROP TABLE IF EXISTS public.notifications        CASCADE;
DROP TABLE IF EXISTS public.motivation_messages  CASCADE;
DROP TABLE IF EXISTS public.body_progress        CASCADE;
DROP TABLE IF EXISTS public.comments             CASCADE;
DROP TABLE IF EXISTS public.likes                CASCADE;
DROP TABLE IF EXISTS public.posts                CASCADE;
DROP TABLE IF EXISTS public.nutrition_logs       CASCADE;
DROP TABLE IF EXISTS public.workouts             CASCADE;
DROP TABLE IF EXISTS public.water_logs           CASCADE;
DROP TABLE IF EXISTS public.daily_habits         CASCADE;
DROP TABLE IF EXISTS public.profiles             CASCADE;

-- ============================================================
-- 2. PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name             TEXT NOT NULL DEFAULT '',
  avatar_url       TEXT,
  weight_current   NUMERIC(5,2),
  weight_goal      NUMERIC(5,2),
  objective        TEXT,
  calories_goal    INTEGER NOT NULL DEFAULT 2000,
  protein_goal     INTEGER NOT NULL DEFAULT 150,
  carbs_goal       INTEGER NOT NULL DEFAULT 300,
  fat_goal         INTEGER NOT NULL DEFAULT 60,
  water_goal       INTEGER NOT NULL DEFAULT 3000,  -- em ml
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. DAILY_HABITS
-- ============================================================
CREATE TABLE public.daily_habits (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date               DATE NOT NULL,
  water_consumed     INTEGER NOT NULL DEFAULT 0,     -- em ml
  calories_consumed  INTEGER NOT NULL DEFAULT 0,
  protein_consumed   INTEGER NOT NULL DEFAULT 0,
  carbs_consumed     INTEGER NOT NULL DEFAULT 0,
  fat_consumed       INTEGER NOT NULL DEFAULT 0,
  trained            BOOLEAN NOT NULL DEFAULT FALSE,
  checkin_done       BOOLEAN NOT NULL DEFAULT FALSE,
  fitlove_score      INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================================
-- 4. WATER_LOGS
-- ============================================================
CREATE TABLE public.water_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount_ml   INTEGER NOT NULL,
  logged_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. WORKOUTS
-- ============================================================
CREATE TABLE public.workouts (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type               TEXT NOT NULL,
  duration_minutes   INTEGER NOT NULL DEFAULT 0,
  notes              TEXT,
  logged_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. NUTRITION_LOGS
-- ============================================================
CREATE TABLE public.nutrition_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_name   TEXT NOT NULL,
  calories    INTEGER NOT NULL DEFAULT 0,
  protein     INTEGER NOT NULL DEFAULT 0,
  carbs       INTEGER NOT NULL DEFAULT 0,
  fat         INTEGER NOT NULL DEFAULT 0,
  logged_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. POSTS (Feed estilo Threads)
-- ============================================================
CREATE TABLE public.posts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content         TEXT NOT NULL DEFAULT '',
  image_url       TEXT,
  likes_count     INTEGER NOT NULL DEFAULT 0,
  comments_count  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. LIKES
-- ============================================================
CREATE TABLE public.likes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ============================================================
-- 9. COMMENTS
-- ============================================================
CREATE TABLE public.comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id     UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. BODY_PROGRESS
-- ============================================================
CREATE TABLE public.body_progress (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weight        NUMERIC(5,2),
  chest         NUMERIC(5,2),
  waist         NUMERIC(5,2),
  hips          NUMERIC(5,2),
  arm           NUMERIC(5,2),
  thigh         NUMERIC(5,2),
  photo_url     TEXT,
  notes         TEXT,
  recorded_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. MOTIVATION_MESSAGES (Mural do amor)
-- ============================================================
CREATE TABLE public.motivation_messages (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message        TEXT NOT NULL DEFAULT '',
  image_url      TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message     TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. ROW LEVEL SECURITY — HABILITAR
-- ============================================================
ALTER TABLE public.profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_habits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_progress        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motivation_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications        ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 14. POLICIES — PROFILES
-- ============================================================
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 15. POLICIES — DAILY_HABITS
-- ============================================================
CREATE POLICY "daily_habits_all_own"
  ON public.daily_habits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- O casal pode ver os hábitos um do outro (para o ranking)
CREATE POLICY "daily_habits_select_authenticated"
  ON public.daily_habits FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================
-- 16. POLICIES — WATER_LOGS
-- ============================================================
CREATE POLICY "water_logs_all_own"
  ON public.water_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 17. POLICIES — WORKOUTS
-- ============================================================
CREATE POLICY "workouts_all_own"
  ON public.workouts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 18. POLICIES — NUTRITION_LOGS
-- ============================================================
CREATE POLICY "nutrition_logs_all_own"
  ON public.nutrition_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 19. POLICIES — POSTS
-- ============================================================
CREATE POLICY "posts_select_authenticated"
  ON public.posts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "posts_insert_own"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update_own"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_delete_own"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 20. POLICIES — LIKES
-- ============================================================
CREATE POLICY "likes_select_authenticated"
  ON public.likes FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "likes_insert_own"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_delete_own"
  ON public.likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 21. POLICIES — COMMENTS
-- ============================================================
CREATE POLICY "comments_select_authenticated"
  ON public.comments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "comments_insert_own"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_delete_own"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 22. POLICIES — BODY_PROGRESS
-- ============================================================
CREATE POLICY "body_progress_all_own"
  ON public.body_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 23. POLICIES — MOTIVATION_MESSAGES
-- ============================================================
CREATE POLICY "motivation_messages_select_own"
  ON public.motivation_messages FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "motivation_messages_insert_own"
  ON public.motivation_messages FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "motivation_messages_delete_own"
  ON public.motivation_messages FOR DELETE
  USING (auth.uid() = from_user_id);

-- ============================================================
-- 24. POLICIES — NOTIFICATIONS
-- ============================================================
CREATE POLICY "notifications_all_own"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 25. STORAGE — BUCKET fitlove (fotos de progresso e posts)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fitlove',
  'fitlove',
  TRUE,
  10485760,  -- 10MB por arquivo
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = TRUE,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif'];

-- ============================================================
-- 26. STORAGE — POLICIES
-- ============================================================
DROP POLICY IF EXISTS "fitlove_public_select" ON storage.objects;
DROP POLICY IF EXISTS "fitlove_auth_insert"   ON storage.objects;
DROP POLICY IF EXISTS "fitlove_auth_update"   ON storage.objects;
DROP POLICY IF EXISTS "fitlove_auth_delete"   ON storage.objects;

CREATE POLICY "fitlove_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'fitlove');

CREATE POLICY "fitlove_auth_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'fitlove' AND auth.role() = 'authenticated');

CREATE POLICY "fitlove_auth_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'fitlove' AND auth.role() = 'authenticated');

CREATE POLICY "fitlove_auth_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'fitlove' AND auth.role() = 'authenticated');

-- ============================================================
-- 27. REALTIME — Habilitar para tabelas do feed
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.motivation_messages;

-- ============================================================
-- 28. INDEXES — Performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_daily_habits_user_date  ON public.daily_habits(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_water_logs_user_date    ON public.water_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_user_date      ON public.workouts(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_nutrition_user_date     ON public.nutrition_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_created           ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post           ON public.comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_likes_post              ON public.likes(post_id);
CREATE INDEX IF NOT EXISTS idx_body_progress_user      ON public.body_progress(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_motivation_to           ON public.motivation_messages(to_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user      ON public.notifications(user_id, created_at DESC);

-- ============================================================
-- 29. FUNCTION — Auto-criar profile após signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, calories_goal, protein_goal, carbs_goal, fat_goal, water_goal)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    2000, 150, 300, 60, 3000
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 30. SEED — Dados de exemplo
-- ============================================================
-- INSTRUÇÕES: Após criar as contas de Hygor e Júlia via /login,
-- copie os UUIDs de auth.users e substitua abaixo.
-- Você pode encontrar os UUIDs em: Supabase → Authentication → Users

-- Exemplo (substitua pelos UUIDs reais):
-- DO $$
-- DECLARE
--   hygor_id UUID := 'UUID-DO-HYGOR-AQUI';
--   julia_id UUID := 'UUID-DA-JULIA-AQUI';
-- BEGIN
--
--   -- Atualizar perfil do Hygor
--   UPDATE public.profiles SET
--     name = 'Hygor',
--     objective = 'Ganhar massa muscular',
--     weight_current = 75,
--     weight_goal = 80,
--     calories_goal = 2750,
--     protein_goal = 150,
--     carbs_goal = 400,
--     fat_goal = 60,
--     water_goal = 3000
--   WHERE user_id = hygor_id;
--
--   -- Atualizar perfil da Júlia
--   UPDATE public.profiles SET
--     name = 'Júlia',
--     objective = 'Perder gordura e definir',
--     weight_current = 65,
--     weight_goal = 58,
--     calories_goal = 1650,
--     protein_goal = 140,
--     carbs_goal = 145,
--     fat_goal = 55,
--     water_goal = 3000
--   WHERE user_id = julia_id;
--
--   -- Hábito de hoje para Hygor
--   INSERT INTO public.daily_habits (user_id, date, water_consumed, calories_consumed, protein_consumed, trained, checkin_done, fitlove_score)
--   VALUES (hygor_id, CURRENT_DATE, 2000, 2100, 120, true, true, 30)
--   ON CONFLICT (user_id, date) DO UPDATE SET
--     water_consumed = 2000, calories_consumed = 2100, trained = true, checkin_done = true, fitlove_score = 30;
--
--   -- Hábito de hoje para Júlia
--   INSERT INTO public.daily_habits (user_id, date, water_consumed, calories_consumed, protein_consumed, trained, checkin_done, fitlove_score)
--   VALUES (julia_id, CURRENT_DATE, 2500, 1400, 100, true, true, 35)
--   ON CONFLICT (user_id, date) DO UPDATE SET
--     water_consumed = 2500, calories_consumed = 1400, trained = true, checkin_done = true, fitlove_score = 35;
--
--   -- Posts de exemplo
--   INSERT INTO public.posts (user_id, content)
--   VALUES
--     (hygor_id, 'Treino de peito concluído hoje! Batendo todas as metas 💪🔥'),
--     (julia_id, 'Meta de água batida! 2.5L hoje 💧 Orgulhosa demais!'),
--     (hygor_id, 'Juntos somos mais fortes! 12 dias consecutivos! ❤️');
--
--   -- Mensagem no mural
--   INSERT INTO public.motivation_messages (from_user_id, to_user_id, message)
--   VALUES (hygor_id, julia_id, 'Você é incrível! Estou muito orgulhoso do seu esforço todos os dias ❤️');
--
-- END $$;

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
