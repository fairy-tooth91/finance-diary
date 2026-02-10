-- Table: public.portfolio
-- 포트폴리오 (보유 종목 현황) 테이블

-- DROP TABLE IF EXISTS public.portfolio;

CREATE TABLE public.portfolio
(
    stock_code CHARACTER VARYING(20) NOT NULL,
    user_id UUID NOT NULL,
    stock_name CHARACTER VARYING(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    avg_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    current_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    high_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    drop_from_high NUMERIC(8, 2) NOT NULL DEFAULT 0,
    profit_rate NUMERIC(8, 2) NOT NULL DEFAULT 0,
    CONSTRAINT portfolio_pkey PRIMARY KEY (stock_code, user_id),
    CONSTRAINT portfolio_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id)
);

CREATE INDEX idx_portfolio_user_id ON public.portfolio (user_id);

COMMENT ON TABLE public.portfolio
    IS '보유 종목 현황 (매매 기록으로부터 자동 계산)';

COMMENT ON COLUMN public.portfolio.stock_code
    IS '종목 코드 (PK, Yahoo Finance 형식)';

COMMENT ON COLUMN public.portfolio.user_id
    IS '소유 사용자 ID';

COMMENT ON COLUMN public.portfolio.stock_name
    IS '종목명';

COMMENT ON COLUMN public.portfolio.quantity
    IS '보유 수량';

COMMENT ON COLUMN public.portfolio.avg_price
    IS '평균 매입가';

COMMENT ON COLUMN public.portfolio.current_price
    IS '현재가';

COMMENT ON COLUMN public.portfolio.high_price
    IS '고점 가격 (워터마크)';

COMMENT ON COLUMN public.portfolio.drop_from_high
    IS '고점 대비 하락률 (%)';

COMMENT ON COLUMN public.portfolio.profit_rate
    IS '수익률 (%)';
