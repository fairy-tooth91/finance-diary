-- Table: public.installments
-- 카드 할부 테이블

-- DROP TABLE IF EXISTS public.installments;

CREATE TABLE public.installments
(
    id TEXT NOT NULL,
    user_id UUID NOT NULL,
    item_name CHARACTER VARYING(200) NOT NULL,
    card_id TEXT NOT NULL,
    card_name CHARACTER VARYING(100) NOT NULL,
    category CHARACTER VARYING(30) NOT NULL,
    total_amount NUMERIC(15, 0) NOT NULL,
    monthly_amount NUMERIC(15, 0) NOT NULL,
    total_months SMALLINT NOT NULL,
    paid_months SMALLINT NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    payment_day SMALLINT NOT NULL,
    memo TEXT DEFAULT '',
    CONSTRAINT installments_pkey PRIMARY KEY (id),
    CONSTRAINT installments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id),
    CONSTRAINT installments_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards (id) ON DELETE CASCADE
);

CREATE INDEX idx_installments_user_id ON public.installments (user_id);
CREATE INDEX idx_installments_card_id ON public.installments (card_id);

COMMENT ON TABLE public.installments
    IS '카드 할부 결제 정보';

COMMENT ON COLUMN public.installments.id
    IS '할부 고유 ID (클라이언트 생성)';

COMMENT ON COLUMN public.installments.user_id
    IS '소유 사용자 ID';

COMMENT ON COLUMN public.installments.item_name
    IS '품목명 (예: 노트북, 항공권)';

COMMENT ON COLUMN public.installments.card_id
    IS '결제 카드 ID (cards.id 참조)';

COMMENT ON COLUMN public.installments.card_name
    IS '카드명 (표시용, 비정규화)';

COMMENT ON COLUMN public.installments.category
    IS '지출 카테고리 (쇼핑, 교통 등)';

COMMENT ON COLUMN public.installments.total_amount
    IS '총 할부 금액';

COMMENT ON COLUMN public.installments.monthly_amount
    IS '월 납입액';

COMMENT ON COLUMN public.installments.total_months
    IS '총 할부 개월 수';

COMMENT ON COLUMN public.installments.paid_months
    IS '납입 완료 개월 수';

COMMENT ON COLUMN public.installments.start_date
    IS '첫 결제일';

COMMENT ON COLUMN public.installments.payment_day
    IS '매월 결제일 (1-31)';

COMMENT ON COLUMN public.installments.memo
    IS '메모';
