
-- [Phase 2] 서비스용 테이블 생성 (public 명시)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY, -- auth.users를 참조하는 외래키
    email TEXT UNIQUE NOT NULL,
    car_number TEXT, -- 가입 시점 유연성을 위해 NOT NULL 제거 권장
    car_type TEXT CHECK (car_type IN ('승용', 'SUV')) DEFAULT '승용',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_users_car_number ON public.users(car_number);

CREATE TABLE public.shops (
    id SERIAL PRIMARY KEY,
    management_number TEXT UNIQUE,
    name TEXT NOT NULL,
    address TEXT,
    op_status TEXT,
    latitude NUMERIC(12, 9),
    longitude NUMERIC(12, 9),
    location GEOGRAPHY(POINT, 4326), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_shops_location ON public.shops USING GIST (location);

-- [Phase 3] 데이터 이관 및 검증
INSERT INTO public.shops (management_number, name, address, op_status, latitude, longitude, location)
SELECT management_number, name, address, op_status, latitude, longitude, location
FROM public.gas_station_washes;

-- [Phase 4] 테스트 및 조회 (public 명시)
-- 1. 데이터 개수 확인
SELECT count(*) FROM public.shops;

-- 실패 테스트 (에러가 발생해야 함: CHECK 제약 조건 위반)
INSERT INTO public.users (id, email, car_number, car_type)
VALUES ('임의의-UUID-값', 'test@test.com', '12가 3456', '트럭');

-- 2. 한림대 기준 거리순 조회
SELECT name, address,
       ST_Distance(location, ST_SetSRID(ST_MakePoint(127.7383, 37.8864), 4326)::geography) AS dist
FROM public.shops
ORDER BY location <-> ST_SetSRID(ST_MakePoint(127.7383, 37.8864), 4326)::geography
LIMIT 5;