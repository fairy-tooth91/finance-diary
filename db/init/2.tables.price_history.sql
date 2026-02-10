-- Table: public.price_history
-- 종목 가격 이력 테이블

-- DROP TABLE IF EXISTS public.price_history;

CREATE TABLE public.price_history
(
    id SERIAL NOT NULL,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    stock_code CHARACTER VARYING(20) NOT NULL,
    close_price NUMERIC(15, 2) NOT NULL,
    CONSTRAINT price_history_pkey PRIMARY KEY (id),
    CONSTRAINT price_history_unique UNIQUE (user_id, date, stock_code),
    CONSTRAINT price_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id)
);

CREATE INDEX idx_price_history_user_id ON public.price_history (user_id);
CREATE INDEX idx_price_history_date ON public.price_history (date);
CREATE INDEX idx_price_history_stock_code ON public.price_history (stock_code);

COMMENT ON TABLE public.price_history
    IS '종목 일별 종가 이력 (시세 갱신 시 자동 기록)';

COMMENT ON COLUMN public.price_history.id
    IS '자동 증가 시퀀스 ID';

COMMENT ON COLUMN public.price_history.user_id
    IS '소유 사용자 ID';

COMMENT ON COLUMN public.price_history.date
    IS '기록 일자';

COMMENT ON COLUMN public.price_history.stock_code
    IS '종목 코드';

COMMENT ON COLUMN public.price_history.close_price
    IS '종가';
