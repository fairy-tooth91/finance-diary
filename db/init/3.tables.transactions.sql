-- Table: public.transactions
-- 가계부 거래 내역 테이블

-- DROP TABLE IF EXISTS public.transactions;

CREATE TABLE public.transactions
(
    id TEXT NOT NULL,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    type CHARACTER VARYING(10) NOT NULL,
    category CHARACTER VARYING(30) NOT NULL,
    amount NUMERIC(15, 0) NOT NULL,
    memo TEXT DEFAULT '',
    payment_method CHARACTER VARYING(10),
    card_id TEXT,
    installment_id TEXT,
    CONSTRAINT transactions_pkey PRIMARY KEY (id),
    CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id),
    CONSTRAINT transactions_card_id_fkey FOREIGN KEY (card_id) REFERENCES public.cards (id) ON DELETE SET NULL
);

CREATE INDEX idx_transactions_user_id ON public.transactions (user_id);
CREATE INDEX idx_transactions_date ON public.transactions (date);
CREATE INDEX idx_transactions_card_id ON public.transactions (card_id);

COMMENT ON TABLE public.transactions
    IS '가계부 수입/지출 거래 내역';

COMMENT ON COLUMN public.transactions.id
    IS '거래 고유 ID (클라이언트 생성)';

COMMENT ON COLUMN public.transactions.user_id
    IS '소유 사용자 ID';

COMMENT ON COLUMN public.transactions.date
    IS '거래 일자';

COMMENT ON COLUMN public.transactions.type
    IS '거래 유형 (income: 수입, expense: 지출)';

COMMENT ON COLUMN public.transactions.category
    IS '카테고리 (식비, 교통, 급여 등)';

COMMENT ON COLUMN public.transactions.amount
    IS '금액';

COMMENT ON COLUMN public.transactions.memo
    IS '메모';

COMMENT ON COLUMN public.transactions.payment_method
    IS '결제수단 (cash: 현금, card: 카드) - 지출일 때만';

COMMENT ON COLUMN public.transactions.card_id
    IS '결제 카드 ID (cards.id 참조) - 카드 결제일 때만';

COMMENT ON COLUMN public.transactions.installment_id
    IS '연결된 할부 ID (installments.id) - 할부 결제일 때만';
