-- Table: public.loans
-- 대출/부채 테이블

-- DROP TABLE IF EXISTS public.loans;

CREATE TABLE public.loans
(
    id TEXT NOT NULL,
    user_id UUID NOT NULL,
    name CHARACTER VARYING(100) NOT NULL,
    type CHARACTER VARYING(20) NOT NULL,
    principal NUMERIC(15, 0) NOT NULL,
    remaining_balance NUMERIC(15, 0) NOT NULL,
    interest_rate NUMERIC(5, 2) NOT NULL,
    monthly_payment NUMERIC(15, 0) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    institution CHARACTER VARYING(100) NOT NULL,
    memo TEXT DEFAULT '',
    CONSTRAINT loans_pkey PRIMARY KEY (id),
    CONSTRAINT loans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id)
);

CREATE INDEX idx_loans_user_id ON public.loans (user_id);

COMMENT ON TABLE public.loans
    IS '대출/부채 정보';

COMMENT ON COLUMN public.loans.id
    IS '대출 고유 ID (클라이언트 생성)';

COMMENT ON COLUMN public.loans.user_id
    IS '소유 사용자 ID';

COMMENT ON COLUMN public.loans.name
    IS '대출명 (예: KB 주택담보대출)';

COMMENT ON COLUMN public.loans.type
    IS '대출 유형 (mortgage, credit, personal, other)';

COMMENT ON COLUMN public.loans.principal
    IS '대출 원금';

COMMENT ON COLUMN public.loans.remaining_balance
    IS '남은 잔액';

COMMENT ON COLUMN public.loans.interest_rate
    IS '이자율 (%)';

COMMENT ON COLUMN public.loans.monthly_payment
    IS '월 상환액';

COMMENT ON COLUMN public.loans.start_date
    IS '대출 시작일';

COMMENT ON COLUMN public.loans.end_date
    IS '대출 만기일';

COMMENT ON COLUMN public.loans.institution
    IS '금융기관명';

COMMENT ON COLUMN public.loans.memo
    IS '메모';
