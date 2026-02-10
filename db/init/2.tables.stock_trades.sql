-- Table: public.stock_trades
-- 주식 매매 기록 테이블

-- DROP TABLE IF EXISTS public.stock_trades;

CREATE TABLE public.stock_trades
(
    id TEXT NOT NULL,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    stock_name CHARACTER VARYING(100) NOT NULL,
    stock_code CHARACTER VARYING(20) NOT NULL,
    trade_type CHARACTER VARYING(4) NOT NULL,
    quantity INTEGER NOT NULL,
    price NUMERIC(15, 2) NOT NULL,
    total NUMERIC(15, 2) NOT NULL,
    memo TEXT DEFAULT '',
    CONSTRAINT stock_trades_pkey PRIMARY KEY (id),
    CONSTRAINT stock_trades_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id)
);

CREATE INDEX idx_stock_trades_user_id ON public.stock_trades (user_id);
CREATE INDEX idx_stock_trades_date ON public.stock_trades (date);

COMMENT ON TABLE public.stock_trades
    IS '주식 매매 기록';

COMMENT ON COLUMN public.stock_trades.id
    IS '매매 고유 ID (클라이언트 생성)';

COMMENT ON COLUMN public.stock_trades.user_id
    IS '소유 사용자 ID';

COMMENT ON COLUMN public.stock_trades.date
    IS '매매 일자';

COMMENT ON COLUMN public.stock_trades.stock_name
    IS '종목명';

COMMENT ON COLUMN public.stock_trades.stock_code
    IS '종목 코드 (Yahoo Finance 형식)';

COMMENT ON COLUMN public.stock_trades.trade_type
    IS '매매 유형 (buy: 매수, sell: 매도)';

COMMENT ON COLUMN public.stock_trades.quantity
    IS '수량';

COMMENT ON COLUMN public.stock_trades.price
    IS '단가';

COMMENT ON COLUMN public.stock_trades.total
    IS '총 금액 (수량 × 단가)';

COMMENT ON COLUMN public.stock_trades.memo
    IS '메모';
