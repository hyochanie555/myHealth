// 요일별 운동 루틴 데이터 정의
// 월.화.수.목.금.토.일 개별 요일 독립 루틴 지원
// 화/목 복근 배치 (월/수 복근 없음), 하체 데이에 백익스텐션 추가, 한국어 고조회수 유튜브 검색 링크 연결

// 고화질 검증된 피트니스 이미지 URL
const FITNESS_IMAGES = {
  upperWarmup: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=600&q=80",
  lowerWarmup: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80",
  backExtension: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80",
  dumbbellSideBend: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80",
  treadmillWarmup: "https://images.unsplash.com/photo-1434596922112-19c563067271?auto=format&fit=crop&w=600&q=80",
  treadmillIncline: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=600&q=80",
  stairmillCycle: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
  cooldownWalking: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80",
  foamrollerThoracic: "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&w=600&q=80",
  foamrollerLeg: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80",
  foamrollerGlute: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80",
  hipPigeonStretch: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80",
  neckShoulderStretch: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80"
};

// 유튜브 한국어 인기 영상 검색 URL 헬퍼
function makeYoutubeSearchUrl(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

// ==========================================
// 개별 운동 목록 정의
// ==========================================

// --- 월요일 : 상체 집중 (복근 없음!) ---
const EXERCISES_MON_UPPER = [
  {
    id: "mon_warmup",
    order: "웜업",
    name: "어깨 회전근개 & 동적 상체 스트레칭",
    machineId: null,
    customImage: FITNESS_IMAGES.upperWarmup,
    target: "어깨 / 흉추 / 팔꿈치 관절",
    setsReps: "5분 진행",
    restSec: 0,
    tip: "어깨 돌리기, 밴드 풀어파트, 팔 가볍게 털기로 상체 관절을 부드럽게 예열합니다.",
    youtubeQuery: "상체 스트레칭 루틴 회전근개",
    isWarmup: true
  },
  {
    id: "mon_u1",
    order: "1",
    name: "뉴텍 시티드 체스트 프레스",
    alternative: "해머 호리존탈 체스트 프레스",
    machineId: "m03",
    target: "가슴 전체 · 삼두",
    setsReps: "4세트 × 10~12회",
    restSec: 60,
    tip: "견갑골(날개뼈)을 뒤로 모아 등받이에 밀착하고 가슴을 편 채로 힘차게 밀어냅니다.",
    youtubeQuery: "체스트프레스 머신 사용법 자세"
  },
  {
    id: "mon_u2",
    order: "2",
    name: "렉스코 랫풀다운",
    alternative: "뉴텍 토쳐 프론트 풀다운",
    machineId: "m15",
    target: "광배근 (등 넓이) · 이두",
    setsReps: "4세트 × 10~12회",
    restSec: 60,
    tip: "바를 쇄골 쪽으로 당기며 가슴을 위로 열고, 팔꿈치를 옆구리 쪽으로 깊게 찍어 누릅니다.",
    youtubeQuery: "랫풀다운 초보자 자세 광배근"
  },
  {
    id: "mon_u3",
    order: "3",
    name: "뉴텍 펙덱플라이 (핀머신)",
    alternative: "뉴텍 펙덱플라이 (플레이트)",
    machineId: "m05",
    target: "가슴 안쪽 모으기 · 흉근 볼륨",
    setsReps: "3세트 × 12~15회",
    restSec: 45,
    tip: "팔꿈치 각도를 살짝 굽혀 고정하고, 큰 통나무를 안는다는 느낌으로 가슴 중앙을 모아줍니다.",
    youtubeQuery: "펙덱플라이 가슴운동 자세 팁"
  },
  {
    id: "mon_u4",
    order: "4",
    name: "뉴텍 시티드로우 (핀머신)",
    alternative: "해머 디와이 로우 / 롱풀",
    machineId: "m19",
    target: "등 중앙 (능형근/중부승모근) · 광배근",
    setsReps: "4세트 × 10~12회",
    restSec: 60,
    tip: "가슴 패드에 상체를 붙이고 팔꿈치가 몸통을 스치며 뒤로 당겨 등 가운데를 꽉 접어줍니다.",
    youtubeQuery: "시티드로우 핀머신 등운동 사용법"
  },
  {
    id: "mon_u5",
    order: "5",
    name: "뉴텍 숄더프레스 (핀머신)",
    alternative: "뉴텍 숄더프레스 (플레이트)",
    machineId: "m09",
    target: "어깨 전면/측면 · 삼두",
    setsReps: "3세트 × 10~12회",
    restSec: 60,
    tip: "손잡이가 귀나 턱 높이에서 시작하도록 시트를 맞추고 머리 위로 수직으로 밀어 올립니다.",
    youtubeQuery: "머신 숄더프레스 자세 어깨운동"
  },
  {
    id: "mon_u6",
    order: "6",
    name: "뉴텍 사이드 레터럴 레이즈 (핀머신)",
    alternative: "덤벨 사이드 래터럴 레이즈",
    machineId: "m08",
    target: "어깨 옆면 (측면 삼각근 / 어깨뽕)",
    setsReps: "3세트 × 15회",
    restSec: 45,
    tip: "승모근을 쓰지 않도록 어깨를 누르고, 팔꿈치로 물을 붓듯이 양옆으로 멀리 밀어냅니다.",
    youtubeQuery: "사이드 레터럴 레이즈 머신 사용법"
  },
  {
    id: "mon_u7",
    order: "7",
    name: "뉴텍 시티드 딥 (핀머신)",
    alternative: "케이블 푸시다운",
    machineId: "m07",
    target: "팔 삼두 (팔 뒤쪽) & 아랫가슴",
    setsReps: "3세트 × 12회",
    restSec: 45,
    tip: "어깨가 솟지 않도록 누른 상태에서 손잡이를 아래로 강하게 밀어내며 팔 뒤쪽을 짭니다.",
    youtubeQuery: "시티드 딥스 머신 삼두운동"
  },
  {
    id: "mon_u8",
    order: "8",
    name: "뉴텍 암컬 (핀머신)",
    alternative: "이지바 바벨컬",
    machineId: "m33",
    target: "팔 앞쪽 (상완이두근)",
    setsReps: "3세트 × 12회",
    restSec: 45,
    tip: "팔꿈치를 패드에 밀착하고 반동 없이 이두근의 힘으로만 접어 올려 쥐어짭니다.",
    youtubeQuery: "암컬 머신 이두운동 자세"
  }
];

// --- 화요일 : 하체 & 힙 + 백익스텐션 + 복근 (화/목 복근 반영!) ---
const EXERCISES_TUE_LOWER = [
  {
    id: "tue_warmup",
    order: "웜업",
    name: "고관절 스트레칭 & 맨몸 스쿼트",
    machineId: null,
    customImage: FITNESS_IMAGES.lowerWarmup,
    target: "고관절 / 무릎 관절 예열",
    setsReps: "5분 진행",
    restSec: 0,
    tip: "고관절 회전과 깊은 맨몸 스쿼트로 관절 가동성을 확보하고 부상을 방지합니다.",
    youtubeQuery: "고관절 스트레칭 골반 가동성",
    isWarmup: true
  },
  {
    id: "tue_l1",
    order: "1",
    name: "뉴텍 레그 익스텐션",
    alternative: "",
    machineId: "m23",
    target: "허벅지 앞 (선피로/웜업)",
    setsReps: "3세트 × 15회",
    restSec: 60,
    tip: "무릎 관절 부담을 줄이며 허벅지 앞쪽 자극을 깨우기. 올릴 때 1초 정지 후 천천히 이완.",
    youtubeQuery: "레그익스텐션 무릎 안아프게 자세"
  },
  {
    id: "tue_l2",
    order: "2",
    name: "뉴텍 레그 프레스 (or 시티드 레그 프레스)",
    alternative: "뉴텍 시티드 레그프레스",
    machineId: "m31",
    target: "하체 전반 (고중량 메인)",
    setsReps: "4세트 × 10~12회",
    restSec: 90,
    tip: "엉덩이를 시트에 밀착하고 발판 중간에 발을 두고 힘차게 밀기. 무릎을 완전히 펴지 않기.",
    youtubeQuery: "레그프레스 발위치 무릎 자극"
  },
  {
    id: "tue_l3",
    order: "3",
    name: "프리모션 브이스쿼트 (or 뉴텍 V-스쿼트)",
    alternative: "뉴텍 브이스쿼트",
    machineId: "m30",
    target: "허벅지 전체 & 둔근",
    setsReps: "4세트 × 10~12회",
    restSec: 90,
    tip: "발을 살짝 앞에 두고 엉덩이를 뒤로 깊게 앉기. 뒤꿈치로 발판을 밀며 일어나기.",
    youtubeQuery: "브이스쿼트 머신 자세 둔근"
  },
  {
    id: "tue_l4",
    order: "4",
    name: "뉴텍 라잉 레그 컬",
    alternative: "",
    machineId: "m24",
    target: "허벅지 뒤 (햄스트링)",
    setsReps: "4세트 × 12회",
    restSec: 60,
    tip: "반동 없이 발뒤꿈치를 엉덩이 쪽으로 접고 천천히 이완. 골반이 패드에서 뜨지 않게 주의.",
    youtubeQuery: "라잉 레그컬 햄스트링 자극 팁"
  },
  {
    id: "tue_l5",
    order: "5",
    name: "뉴텍 힙 어덕션 / 어브덕션 (or 링크 아웃타이)",
    alternative: "렉스코 링크 아웃타이",
    machineId: "m26",
    target: "안쪽 허벅지 & 엉덩이 바깥 (중둔근)",
    setsReps: "각 3세트 × 15회",
    restSec: 45,
    tip: "모으기(내전근) + 벌리기(중둔근) 연속 진행. 상체를 살짝 앞으로 숙여 엉덩이 집중.",
    youtubeQuery: "힙어덕션 힙어브덕션 머신 사용법"
  },
  {
    id: "tue_l6",
    order: "6",
    name: "뉴텍 힙 쓰러스트 (or 부티 힙 쓰러스트)",
    alternative: "부티빌더 힙쓰러스트",
    machineId: "m25",
    target: "둔근 & 허리(기립근) 강력 강화",
    setsReps: "3세트 × 12~15회",
    restSec: 60,
    tip: "허리만 꺾지 말고 골반을 밀어 올리며 엉덩이 쥐어짜기! 정점에서 1~2초 정지.",
    youtubeQuery: "힙쓰러스트 머신 엉덩이 자극"
  },
  {
    id: "tue_l7",
    order: "7",
    name: "백익스텐션 (허리 기립근 & 둔근)",
    alternative: "45도 하이퍼 익스텐션",
    machineId: null,
    customImage: FITNESS_IMAGES.backExtension,
    target: "척추기립근 (허리 코어) & 둔근/햄스트링",
    setsReps: "3세트 × 15회",
    restSec: 45,
    tip: "패드를 골반 바로 아래 맞추고, 허리를 과도하게 젖히지 말고 몸이 일직선이 될 때까지만 기립근과 둔근 힘으로 수축합니다.",
    youtubeQuery: "백익스텐션 허리 기립근 엉덩이 자세"
  },
  {
    id: "tue_l8",
    order: "8",
    name: "풀업 머신 행잉 니 레이즈 (딥스 팔걸이 활용)",
    alternative: "매트 레그레이즈",
    machineId: "m11",
    target: "하복부 (아랫배)",
    setsReps: "3세트 × 15회",
    restSec: 45,
    tip: "무릎을 90도로 접어 배꼽/가슴 쪽으로 골반 말아 올리기. 반동 주지 않기.",
    youtubeQuery: "행잉 니레이즈 복근운동 팁"
  },
  {
    id: "tue_l9",
    order: "9",
    name: "원암 덤벨 사이드 벤드 (덤벨존 활용)",
    alternative: "",
    machineId: null,
    customImage: FITNESS_IMAGES.dumbbellSideBend,
    target: "옆구리 (외복사근)",
    setsReps: "좌/우 각 3세트 × 15회",
    restSec: 45,
    tip: "반드시 한 손에만 덤벨 들기(5~8kg), 반대쪽 옆구리 수축. 골반은 정면에 고정.",
    youtubeQuery: "덤벨 사이드벤드 외복사근 옆구리"
  }
];

// --- 수요일 : 유산소 버닝 (50분) (복근 없음!) ---
const EXERCISES_WED_CARDIO = [
  {
    id: "wed_c_warmup",
    order: "웜업",
    name: "가벼운 걷기 & 전신 관절 풀기",
    machineId: null,
    customImage: FITNESS_IMAGES.treadmillWarmup,
    target: "심박수 서서히 상승",
    setsReps: "5분 진행",
    restSec: 0,
    tip: "러닝머신 속도 4.0~5.0으로 가볍게 걸으며 몸을 덥힙니다.",
    youtubeQuery: "러닝머신 워밍업 올바른 걷기",
    isWarmup: true
  },
  {
    id: "wed_c1",
    order: "1",
    name: "트레드밀 인클라인 경사 걷기 (or 인터벌 러닝)",
    alternative: "야외 조깅",
    machineId: null,
    customImage: FITNESS_IMAGES.treadmillIncline,
    target: "하체 심폐 & 둔근 체지방 연소",
    setsReps: "25분 지속 (경사도 6~10%, 속도 4.5~5.5)",
    restSec: 60,
    tip: "손잡이를 잡지 않고 팔을 흔들며 엉덩이와 종아리 뒤쪽 텐션을 느끼며 걷습니다.",
    youtubeQuery: "인클라인 트레드밀 다이어트 효과"
  },
  {
    id: "wed_c2",
    order: "2",
    name: "스텝밀 (천국의 계단) or 실내 사이클",
    alternative: "사이클 페달링",
    machineId: null,
    customImage: FITNESS_IMAGES.stairmillCycle,
    target: "심폐 극대화 & 하체 라인",
    setsReps: "15분 집중 (속도 레벨 5~7)",
    restSec: 60,
    tip: "발바닥 전체로 계단을 딛고 허리를 편 채 엉덩이 힘으로 한 발 한 발 밀어 올립니다.",
    youtubeQuery: "천국의계단 스텝밀 타는법 칼로리"
  },
  {
    id: "wed_c3",
    order: "3",
    name: "쿨다운 워킹 & 심박수 안정화",
    machineId: null,
    customImage: FITNESS_IMAGES.cooldownWalking,
    target: "피로물질 젖산 배출",
    setsReps: "5분 진행",
    restSec: 0,
    tip: "속도를 3.5 이하로 서서히 낮추고 깊은 호흡을 하며 심박수를 안정시 수준으로 되돌립니다.",
    youtubeQuery: "유산소 쿨다운 스트레칭"
  }
];

// --- 목요일 : 상체 & 복근 데이 (화/목 복근 반영!) ---
const EXERCISES_THU_UPPER = [
  {
    id: "thu_warmup",
    order: "웜업",
    name: "어깨 회전근개 & 동적 상체 스트레칭",
    machineId: null,
    customImage: FITNESS_IMAGES.upperWarmup,
    target: "어깨 / 흉추 / 팔꿈치 관절",
    setsReps: "5분 진행",
    restSec: 0,
    tip: "어깨 돌리기, 밴드 풀어파트, 팔 가볍게 털기로 상체 관절을 부드럽게 예열합니다.",
    youtubeQuery: "상체 스트레칭 루틴 회전근개",
    isWarmup: true
  },
  {
    id: "thu_u1",
    order: "1",
    name: "뉴텍 시티드 체스트 프레스",
    alternative: "해머 호리존탈 체스트 프레스",
    machineId: "m03",
    target: "가슴 전체 · 삼두",
    setsReps: "4세트 × 10~12회",
    restSec: 60,
    tip: "견갑골(날개뼈)을 뒤로 모아 등받이에 밀착하고 가슴을 편 채로 힘차게 밀어냅니다.",
    youtubeQuery: "체스트프레스 머신 사용법 자세"
  },
  {
    id: "thu_u2",
    order: "2",
    name: "렉스코 랫풀다운",
    alternative: "뉴텍 토쳐 프론트 풀다운",
    machineId: "m15",
    target: "광배근 (등 넓이) · 이두",
    setsReps: "4세트 × 10~12회",
    restSec: 60,
    tip: "바를 쇄골 쪽으로 당기며 가슴을 위로 열고, 팔꿈치를 옆구리 쪽으로 깊게 찍어 누릅니다.",
    youtubeQuery: "랫풀다운 초보자 자세 광배근"
  },
  {
    id: "thu_u3",
    order: "3",
    name: "뉴텍 펙덱플라이 (핀머신)",
    alternative: "뉴텍 펙덱플라이 (플레이트)",
    machineId: "m05",
    target: "가슴 안쪽 모으기 · 흉근 볼륨",
    setsReps: "3세트 × 12~15회",
    restSec: 45,
    tip: "팔꿈치 각도를 살짝 굽혀 고정하고, 큰 통나무를 안는다는 느낌으로 가슴 중앙을 모아줍니다.",
    youtubeQuery: "펙덱플라이 가슴운동 자세 팁"
  },
  {
    id: "thu_u4",
    order: "4",
    name: "뉴텍 시티드로우 (핀머신)",
    alternative: "해머 디와이 로우 / 롱풀",
    machineId: "m19",
    target: "등 중앙 (능형근/중부승모근) · 광배근",
    setsReps: "4세트 × 10~12회",
    restSec: 60,
    tip: "가슴 패드에 상체를 붙이고 팔꿈치가 몸통을 스치며 뒤로 당겨 등 가운데를 꽉 접어줍니다.",
    youtubeQuery: "시티드로우 핀머신 등운동 사용법"
  },
  {
    id: "thu_u5",
    order: "5",
    name: "뉴텍 숄더프레스 (핀머신)",
    alternative: "뉴텍 숄더프레스 (플레이트)",
    machineId: "m09",
    target: "어깨 전면/측면 · 삼두",
    setsReps: "3세트 × 10~12회",
    restSec: 60,
    tip: "손잡이가 귀나 턱 높이에서 시작하도록 시트를 맞추고 머리 위로 수직으로 밀어 올립니다.",
    youtubeQuery: "머신 숄더프레스 자세 어깨운동"
  },
  {
    id: "thu_u6",
    order: "6",
    name: "뉴텍 사이드 레터럴 레이즈 (핀머신)",
    alternative: "덤벨 사이드 래터럴 레이즈",
    machineId: "m08",
    target: "어깨 옆면 (측면 삼각근 / 어깨뽕)",
    setsReps: "3세트 × 15회",
    restSec: 45,
    tip: "승모근을 쓰지 않도록 어깨를 누르고, 팔꿈치로 물을 붓듯이 양옆으로 멀리 밀어냅니다.",
    youtubeQuery: "사이드 레터럴 레이즈 머신 사용법"
  },
  {
    id: "thu_u7",
    order: "7",
    name: "뉴텍 시티드 딥 (핀머신)",
    alternative: "뉴텍 암컬 (핀머신)",
    machineId: "m07",
    target: "팔 삼두 (팔 뒤쪽) & 아랫가슴",
    setsReps: "3세트 × 12회",
    restSec: 45,
    tip: "어깨가 솟지 않도록 누른 상태에서 손잡이를 아래로 강하게 밀어내며 팔 뒤쪽을 짭니다.",
    youtubeQuery: "시티드 딥스 머신 삼두운동"
  },
  {
    id: "thu_u8",
    order: "8",
    name: "풀업 머신 행잉 니 레이즈 (딥스 패드 활용)",
    alternative: "매트 크런치 / 플랭크",
    machineId: "m11",
    target: "하복부 (아랫배 코어)",
    setsReps: "3세트 × 15회",
    restSec: 45,
    tip: "팔꿈치 패드에 체중을 싣고 골반을 가슴 쪽으로 둥글게 말아 올리며 아랫배를 쥐어짭니다.",
    youtubeQuery: "행잉 니레이즈 복근운동 팁"
  }
];

// --- 금요일 : 하체 & 힙 + 백익스텐션 ---
const EXERCISES_FRI_LOWER = [
  {
    id: "fri_warmup",
    order: "웜업",
    name: "고관절 스트레칭 & 맨몸 스쿼트",
    machineId: null,
    customImage: FITNESS_IMAGES.lowerWarmup,
    target: "고관절 / 무릎 관절 예열",
    setsReps: "5분 진행",
    restSec: 0,
    tip: "고관절 회전과 깊은 맨몸 스쿼트로 관절 가동성을 확보하고 부상을 방지합니다.",
    youtubeQuery: "고관절 스트레칭 골반 가동성",
    isWarmup: true
  },
  {
    id: "fri_l1",
    order: "1",
    name: "뉴텍 레그 익스텐션",
    alternative: "",
    machineId: "m23",
    target: "허벅지 앞 (선피로/웜업)",
    setsReps: "3세트 × 15회",
    restSec: 60,
    tip: "무릎 관절 부담을 줄이며 허벅지 앞쪽 자극을 깨우기. 올릴 때 1초 정지 후 천천히 이완.",
    youtubeQuery: "레그익스텐션 무릎 안아프게 자세"
  },
  {
    id: "fri_l2",
    order: "2",
    name: "뉴텍 레그 프레스 (or 시티드 레그 프레스)",
    alternative: "뉴텍 시티드 레그프레스",
    machineId: "m31",
    target: "하체 전반 (고중량 메인)",
    setsReps: "4세트 × 10~12회",
    restSec: 90,
    tip: "엉덩이를 시트에 밀착하고 발판 중간에 발을 두고 힘차게 밀기. 무릎을 완전히 펴지 않기.",
    youtubeQuery: "레그프레스 발위치 무릎 자극"
  },
  {
    id: "fri_l3",
    order: "3",
    name: "프리모션 브이스쿼트 (or 뉴텍 V-스쿼트)",
    alternative: "뉴텍 브이스쿼트",
    machineId: "m30",
    target: "허벅지 전체 & 둔근",
    setsReps: "4세트 × 10~12회",
    restSec: 90,
    tip: "발을 살짝 앞에 두고 엉덩이를 뒤로 깊게 앉기. 뒤꿈치로 발판을 밀며 일어나기.",
    youtubeQuery: "브이스쿼트 머신 자세 둔근"
  },
  {
    id: "fri_l4",
    order: "4",
    name: "뉴텍 라잉 레그 컬",
    alternative: "",
    machineId: "m24",
    target: "허벅지 뒤 (햄스트링)",
    setsReps: "4세트 × 12회",
    restSec: 60,
    tip: "반동 없이 발뒤꿈치를 엉덩이 쪽으로 접고 천천히 이완. 골반이 패드에서 뜨지 않게 주의.",
    youtubeQuery: "라잉 레그컬 햄스트링 자극 팁"
  },
  {
    id: "fri_l5",
    order: "5",
    name: "뉴텍 힙 어덕션 / 어브덕션 (or 링크 아웃타이)",
    alternative: "렉스코 링크 아웃타이",
    machineId: "m26",
    target: "안쪽 허벅지 & 엉덩이 바깥 (중둔근)",
    setsReps: "각 3세트 × 15회",
    restSec: 45,
    tip: "모으기(내전근) + 벌리기(중둔근) 연속 진행. 상체를 살짝 앞으로 숙여 엉덩이 집중.",
    youtubeQuery: "힙어덕션 힙어브덕션 머신 사용법"
  },
  {
    id: "fri_l6",
    order: "6",
    name: "뉴텍 힙 쓰러스트 (or 부티 힙 쓰러스트)",
    alternative: "부티빌더 힙쓰러스트",
    machineId: "m25",
    target: "둔근 & 허리(기립근) 강력 강화",
    setsReps: "3세트 × 12~15회",
    restSec: 60,
    tip: "허리만 꺾지 말고 골반을 밀어 올리며 엉덩이 쥐어짜기! 정점에서 1~2초 정지.",
    youtubeQuery: "힙쓰러스트 머신 엉덩이 자극"
  },
  {
    id: "fri_l7",
    order: "7",
    name: "백익스텐션 (허리 기립근 & 둔근)",
    alternative: "45도 하이퍼 익스텐션",
    machineId: null,
    customImage: FITNESS_IMAGES.backExtension,
    target: "척추기립근 (허리 코어) & 둔근/햄스트링",
    setsReps: "3세트 × 15회",
    restSec: 45,
    tip: "패드를 골반 바로 아래 맞추고, 허리를 과도하게 젖히지 말고 몸이 일직선이 될 때까지만 기립근과 둔근 힘으로 수축합니다.",
    youtubeQuery: "백익스텐션 허리 기립근 엉덩이 자세"
  }
];

// --- 토요일 : 유산소 버닝 (50분) ---
const EXERCISES_SAT_CARDIO = EXERCISES_WED_CARDIO;

// --- 일요일 : 스트레칭 & 폼롤러 회복 ---
const EXERCISES_SUN_RECOVERY = [
  {
    id: "sun_r1",
    order: "1",
    name: "폼롤러 등 & 흉추 모빌리티 롤링",
    machineId: null,
    customImage: FITNESS_IMAGES.foamrollerThoracic,
    target: "흉추 가동성 & 등 뭉침 해소",
    setsReps: "5분 진행",
    restSec: 30,
    tip: "폼롤러를 날개뼈 아래에 두고 깍지 낀 손으로 머리를 받친 뒤 위아래로 천천히 롤링합니다.",
    youtubeQuery: "폼롤러 등 흉추 스트레칭"
  },
  {
    id: "sun_r2",
    order: "2",
    name: "폼롤러 허벅지 앞/옆(장경인대) 이완",
    machineId: null,
    customImage: FITNESS_IMAGES.foamrollerLeg,
    target: "하체 근육 뭉침 & 무릎 통증 예방",
    setsReps: "좌/우 각 3분",
    restSec: 30,
    tip: "체중을 실어 허벅지 앞쪽과 바깥쪽을 지긋이 굴려줍니다. 아픈 부위에서 10초간 정지.",
    youtubeQuery: "폼롤러 허벅지 앞쪽 장경인대 풀기"
  },
  {
    id: "sun_r3",
    order: "3",
    name: "폼롤러 둔근(이상근) & 햄스트링 마사지",
    machineId: null,
    customImage: FITNESS_IMAGES.foamrollerGlute,
    target: "엉덩이 심부 근육 & 허리 부담 완화",
    setsReps: "좌/우 각 3분",
    restSec: 30,
    tip: "폼롤러 위에 한쪽 엉덩이를 얹고 다리를 4자로 꼬아 깊숙한 엉덩이 근육을 풀어줍니다.",
    youtubeQuery: "폼롤러 엉덩이 이상근 풀기"
  },
  {
    id: "sun_r4",
    order: "4",
    name: "고관절 비둘기 자세 & 장요근 런지 스트레칭",
    machineId: null,
    customImage: FITNESS_IMAGES.hipPigeonStretch,
    target: "골반 정렬 & 고관절 굴곡근 유연성",
    setsReps: "좌/우 각 2회 × 40초 유지",
    restSec: 30,
    tip: "골반이 틀어지지 않게 수평을 유지하고 숨을 내쉬며 골반을 바닥 쪽으로 부드럽게 낮춥니다.",
    youtubeQuery: "비둘기자세 스트레칭 골반교정"
  },
  {
    id: "sun_r5",
    order: "5",
    name: "목/어깨 승모근 & 가슴 전면 이완 스트레칭",
    machineId: null,
    customImage: FITNESS_IMAGES.neckShoulderStretch,
    target: "라운드숄더 교정 & 거북목 완화",
    setsReps: "5분 진행",
    restSec: 0,
    tip: "벽 모서리에 팔을 대고 가슴 앞쪽을 열어주고, 목을 좌우앞뒤로 부드럽게 당겨 늘립니다.",
    youtubeQuery: "목 어깨 승모근 스트레칭 거북목"
  }
];

// 월.화.수.목.금.토.일 각 요일별 개별 루틴 맵
const WEEKLY_ROUTINES = {
  // 월요일 : 상체 (복근 없음)
  mon: {
    id: "mon",
    dayName: "월요일",
    dayShort: "월",
    dayNumber: 1,
    type: "upper",
    title: "월요일 : 상체 집중 데이",
    subtitle: "가슴 · 등 · 어깨 · 팔 완성 루틴 (복근 없음)",
    estimatedTime: "약 50분",
    exercises: EXERCISES_MON_UPPER
  },
  // 화요일 : 하체 + 백익스텐션 + 복근
  tue: {
    id: "tue",
    dayName: "화요일",
    dayShort: "화",
    dayNumber: 2,
    type: "lower",
    title: "화요일 : 하체 & 힙 + 코어/복근 데이",
    subtitle: "허벅지 · 둔근 · 햄스트링 · 백익스텐션 · 복근 정복",
    estimatedTime: "약 65분",
    exercises: EXERCISES_TUE_LOWER
  },
  // 수요일 : 유산소 (복근 없음)
  wed: {
    id: "wed",
    dayName: "수요일",
    dayShort: "수",
    dayNumber: 3,
    type: "cardio",
    title: "수요일 : 유산소 버닝 데이 (50분)",
    subtitle: "체지방 연소 & 심폐 지구력 집중 (복근 없음)",
    estimatedTime: "50분",
    exercises: EXERCISES_WED_CARDIO
  },
  // 목요일 : 상체 + 복근
  thu: {
    id: "thu",
    dayName: "목요일",
    dayShort: "목",
    dayNumber: 4,
    type: "upper",
    title: "목요일 : 상체 & 복근 집중 데이",
    subtitle: "가슴 · 등 · 어깨 · 팔 · 하복부 완성 루틴",
    estimatedTime: "약 55분",
    exercises: EXERCISES_THU_UPPER
  },
  // 금요일 : 하체 + 백익스텐션
  fri: {
    id: "fri",
    dayName: "금요일",
    dayShort: "금",
    dayNumber: 5,
    type: "lower",
    title: "금요일 : 하체 & 힙 집중 데이",
    subtitle: "허벅지 · 둔근 · 햄스트링 · 백익스텐션 강화",
    estimatedTime: "약 60분",
    exercises: EXERCISES_FRI_LOWER
  },
  // 토요일 : 유산소
  sat: {
    id: "sat",
    dayName: "토요일",
    dayShort: "토",
    dayNumber: 6,
    type: "cardio",
    title: "토요일 : 유산소 버닝 데이 (50분)",
    subtitle: "체지방 연소 & 심폐 지구력 강화 코스",
    estimatedTime: "50분",
    exercises: EXERCISES_SAT_CARDIO
  },
  // 일요일 : 스트레칭
  sun: {
    id: "sun",
    dayName: "일요일",
    dayShort: "일",
    dayNumber: 0,
    type: "recovery",
    title: "일요일 : 스트레칭 & 폼롤러 회복 데이",
    subtitle: "전신 근육 이완 · 가동성 회복 · 다음 주 컨디셔닝",
    estimatedTime: "약 30분",
    exercises: EXERCISES_SUN_RECOVERY
  }
};

// 요일 숫자를 요일 키로 변환
function getRoutineKeyForDay(dayNumber) {
  const map = {
    0: "sun",
    1: "mon",
    2: "tue",
    3: "wed",
    4: "thu",
    5: "fri",
    6: "sat"
  };
  return map[dayNumber] || "mon";
}
