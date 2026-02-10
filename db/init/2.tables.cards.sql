-- Table: public.cards
-- 카드 등록 테이블 (신용카드, 체크카드)

-- DROP TABLE IF EXISTS public.cards;

CREATE TABLE public.cards
(
    id TEXT NOT NULL,
    user_id UUID NOT NULL,
    name CHARACTER VARYING(100) NOT NULL,
    company CHARACTER VARYING(50) NOT NULL,
    type CHARACTER VARYING(10) NOT NULL,
    billing_day SMALLINT,
    linked_asset_id TEXT,
    memo TEXT DEFAULT '',
    CONSTRAINT cards_pkey PRIMARY KEY (id),
    CONSTRAINT cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id)
);

CREATE INDEX idx_cards_user_id ON public.cards (user_id);

COMMENT ON TABLE public.cards
    IS '등록 카드 정보';

COMMENT ON COLUMN public.cards.id
    IS '카드 고유 ID (클라이언트 생성)';

COMMENT ON COLUMN public.cards.user_id
    IS '소유 사용자 ID';

COMMENT ON COLUMN public.cards.name
    IS '카드명 (예: 신한 Deep On, 국민 My WE:SH)';

COMMENT ON COLUMN public.cards.company
    IS '카드사 (삼성카드, 신한카드 등)';

COMMENT ON COLUMN public.cards.type
    IS '카드 유형 (debit: 체크카드, credit: 신용카드)';

COMMENT ON COLUMN public.cards.billing_day
    IS '결제일 (1-31, 신용카드만 해당)';

COMMENT ON COLUMN public.cards.linked_asset_id
    IS '결제 출금 계좌 (assets.id 참조)';

COMMENT ON COLUMN public.cards.memo
    IS '메모';
