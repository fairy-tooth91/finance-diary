-- Table: public.users
-- 사용자 테이블 (향후 Supabase Auth 연동 가능하도록 UUID 사용)

-- DROP TABLE IF EXISTS public.users;

CREATE TABLE public.users
(
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    email CHARACTER VARYING(255) NOT NULL,
    name CHARACTER VARYING(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_unique UNIQUE (email)
);

COMMENT ON TABLE public.users
    IS '사용자 정보';

COMMENT ON COLUMN public.users.id
    IS '사용자 고유 ID (UUID, Supabase Auth 호환)';

COMMENT ON COLUMN public.users.email
    IS '사용자 이메일 (로그인 식별자)';

COMMENT ON COLUMN public.users.name
    IS '사용자 표시 이름';

COMMENT ON COLUMN public.users.created_at
    IS '계정 생성 시각';

COMMENT ON COLUMN public.users.updated_at
    IS '계정 정보 수정 시각';

-- 기본 사용자 생성 (인증 기능 추가 전까지 사용)
INSERT INTO public.users (id, email, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'default@finance-diary.local', '기본 사용자')
ON CONFLICT (id) DO NOTHING;
