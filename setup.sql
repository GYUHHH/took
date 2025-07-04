-- 메시지 테이블 생성
CREATE TABLE IF NOT EXISTS public.messages (
    id BIGSERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 방문자 통계 테이블 생성
CREATE TABLE IF NOT EXISTS public.visitor_stats (
    id BIGSERIAL PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    total_visitors BIGINT DEFAULT 0,
    daily_visitors INTEGER DEFAULT 0,
    max_daily_visitors INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_stats ENABLE ROW LEVEL SECURITY;

-- 메시지 테이블 정책 - 모든 사용자가 읽기/쓰기 가능
CREATE POLICY "Messages are public" ON public.messages
    FOR ALL USING (true);

-- 방문자 통계 정책 - 모든 사용자가 읽기/쓰기 가능
CREATE POLICY "Visitor stats are public" ON public.visitor_stats
    FOR ALL USING (true);

-- 방문자 수 증가 함수
CREATE OR REPLACE FUNCTION increment_visitor_count()
RETURNS JSON AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
    current_stats RECORD;
    yesterday_stats RECORD;
    result JSON;
BEGIN
    -- 오늘 통계 가져오기 또는 생성
    INSERT INTO public.visitor_stats (date, total_visitors, daily_visitors, max_daily_visitors)
    VALUES (today_date, 1, 1, 1)
    ON CONFLICT (date) DO UPDATE SET
        total_visitors = visitor_stats.total_visitors + 1,
        daily_visitors = visitor_stats.daily_visitors + 1,
        max_daily_visitors = GREATEST(visitor_stats.max_daily_visitors, visitor_stats.daily_visitors + 1),
        updated_at = NOW()
    RETURNING * INTO current_stats;
    
    -- 어제 통계 가져오기
    SELECT daily_visitors INTO yesterday_stats
    FROM public.visitor_stats 
    WHERE date = yesterday_date;
    
    -- 결과 JSON 생성
    result := json_build_object(
        'total', current_stats.total_visitors,
        'today', current_stats.daily_visitors,
        'yesterday', COALESCE(yesterday_stats.daily_visitors, 0),
        'max_daily', current_stats.max_daily_visitors
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 초기 데이터 삽입 (방문자 통계)
INSERT INTO public.visitor_stats (date, total_visitors, daily_visitors, max_daily_visitors)
VALUES (CURRENT_DATE, 123, 7, 89)
ON CONFLICT (date) DO NOTHING;

-- 테스트 메시지 삽입 (선택적)
INSERT INTO public.messages (content)
VALUES 
    ('환영합니다! 첫 번째 메시지입니다.'),
    ('Supabase와 연동된 메시지 보드입니다.')
ON CONFLICT DO NOTHING;