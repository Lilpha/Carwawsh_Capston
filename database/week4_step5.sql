-- 1. PostGIS 확장 활성화 (이미 되어있다면 넘어가도 됩니다)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. 주변 세차장 검색 함수 생성
CREATE OR REPLACE FUNCTION get_nearby_washes(
    user_lat float, 
    user_lng float, 
    search_limit int DEFAULT 10
)
RETURNS SETOF gas_station_washes 
AS $$
BEGIN
    RETURN QUERY 
    SELECT * -- 모든 컬럼을 가져오겠다는 선언이 꼭 필요합니다!
    FROM gas_station_washes
    ORDER BY st_distance(
        -- GPS 표준 좌표계인 4326을 사용하는 것이 좋습니다 (기존 4321에서 수정)
        st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography,
        st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
    )
    LIMIT search_limit;
END;
$$ LANGUAGE plpgsql;


select * from public.users;
select * from public.shops;