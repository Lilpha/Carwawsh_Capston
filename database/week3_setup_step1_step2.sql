-- Step1
-- 회원 정보 및 차량 매칭 테이블 생성
CREATE TABLE users (
                       uid TEXT PRIMARY KEY,               -- Firebase Auth에서 발급한 고유 ID (연결고리)
                       email TEXT UNIQUE NOT NULL,         -- 로그인용 이메일
                       car_number TEXT NOT NULL,           -- 사용자가 입력한 차량 번호
                       car_type TEXT DEFAULT '승용',        -- 차종 (나중에 매칭 알고리즘용)
                       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 검색 성능을 위해 차량 번호에 인덱스 추가
CREATE INDEX idx_users_car_number ON users(car_number);

-- 현재 데이터베이스의 시간대를 서울로 변경
SET timezone = 'Asia/Seoul';
SHOW timezone;

-- 회원 테이블 조회
SELECT * FROM users;


-- Step 2
-- 1. 기존 테이블 삭제
DROP TABLE IF EXISTS gas_station_washes;

-- 2. 테이블 재생성
CREATE TABLE gas_station_washes (
                                    id SERIAL PRIMARY KEY,
                                    management_number TEXT UNIQUE,
                                    name TEXT NOT NULL,
                                    address TEXT,
                                    op_status TEXT,
                                    water_permit_number TEXT,
                                    latitude NUMERIC(12, 9),
                                    longitude NUMERIC(12, 9),
                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. csv 데이터 insert문
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500001', '춘천 세차의고수', '강원특별자치도 춘천시 신북읍 율문리 37-69', '자동차 세차업', '4181000-22-2023-00004', 37.9259304, 127.7551919);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500002', '컴인워시만천점', '강원특별자치도 춘천시 동면 만천리 452-1', '자동차 세차업', '4181000-22-2023-00003', 37.87667661, 127.772839);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500003', '코오롱모터스㈜춘천서비스센터', '강원특별자치도 춘천시 동면 장학리 502-4', '자동차 정비업', '4181000-22-2023-00006', 37.9150099, 127.7534641);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500004', '주식회사 춘천시민버스', '강원특별자치도 춘천시 동면 장학리 794-15 후평동버스종점', '차량 세차업', '4181000-22-2022-00011', 37.8947055, 127.7494558);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500005', '디테일러명 춘천점', '강원특별자치도 춘천시 퇴계동 375-14', '차량 세차업', '4181000-22-2023-00001', 37.8605272, 127.7309453);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500006', '유한회사 케이앤비', '강원특별자치도 춘천시 삼천동 84', '차량 세차업', '4180000-22-2022-00005', 37.51416, 127.422387);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500007', '(주)부광(세차의 고수 장학리점)', '강원특별자치도 춘천시 동면 장학리 89-24', '차량 세차업', '4180000-22-2022-00009', 37.534808, 127.454523);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500008', '에이비씨 자동세차장', '강원특별자치도 춘천시 동내면 거두리 682-9', '차량 세차업', '4180000-22-2022-00008', 37.513262, 127.453802);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500009', '컴인워시 거두점', '강원특별자치도 춘천시 동내면 거두리 665-8', '차량 세차업', '4180000-22-2022-00006', 37.514473, 127.45336);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500010', '춘천농협농수산물종합유통센터', '강원특별자치도 춘천시 석사동 980', '차량 세차업', '4180000-22-2020-00004', 37.514547, 127.445024);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500011', '정석자동차정비', '강원특별자치도 춘천시 후평동 194-2', '자동차 수리업', '4180000-22-2022-00001', 37.533369, 127.450425);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500012', '우정세차장', '강원특별자치도 춘천시 동면 만천리 280-1', '차량 세차업', '4180000-22-2022-00007', 37.523594, 127.462536);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500013', '진성카센타', '강원특별자치도 춘천시 남춘로51번길6', '자동차세차업', '4180000-22-2022-00004', 37.865759, 127.7321768);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500014', '워시존춘천2호점', '강원특별자치도 춘천시 충열로 301', '자동차세차업', '4180000-22-2021-00016', 37.91999181, 127.738863);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500015', '춘천시농업기술센터', '강원특별자치도 춘천시 신동면 한치로 896-4', '자동차세차업', '4180000-22-2021-00007', 37.81335685, 127.6988226);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500016', '샤워박스', '강원특별자치도 춘천시 옛경춘로 761', '자동차세차업', '4180000-22-2021-00006', 37.86561325, 127.7062811);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500017', '㈜에이피알팩토리', '강원특별자치도 춘천시 신동면 정족길 207', '자동차세차업', '4180000-22-2021-00002', 37.84218045, 127.7323125);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500018', '하나셀프세차타운', '강원특별자치도 춘천시 김유정로 1796', '자동차세차업', '4180000-22-2020-00005', 37.84710553, 127.7326085);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500019', '극동펌프카(우리건기)', '강원특별자치도 춘천시 신동면 정족리 676-11', '자동차 세차업', '4180000-22-2019-00013', 37.842363, 127.733012);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500020', '춘천경민펌프카(화인중기)', '강원특별자치도 춘천시 동면 금촌로 342', '자동차 세차업', '4180000-22-2019-00011', 37.87227858, 127.7817446);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500021', '춘천농협 경제사업소', '강원특별자치도 춘천시 사우4길 10-1 (우두동)', '주유소 운영업', '4180000-22-2019-00005', 37.904217, 127.727123);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500022', 'TM모터스', '강원특별자치도 춘천시 효자로 8 (퇴계동)', '자동차 세차업', '4180000-22-2018-00012', 37.86526962, 127.7265673);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500023', '닥터스팀', '강원특별자치도 춘천시 백령로147번길 7 (효자동)', '자동차 세차업', '4180000-22-2018-00010', 37.8750956, 127.742385);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500024', '365셀프세차장', '강원특별자치도 춘천시 김유정로 1832', '자동차 세차업', '4180000-22-2018-00009', 37.84997156, 127.7347341);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500025', '디테일링 라인', '강원특별자치도 춘천시 춘천로 417 (후평동)', '자동차 세차업', '4180000-22-2018-00003', 37.89050574, 127.7519344);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500026', '바이카크리닝', '강원특별자치도 춘천시 남춘천길 16 (퇴계동)', '자동차 세차업', '4180000-22-2017-00009', 37.86536971, 127.7267001);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500027', '유워시셀프세차장', '강원특별자치도 춘천시 충열로 1-42 (우두동)', '자동차 세차업', '4180000-22-2017-00007', 37.90188707, 127.7329487);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500028', '춘천강동농협주유소', '강원특별자치도 춘천시 동면 춘천로 469', '주유소 운영업', '4180000-22-2017-00004', 37.89338419, 127.7565748);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500029', '만천셀프세차타운', '강원특별자치도 춘천시 동면 춘천순환로 346', '주유소 운영업', '4180000-22-2016-00012', 37.87233124, 127.7693751);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500030', '한일모터스', '강원특별자치도 춘천시 삭주로 152 (후평동)', '자동차 세차업', '4180000-22-2016-00003', 37.8855742, 127.7471009);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500031', '동양주유소', '강원특별자치도 춘천시 동산면 영서로 51', '주유소 운영업', '4180000-22-2015-00011', 37.74430336, 127.8269822);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500032', '춘천셀프세차장', '강원특별자치도 춘천시 역전옛길 2 (퇴계동)', '자동차 세차업', '4180000-22-2015-00009', 37.86125436, 127.7295961);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500033', 'Laser Wash (레이저워시)', '강원특별자치도 춘천시 동면 춘천순환로 585', '자동차 세차업', '4180000-22-2015-00008', 37.89104042, 127.7567873);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500034', '워시존춘천점', '강원특별자치도 춘천시 충열로 305 (우두동)', '자동차 세차업', '4180000-22-2015-00005', 37.9203191, 127.7388544);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500035', '키다리광택', '강원특별자치도 춘천시 퇴계로 35 (퇴계동)', '자동차 세차업', '4180000-22-2015-00001', 37.86537227, 127.7257001);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500036', '춘천LPG충전소', '강원특별자치도 춘천시 경춘로 2307 (온의동)', '차량용 가스 충전업', '4180000-22-2014-00003', 37.86007479, 127.7168755);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500037', '만남의광장주유소', '강원특별자치도 춘천시 경춘로 2137', '주유소 운영업', '4180000-22-2014-00002', 37.84541728, 127.7140932);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500038', '춘천씨티주유소', '강원특별자치도 춘천시 동내면 세실로 20', '주유소 운영업', '4180000-22-2013-00007', 37.85942295, 127.7604638);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500039', '청춘셀프24', '강원특별자치도 춘천시 동면 소양강로 152', '자동차 세차업', '4180000-22-2013-00006', 37.900745, 127.7517566);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500040', '청춘자동세차', '강원특별자치도 춘천시 동면 만천로 46', '자동차 세차업', '4180000-22-2013-00001', 37.87886091, 127.7683109);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500041', '잭슨세차장', '강원특별자치도 춘천시 효자로14번길 27 (퇴계동)', '자동차 세차업', '4180000-22-2012-00014', 37.86479551, 127.7292265);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500042', '랠리세차장', '강원특별자치도 춘천시 퇴계농공로 17 (석사동)', '자동차 세차업', '4180000-22-2012-00012', 37.85175987, 127.7454915);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500043', '장학충전소', '강원특별자치도 춘천시 동면 춘천순환로 913 (446-1번지)', '차량용 가스 충전업', '4180000-22-2012-00006', 37.91988271, 127.7503001);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500044', '우진모터스', '강원특별자치도 춘천시 영서로 2141번길 45', '자동차 수리 및 세차업', '4180000-22-2012-00002', 37.85379522, 127.7352948);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500045', '남산농협경제사업장', '강원특별자치도 춘천시 남산면 한치로 119', '자동차 세차업', '4180000-22-2012-00001', 37.78798629, 127.6476185);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500046', '(주)제이씨가스 춘천충전소', '강원특별자치도 춘천시 공지로 681', '차량용 가스 충전업', '4180000-22-2011-00011', 37.89189433, 127.7218132);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500047', '뉴본모터스손세차', '강원특별자치도 춘천시 터미널길 4 (온의동)', '자동차 세차업', '4180000-22-2011-00010', 37.86568101, 127.7194345);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500048', '보쉬카세차장', '강원특별자치도 춘천시 춘주로 186 (퇴계동)', '자동차 세차업', '4180000-22-2011-00009', 37.85936206, 127.7279048);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500049', '플러스세차장', '강원특별자치도 춘천시 윗무린개길 8 (퇴계동)', '자동차 세차업', '4180000-22-2011-00008', 37.85101444, 127.7368169);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500050', '샘밭경자동차부분정비', '강원특별자치도 춘천시 신북읍 율문길 89', '자동차 수리 및 세차업', '4180000-22-2011-00007', 37.92544307, 127.7474904);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500051', '그린오토월드', '강원특별자치도 춘천시 영서로 2440  (근화동 748-21  785-7  785-13)', '자동차 수리 및 세차업', '4180000-22-2011-00006', 37.87656163, 127.7121615);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500052', '세진셀프세차장', '강원특별자치도 춘천시 영서로 2442 (근화동 785-6)', '자동차 세차업', '4180000-22-2011-00005', 37.87670109, 127.7117446);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500053', '대성주유소', '강원특별자치도 춘천시 공지로 443 (근화동)', '주유소 운영업', '4180000-22-2011-00001', 37.8736636, 127.7181983);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500054', '(주)가스코 유정에너지', '강원특별자치도 춘천시 신동면 한치로 966-176 (179-8 179-12 179-13 179-15번지)', '차량용 가스 충전업', '4180000-22-2010-00007', 37.80502195, 127.7076632);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500055', '(주)춘천개인택시가스충전소', '강원특별자치도 춘천시 옛경춘로 743 (삼천동)', '차량용 가스 충전업', '4180000-22-2010-00006', 37.86412097, 127.7062779);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500056', '(주)춘천중부1급정비', '강원특별자치도 춘천시 동내면 동내로 57', '자동차 세차업', '4180000-22-2009-00011', 37.84913438, 127.7593356);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500057', '한국도로공사 춘천지사', '강원특별자치도 춘천시 남면 한덕발산길 1302-5', '자동차 세차업', '4180000-22-2009-00005', 37.73846325, 127.6268702);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500058', '남춘천충전소', '강원특별자치도 춘천시 신동면 김유정로 1702', '차량용 가스 충전업', '4180000-22-2008-00015', 37.83949186, 127.7318446);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500059', '(주)중부에너지', '강원특별자치도 춘천시 신동면 경춘로 1757', '주유소 운영업', '4180000-22-2008-00005', 37.82309544, 127.6948468);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500060', '현대오일뱅크(주) 직영 위도현대주유소', '강원특별자치도 춘천시 영서로 2905', '주유소 운영업', '4180000-22-2008-00001', 37.91154409, 127.7220188);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500061', '새만천주유소', '강원특별자치도 춘천시 동면 만천로 139', '주유소 운영업', '4180000-22-2007-00008', 37.88227676, 127.7589392);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500062', '키웨스트', '강원특별자치도 춘천시 영서로 2986 (사농동)', '차량용 가스 충전업', '4180000-22-2007-00005', 37.91868457, 127.7217656);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500063', '현대오일뱅크 소양강셀프주유소', '강원특별자치도 춘천시 영서로 2998 (사농동)', '주유소 운영업', '4180000-22-2007-00004', 37.91993282, 127.7215412);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500064', '남춘천주유소', '강원특별자치도 춘천시 퇴계로 73 (퇴계동)', '주유소 운영업', '4180000-22-2007-00001', 37.8633585, 127.729085);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500065', '(주)호반월드', '강원특별자치도 춘천시 백령로 24 (효자동)', '자동차 세차업', '4180000-22-2006-00012', 37.86610474, 127.7377309);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500066', '이덕기카세차장', '강원특별자치도 춘천시 후평동 720-2', '자동차 세차업', '4180000-22-2006-00007', 37.87946046, 127.7620065);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500067', '행복한주유소', '강원특별자치도 춘천시 후석로 453 (후평동)', '주유소 운영업', '4180000-22-2006-00005', 37.88932335, 127.7417685);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500068', '영서에너지(주) 우리집주유소', '강원특별자치도 춘천시 동면 공단로 107', '주유소 운영업', '4180000-22-2005-00021', 37.8958253, 127.7484642);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500069', '찬크린셀프세차장', '강원특별자치도 춘천시 동내면 공지로 70-51', '자동차 세차업', '4180000-22-2005-00020', 37.85475582, 127.7515302);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500070', '파란주유소', '강원특별자치도 춘천시 춘천로 236 (효자동)', '주유소 운영업', '4180000-22-2005-00016', 37.87831385, 127.7400759);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500071', '구름다리주유소', '강원특별자치도 춘천시 동면 후만로 137', '주유소 운영업', '4180000-22-2005-00007', 37.87826547, 127.7595527);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500072', '새춘천주유소', '강원특별자치도 춘천시 동내면 세실로 38', '주유소 운영업', '4180000-22-2005-00005', 37.86085304, 127.7594376);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500073', '봄내주유소', '강원특별자치도 춘천시 김유정로 1863 (퇴계동)', '주유소 운영업', '4180000-22-2005-00002', 37.85342508, 127.7351275);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500074', '(주)동보', '강원특별자치도 춘천시 춘천로 331 (후평동)', '차량용 가스 충전업', '4180000-22-2004-00014', 37.88310203, 127.7482399);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500075', '366일세차장', '강원특별자치도 춘천시 공지로 449', '자동차 세차업', '4180000-22-2004-00012', 37.87377193, 127.717572);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500076', '(주)중앙에너지산업', '강원특별자치도 춘천시 동내면 영서로 1864', '차량용 가스 충전업', '4180000-22-2004-00011', 37.84294729, 127.7592539);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500077', '(합)경춘가스충전소', '강원특별자치도 춘천시 동면 춘천로 523', '차량용 가스 충전업', '4180000-22-2004-00005', 37.89596788, 127.7616309);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500078', '박재선세차장', '강원특별자치도 춘천시 춘천로 327 (후평동)', '자동차 세차업', '4180000-22-2004-00003', 37.88297204, 127.7482795);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500079', '(주)이오젠', '강원특별자치도 춘천시 동내면 순환대로 758', '자동차 세차업', '4180000-22-2003-00020', 37.84793072, 127.7715347);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500080', '춘천오렌지충전소', '강원특별자치도 춘천시 동면 후만로 158', '차량용 가스 충전업', '4180000-22-2003-00015', 37.87823638, 127.7612664);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500081', '카&라이프', '강원특별자치도 춘천시 영서로 2792 (우두동)', '자동차 세차업', '4180000-22-2003-00010', 37.90250039, 127.728193);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500082', '엘지세차장', '강원특별자치도 춘천시 세실로 100-12 (석사동)', '자동차 세차업', '4180000-22-2003-00004', 37.86616165, 127.7593875);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500083', 'SK에너지(주)소양강Self주유소', '강원특별자치도 춘천시 소양로 206 (소양로1가)', '주유소 운영업', '4180000-22-2003-00002', 37.89130551, 127.7261456);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500084', '셀세모 춘천-나만의 세차장', '강원특별자치도 춘천시 보안길 111 (후평동)', '자동차 세차업', '4180000-22-2002-00032', 37.88430651, 127.7498071);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500085', '유림카센타', '강원특별자치도 춘천시 동내면 학곡서1길 3', '자동차 수리 및 세차업', '4180000-22-2002-00021', 37.8340499, 127.7603351);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500086', '소양기공사', '강원특별자치도 춘천시 공지로482번길 5 (근화동)', '자동차 세차업', '4180000-22-2002-00014', 37.87597755, 127.7151792);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500087', '우리집셀프세차장', '강원특별자치도 춘천시 안마산로 40 (퇴계동)', '자동차 세차업', '4180000-22-2002-00007', 37.85773783, 127.7207027);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500088', '대영주유소', '강원특별자치도 춘천시 영서로 3100', '주유소 운영업', '4180000-22-2002-00005', 37.92885627, 127.7220152);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500089', '춘천터미널충전소', '강원특별자치도 춘천시 경춘로 2167 (온의동 497 497-1 498)', '차량용 가스 충전업', '4180000-22-2002-00001', 37.84784388, 127.7144757);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500090', '미성자동차정비세차장', '강원특별자치도 춘천시 춘천로146번길 17-4 (운교동)', '자동차 수리 및 세차업', '4180000-22-2001-00350', 37.87473675, 127.7323614);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500091', '노터치 세차장', '강원특별자치도 춘천시 후석로 464 (후평동)', '자동차 세차업', '4180000-22-2001-00347', 37.89041433, 127.7413475);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500092', '대한모터스', '강원특별자치도 춘천시 사우로 60 (우두동)', '자동차 세차업', '4180000-22-2001-00346', 37.90666264, 127.731104);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500093', '우성세차장', '강원특별자치도 춘천시 영서로 2187 (퇴계동)', '자동차 세차업', '4180000-22-2001-00329', 37.860016, 127.72985);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500094', '㈜대경유업 퇴계로주유소', '강원특별자치도 춘천시 퇴계로 231 (석사동)', '주유소 운영업', '4180000-22-2000-00313', 37.856088, 127.74419);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500095', '현대오일뱅크㈜직영 장미셀프주유소', '강원특별자치도 춘천시 영서로 2241 (퇴계동)', '주유소 운영업', '4180000-22-2000-00300', 37.90666264, 127.731104);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500096', '퇴계점현대자동차', '강원특별자치도 춘천시 우묵길52번길 26 (퇴계동)', '자동차 세차업', '4180000-22-1998-00259', 37.86403229, 127.7244324);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500097', 'SK에너지(주) (부안주유소)', '강원특별자치도 춘천시 후석로 239 (후평동)', '주유소 운영업', '4180000-22-1998-00258', 37.8728588, 127.7524279);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500098', 'SK에너지 (주)ok주유소', '강원특별자치도 춘천시 후석로 322(후평동)', '주유소 운영업', '4180000-22-1998-00201', 37.87978438, 127.7502887);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500099', '대명주유소', '강원특별자치도 춘천시 충열로 314 (우두동)', '주유소 운영업', '4180000-22-1998-00188', 37.92050812, 127.7397434);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500100', '광장셀프주유소', '강원특별자치도 춘천시 효자로 150 (효자동)', '주유소 운영업', '4180000-22-1997-00184', 37.87587247, 127.7357415);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500101', '거상대리점', '강원특별자치도 춘천시 영서로 2566(근화동)', '자동차 수리 및 세차업', '4180000-22-1997-00180', 37.8867697, 127.7171206);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500102', '에이스주유소', '강원특별자치도 춘천시 효자로 94 (효자동)', '주유소 운영업', '4180000-22-1997-00178', 37.87124125, 127.7329223);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500103', '나우자동차부분정비', '강원특별자치도 춘천시 퇴계로 58 (퇴계동)', '자동차 수리 및 세차업', '4180000-22-1997-00174', 37.86382379, 127.7272713);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500104', '춘천구도일주유소', '강원특별자치도 춘천시 춘천로 40 (퇴계동)', '주유소 운영업', '4180000-22-1997-00168', 37.86817915, 127.7234274);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500105', '부광자동차세차장', '강원특별자치도 춘천시 퇴계동 85-2', '자동차 수리 및 세차업', '4180000-22-1996-00163', 37.85041, 127.737167);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500106', '퇴계주유소', '강원특별자치도 춘천시 남산면 북한강변길 688', '주유소 운영업', '4180000-22-1996-00156', 37.83071139, 127.5779062);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500107', '현대오일뱅크(주)직영고속터미널주유소', '강원특별자치도 춘천시 경춘로 2365 (온의동)', '주유소 운영업', '4180000-22-1996-00155', 37.8648085, 127.7200897);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500108', '붕붕붕주유소', '강원특별자치도 춘천시 공지로 156-3 (석사동)', '주유소 운영업', '4180000-22-1996-00152', 37.85998152, 127.745247);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500109', '대룡산주유소', '강원특별자치도 춘천시 동내면 순환대로 660', '주유소 운영업', '4180000-22-1996-00146', 37.84097537, 127.7649277);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500110', '광성카서비스', '강원특별자치도 춘천시 공지로 362 (효자동)', '자동차 수리 및 세차업', '4180000-22-1996-00144', 37.87077241, 127.726585);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500111', '현대오일뱅크㈜직영 춘천주유소', '강원특별자치도 춘천시 춘천로 412 (후평동)', '주유소 운영업', '4180000-22-1995-00131', 37.88980509, 127.7521729);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500112', '현대오일뱅크㈜직영 춘천제일주유소', '강원특별자치도 춘천시 영서로 1923 (석사동)', '주유소 운영업', '4180000-22-1995-00130', 37.84727359, 127.7550491);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500113', '오토앤강원지역본부(카프랜드)', '강원특별자치도 춘천시 영서로 2227 (퇴계동)', '자동차 세차업', '4180000-22-1995-00120', 37.86206941, 127.7259995);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500114', '소양강주유소', '강원특별자치도 춘천시 충열로 65 (우두동)', '주유소 운영업', '4180000-22-1995-00118', 37.89989251, 127.7343797);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500115', '미래자동차정비세차', '강원특별자치도 춘천시 가연길 31 (소양로4가)', '자동차 수리 및 세차업', '4180000-22-1995-00114', 37.87902412, 127.7208555);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500116', '뉴서울카매니아', '강원특별자치도 춘천시 삭주로 164 (후평동)', '자동차 수리 및 세차업', '4180000-22-1994-00080', 37.88576053, 127.7484032);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500117', '한전종합세차장', '강원특별자치도 춘천시 서면 당숲안길 157', '자동차 세차업', '4180000-22-1994-00078', 37.84307306, 127.6064278);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500118', '화인셀프세차장', '강원특별자치도 춘천시 서부대성로 201 (효자동)', '자동차 세차업', '4180000-22-1992-00061', 37.87444813, 127.741051);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500119', '월드카프라자', '강원특별자치도 춘천시 삭주로 190 (후평동)', '자동차 수리 및 세차업', '4180000-22-1992-00058', 37.88637551, 127.7514286);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500120', '스피드메이트춘천점', '강원특별자치도 춘천시 공지로 234-1 (효자동)', '자동차 수리 및 세차업', '4180000-22-1991-00055', 37.86388733, 127.7379088);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500121', '(주)석사주유소', '강원특별자치도 춘천시 공지로 49 (석사동)', '주유소 운영업', '4180000-22-1989-00030', 37.85190395, 127.7517376);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500122', '춘천세차', '강원특별자치도 춘천시 동면 공단로 98', '자동차 세차업', '4180000-22-1981-00083', 37.89478736, 127.7496087);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500123', '새중앙차량정비세차장', '강원특별자치도 춘천시 금강로 10 (소양로3가)', '자동차 수리 및 세차업', '4180000-22-1980-00008', 37.8820281, 127.7234537);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500124', '한국타이어 충남대리점', '강원특별자치도 춘천시 소양로211번길 8-7 (소양로1가)', '자동차 세차업', '4180000-22-1977-00005', 37.89205033, 127.7251616);
INSERT INTO gas_station_washes (management_number, name, address, op_status, water_permit_number, latitude, longitude) VALUES ('202541810000500125', '강원카세차장', '강원특별자치도 춘천시 소양로 128  (소양로2가)', '자동차 세차업', '4180000-22-1976-00003', 37.88471357, 127.7239256);

-- 4. select 문
SELECT * FROM gas_station_washes;

SELECT COUNT(*)
  FROM gas_station_washes;