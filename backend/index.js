const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors()); 
app.use(express.json()); 

// 1. PostgreSQL 연결 설정 (태영님의 환경에 맞게 수정하세요)
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres', // DataGrip에서 확인한 DB 이름
  password: '1234',     // 본인의 DB 비밀번호
  port: 5432,
});

// 2. 회원가입 데이터 매핑 API
app.post('/api/users', async (req, res) => {
  // 앱에서 보낸 4가지 핵심 데이터를 받습니다.
  const { uid, email, carNumber, carType } = req.body; 

  console.log('데이터 수신:', { uid, email, carNumber, carType });

  try {
    // users 테이블에 차종(car_type)까지 포함하여 저장합니다.
    const query = 'INSERT INTO users (uid, email, car_number, car_type) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [uid, email, carNumber, carType || '승용']; 
    
    const result = await pool.query(query, values);

    console.log('✅ DB 저장 성공:', result.rows[0]);
    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('❌ DB 저장 에러:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버 가동 중: http://localhost:${PORT}`);
});

// [Step 3] 모든 세차장 목록을 가져오는 API
app.get('/api/washes', async (req, res) => {
  try {
    const query = 'SELECT * FROM gas_station_washes ORDER BY id ASC';
    const { rows } = await pool.query(query);
    
    // 좌표 데이터를 숫자로 변환 (DB에서 문자열로 넘어올 수 있음)
    const washes = rows.map(row => ({
      ...row,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude)
    }));

    console.log(`✅ ${washes.length}개의 세차장 데이터를 전송했습니다.`);
    res.json(washes);
  } catch (err) {
    console.error('❌ API 에러:', err);
    res.status(500).json({ error: '데이터 로딩 실패' });
  }
});