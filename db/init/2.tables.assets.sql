-- Table: public.assets
-- 자산 테이블 (현금, 예적금, 투자자산, 부동산 등)

-- DROP TABLE IF EXISTS public.assets;

CREATE TABLE public.assets
(
    id TEXT NOT NULL,
    user_id UUID NOT NULL,
    name CHARACTER VARYING(100) NOT NULL,
    type CHARACTER VARYING(20) NOT NULL,
    amount NUMERIC(15, 0) NOT NULL DEFAULT 0,
    institution CHARACTER VARYING(100),
    memo TEXT DEFAULT '',
    updated_at DATE,
    CONSTRAINT assets_pkey PRIMARY KEY (id),
    CONSTRAINT assets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id)
);

CREATE INDEX idx_assets_user_id ON public.assets (user_id);

COMMENT ON TABLE public.assets
    IS '자산 정보 (현금, 예적금, 투자, 부동산 등)';

COMMENT ON COLUMN public.assets.id
    IS '자산 고유 ID (클라이언트 생성)';

COMMENT ON COLUMN public.assets.user_id
    IS '소유 사용자 ID';

COMMENT ON COLUMN public.assets.name
    IS '자산명 (예: 국민은행 급여통장)';

COMMENT ON COLUMN public.assets.type
    IS '자산 유형 (cash, savings, investment, realestate, other)';

COMMENT ON COLUMN public.assets.amount
    IS '현재 잔액/평가액';

COMMENT ON COLUMN public.assets.institution
    IS '금융기관명 (은행, 증권사 등)';

COMMENT ON COLUMN public.assets.memo
    IS '메모';

COMMENT ON COLUMN public.assets.updated_at
    IS '최근 업데이트 일자';
