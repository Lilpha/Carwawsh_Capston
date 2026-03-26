-- [1] 가입 시 실행될 함수 정의
CREATE OR REPLACE FUNCTION public.handle_new_user() -- 함수 이름 정의
RETURNS trigger AS $$ -- 이 함수는 '트리거 전용'임을 선언
BEGIN
  INSERT INTO public.users (id, email, car_type) -- 우리 서비스 유저 테이블에 넣어라
  VALUES (
    new.id,    -- 'new'는 방금 가입한 유저의 정보를 담고 있는 임시 변수입니다.
    new.email, -- 가입한 유저의 ID와 이메일을 그대로 가져옵니다.
    '승용'      -- 차량 타입은 일단 기본값인 '승용'으로 넣어줍니다.
  );
  RETURN new; -- 작업을 마치고 원래 가입 절차를 마무리합니다.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- (중요!) 관리자 권한으로 실행하겠다는 뜻

-- [2] auth.users에 INSERT가 발생하면 위 함수를 실행하는 트리거 생성
CREATE OR REPLACE TRIGGER on_auth_user_created -- 트리거 이름 정의
  AFTER INSERT ON auth.users -- 'auth.users' 테이블에 데이터가 '들어온 직후'에
  FOR EACH ROW -- 가입되는 '모든 사람'마다 각각 실행해라
  EXECUTE PROCEDURE public.handle_new_user(); -- 실행할 함수는 아까 만든 그거!