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
  hangingLegRaise: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=600&q=80",
  smithSquat: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80",
  deadlift: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
  neckShoulderStretch: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80"
};

// 유튜브 한국어 인기 영상 검색 URL 헬퍼
function makeYoutubeSearchUrl(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

// ==========================================
// 개별 운동 목록 정의
// ==========================================

// // --- 월요일 : 상체 A (체스트 & 풀업 중심 / 총 19세트) ---
const EXERCISES_MON_UPPER = [
  {
    id: "mon_warmup",
    order: "웜업",
    name: "어깨 회전근개 & 동적 상체 스트레칭",
    machineId: null,
    customImage: FITNESS_IMAGES.upperWarmup,
    target: "어깨 / 흉추 / 팔꿈치 관절 예열",
    setsReps: "5분 진행",
    restSec: 0,
    tip: "어깨 돌리기, 밴드 풀어파트, 팔 가볍게 털기로 상체 관절을 부드럽게 예열합니다.",
    youtubeQuery: "상체 스트레칭 루틴 회전근개",
    isWarmup: true
  },
  {
    id: "mon_u1",
    order: "1",
    name: "뉴텍 풀업 어시스트",
    alternative: "랫풀다운 / 친업",
    machineId: "m11",
    target: "등 너비 (광배근)",
    setsReps: "4세트 × 8~10회",
    restSec: 90,
    targetRpe: "8.5",
    isMain: true,
    categoryRole: "메인 다관절",
    isAssistedPullup: true,
    isBodyweight: false,
    tip: "핀 보조무게를 꽂으면 (체중 78kg - 핀 무게)만큼 당기게 됩니다. 가슴을 하늘로 열며 쇄골이 바에 닿듯이 등 전체로 당깁니다.",
    youtubeQuery: "어시스트 풀업 머신 사용법 자세"
  },
  {
    id: "mon_u2",
    order: "2",
    name: "뉴텍 시티드 체스트 프레스",
    alternative: "해머 호리존탈 체스트 프레스",
    machineId: "m03",
    target: "가슴 전체 (대흉근)",
    setsReps: "4세트 × 8~10회",
    restSec: 90,
    targetRpe: "8.5",
    isMain: true,
    categoryRole: "메인 다관절",
    tip: "견갑골(날개뼈)을 뒤로 모아 등받이에 밀착하고 가슴을 편 채로 힘차게 밀어냅니다.",
    youtubeQuery: "체스트프레스 머신 사용법 자세"
  },
  {
    id: "mon_u3",
    order: "3",
    name: "뉴텍 시티드로우 (핀머신)",
    alternative: "해머 디와이 로우 / 롱풀",
    machineId: "m19",
    target: "등 두께 (능형근/중부승모)",
    setsReps: "4세트 × 10~12회",
    restSec: 60,
    targetRpe: "8.0",
    categoryRole: "보조 다관절",
    tip: "가슴 패드에 상체를 붙이고 팔꿈치가 몸통을 스치며 뒤로 당겨 등 가운데를 꽉 접어줍니다.",
    youtubeQuery: "시티드로우 핀머신 등운동 사용법"
  },
  {
    id: "mon_u4",
    order: "4",
    name: "해머 시티드 인클라인 체스트 프레스",
    alternative: "뉴텍 인클라인 체스트 프레스",
    machineId: "m02",
    target: "윗가슴 (쇄골지)",
    setsReps: "3세트 × 10~12회",
    restSec: 60,
    targetRpe: "8.0",
    categoryRole: "보조 다관절",
    tip: "손잡이 위치가 쇄골 아랫부분에 맞춰지도록 의자를 조절하고, 대각선 위쪽 방향으로 가슴 상부 긴장을 느끼며 밀어 올립니다.",
    youtubeQuery: "인클라인 체스트프레스 머신 자세"
  },
  {
    id: "mon_u5",
    order: "5",
    name: "뉴텍 사이드 레터럴 레이즈 (핀머신)",
    alternative: "덤벨 사이드 래터럴 레이즈",
    machineId: "m08",
    target: "측면 삼각근 (어깨 볼륨)",
    setsReps: "4세트 × 12~15회",
    restSec: 45,
    targetRpe: "9.0",
    categoryRole: "단일관절 고립",
    tip: "승모근을 쓰지 않도록 어깨를 누르고, 팔꿈치로 물을 붓듯이 양옆으로 멀리 밀어냅니다.",
    youtubeQuery: "사이드 레터럴 레이즈 머신 사용법"
  },
  {
    id: "mon_u6",
    order: "6",
    name: "뉴텍 암컬 (핀머신)",
    alternative: "이지바 바벨컬",
    machineId: "m33",
    target: "팔 앞쪽 (상완이두근)",
    setsReps: "3세트 × 12회",
    restSec: 45,
    targetRpe: "8.5",
    categoryRole: "단일관절 고립",
    tip: "팔꿈치를 패드에 밀착하고 반동 없이 이두근의 힘으로만 접어 올려 쥐어짭니다.",
    youtubeQuery: "암컬 머신 이두운동 자세"
  }
];

// --- 화요일 : 하체 A (대퇴사두 & 스쿼트 중심 / 총 17세트) ---
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
    target: "대퇴사두 (무릎 웜업 및 선피로)",
    setsReps: "3세트 × 15회",
    restSec: 60,
    targetRpe: "7.5",
    categoryRole: "선피로 & 웜업",
    tip: "무릎 관절 부담을 줄이며 허벅지 앞쪽 자극을 깨우기. 올릴 때 1초 정지 후 천천히 이완.",
    youtubeQuery: "레그익스텐션 무릎 안아프게 자세"
  },
  {
    id: "tue_l2",
    order: "2",
    name: "바벨스쿼트 (스미스 머신)",
    alternative: "프리모션 브이스쿼트",
    machineId: "m30",
    customImage: FITNESS_IMAGES.smithSquat,
    target: "대퇴사두 & 둔근 메인",
    setsReps: "4세트 × 8~10회",
    restSec: 90,
    targetRpe: "8.5",
    isMain: true,
    categoryRole: "메인 다관절",
    tip: "발을 바벨보다 반 보 정도 앞에 두고 허리를 곧게 펴며 깊게 앉습니다. 뒤꿈치로 발판을 밀며 일어섭니다.",
    youtubeQuery: "스미스머신 스쿼트 자세 발위치"
  },
  {
    id: "tue_l3",
    order: "3",
    name: "뉴텍 레그 프레스 (or 시티드 레그 프레스)",
    alternative: "렉스코 파워 레그 프레스",
    machineId: "m31",
    target: "대퇴사두 고립 부하 (하체 볼륨)",
    setsReps: "4세트 × 10~12회",
    restSec: 90,
    targetRpe: "8.5",
    categoryRole: "보조 다관절",
    tip: "엉덩이를 시트에 밀착하고 발판 중간에 발을 두고 힘차게 밀기. 무릎을 완전히 펴서 잠그지 마세요.",
    youtubeQuery: "레그프레스 발위치 무릎 자극"
  },
  {
    id: "tue_l4",
    order: "4",
    name: "뉴텍 라잉 레그 컬",
    alternative: "",
    machineId: "m24",
    target: "햄스트링 (길항근 밸런스)",
    setsReps: "3세트 × 12~15회",
    restSec: 60,
    targetRpe: "8.0",
    categoryRole: "단일관절 고립",
    tip: "반동 없이 발뒤꿈치를 엉덩이 쪽으로 접고 천천히 이완. 골반이 패드에서 뜨지 않게 주의.",
    youtubeQuery: "라잉 레그컬 햄스트링 자극 팁"
  },
  {
    id: "tue_l5",
    order: "5",
    name: "뉴텍 힙 어브덕션 (엉덩이 바깥쪽 벌리는)",
    alternative: "렉스코 링크 아웃타이",
    machineId: "m26",
    target: "둔근 바깥쪽 & 골반 안정 (중둔근)",
    setsReps: "3세트 × 15회",
    restSec: 45,
    targetRpe: "8.5",
    categoryRole: "단일관절 고립",
    tip: "상체를 살짝 앞으로 숙여 엉덩이 바깥쪽 자극을 느끼며 패드를 힘차게 벌립니다.",
    youtubeQuery: "힙어브덕션 머신 아웃타이 중둔근 자세"
  },
  {
    id: "tue_l6",
    order: "6",
    name: "행잉 레그 레이즈 (서서 다리 올리기)",
    alternative: "행잉 니 레이즈 / 캡틴스 체어",
    machineId: null,
    customImage: FITNESS_IMAGES.hangingLegRaise,
    target: "하복직근 (아랫배 강력 코어)",
    setsReps: "3세트 × 12~15회",
    restSec: 45,
    targetRpe: "8.0",
    isBodyweight: true,
    categoryRole: "맨몸 코어",
    tip: "기구 손잡이(또는 팔꿈치 패드)에 몸을 단단히 지지하고 서서, 반동 없이 아랫배를 말아 올리듯 무릎/다리를 가슴 쪽으로 끌어올립니다.",
    youtubeQuery: "행잉 레그레이즈 초보자 자세 행잉 니레이즈"
  }
];

// --- 수요일 : 유산소 & 심폐 회복 (35~40분) ---
const EXERCISES_WED_CARDIO = [
  {
    id: "wed_c1",
    order: "1",
    name: "트레드밀 인클라인 워킹 & 러닝",
    alternative: "야외 조깅 / 인터벌 러닝",
    machineId: null,
    customImage: FITNESS_IMAGES.treadmillIncline,
    target: "심폐 지구력 · 전신 체지방 연소 & 피로 물질 배출",
    setsReps: "35~40분 진행",
    restSec: 0,
    isCardioTime: true,
    defaultMinutes: 35,
    tip: "[추천 인클라인 파워워킹] 경사도 6~9%, 속도 5.5~6.0km/h 35~40분 (심박수 120~130bpm 유지) / [러닝 선택 시] 2분 달리기(7.5~8.5) + 1분 걷기(5.5) 인터벌 총 30분",
    youtubeQuery: "인클라인 러닝머신 걷기 유산소 효과"
  }
];

// --- 목요일 : 상체 B (랫풀다운 & 숄더 중심 / 총 19세트) ---
const EXERCISES_THU_UPPER = [
  {
    id: "thu_warmup",
    order: "웜업",
    name: "어깨 회전근개 & 동적 상체 스트레칭",
    machineId: null,
    customImage: FITNESS_IMAGES.upperWarmup,
    target: "어깨 / 흉추 / 팔꿈치 관절 예열",
    setsReps: "5분 진행",
    restSec: 0,
    tip: "어깨 돌리기, 밴드 풀어파트, 팔 가볍게 털기로 상체 관절을 부드럽게 예열합니다.",
    youtubeQuery: "상체 스트레칭 루틴 회전근개",
    isWarmup: true
  },
  {
    id: "thu_u1",
    order: "1",
    name: "렉스코 랫풀다운",
    alternative: "뉴텍 토쳐 프론트 풀다운",
    machineId: "m15",
    target: "광배근 상부 (등 너비 프레임)",
    setsReps: "4세트 × 8~10회",
    restSec: 90,
    targetRpe: "8.5",
    isMain: true,
    categoryRole: "메인 다관절",
    tip: "바를 쇄골 쪽으로 당기며 가슴을 위로 열고, 팔꿈치를 옆구리 쪽으로 깊게 찍어 누릅니다.",
    youtubeQuery: "랫풀다운 초보자 자세 광배근"
  },
  {
    id: "thu_u2",
    order: "2",
    name: "뉴텍 숄더프레스 (핀머신)",
    alternative: "해머 숄더프레스 (플레이트)",
    machineId: "m09",
    target: "전면/측면 삼각근",
    setsReps: "4세트 × 8~10회",
    restSec: 90,
    targetRpe: "8.5",
    isMain: true,
    categoryRole: "메인 다관절",
    tip: "손잡이가 귀나 턱 높이에서 시작하도록 시트를 맞추고 머리 위로 수직으로 밀어 올립니다.",
    youtubeQuery: "머신 숄더프레스 자세 어깨운동"
  },
  {
    id: "thu_u3",
    order: "3",
    name: "해머 아이소 하이로우 (or 로우로우)",
    alternative: "해머 로우로우 / 해머 디와이 로우",
    machineId: "m12",
    target: "광배근 하부 & 프레임",
    setsReps: "4세트 × 10~12회",
    restSec: 60,
    targetRpe: "8.0",
    categoryRole: "보조 다관절",
    tip: "가슴 패드에 상체를 안정적으로 지지하고 위에서 사선 아래 방향으로 팔꿈치를 골반 쪽으로 당깁니다.",
    youtubeQuery: "해머 하이로우 사용법 자세"
  },
  {
    id: "thu_u4",
    order: "4",
    name: "뉴텍 펙덱플라이 (핀머신)",
    alternative: "뉴텍 펙덱플라이 (플레이트)",
    machineId: "m05",
    target: "가슴 안쪽 모으기 / 흉근 볼륨",
    setsReps: "3세트 × 12~15회",
    restSec: 60,
    targetRpe: "8.5",
    categoryRole: "단일관절 고립",
    tip: "팔꿈치 각도를 살짝 굽혀 고정하고, 큰 통나무를 안는다는 느낌으로 가슴 중앙을 모아줍니다.",
    youtubeQuery: "펙덱플라이 가슴운동 자세 팁"
  },
  {
    id: "thu_u5",
    order: "5",
    name: "뉴텍 리버스 펙덱플라이 (후면 삼각근)",
    alternative: "덤벨 벤트오버 레터럴 레이즈",
    machineId: "m05",
    target: "후면 삼각근 (입체감 / 체형 교정)",
    setsReps: "4세트 × 12~15회",
    restSec: 45,
    targetRpe: "9.0",
    categoryRole: "단일관절 고립 (필수)",
    customSetupTip: "머신을 마주보고 앉아 시트를 조절하고, 손잡이를 어깨 높이로 맞춥니다.",
    customFormTip: "팔꿈치를 살짝 구부려 고정한 채 팔을 양옆으로 멀리 벌려 후면 어깨를 강하게 수축합니다.",
    customCaution: "승모근이 과하게 쓰이지 않도록 어깨를 누르고 팔꿈치로 밀어내세요.",
    tip: "머신을 마주보고 앉아 가슴을 패드에 대고, 팔을 양옆으로 멀리 벌려 후면 어깨를 강하게 수축합니다.",
    youtubeQuery: "리버스 펙덱플라이 후면삼각근 자세 팁"
  },
  {
    id: "thu_u6",
    order: "6",
    name: "뉴텍 시티드 딥 (핀머신)",
    alternative: "케이블 푸시다운",
    machineId: "m07",
    target: "팔 삼두 (팔 뒤쪽) & 아랫가슴",
    setsReps: "3세트 × 12회",
    restSec: 45,
    targetRpe: "8.5",
    categoryRole: "단일관절 고립",
    tip: "어깨가 솟지 않도록 누른 상태에서 손잡이를 아래로 강하게 밀어내며 팔 뒤쪽을 짭니다.",
    youtubeQuery: "시티드 딥스 머신 삼두운동"
  }
];

// --- 금요일 : 하체 B (후면사슬 & 둔근/햄스트링 중심 / 총 17세트) ---
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
    name: "루마니안 데드리프트",
    alternative: "스미스머신 루마니안 데드리프트",
    machineId: "m25",
    customImage: FITNESS_IMAGES.deadlift,
    target: "후면사슬 (햄스트링 / 둔근 / 기립근)",
    setsReps: "4세트 × 8~10회",
    restSec: 90,
    targetRpe: "8.0",
    isMain: true,
    categoryRole: "메인 다관절",
    tip: "가슴을 활짝 펴고 코어를 단단히 잡은 채 고관절을 뒤로 접어 바벨을 정강이까지 내렸다가 둔근과 햄스트링 힘으로 힘차게 일어섭니다.",
    youtubeQuery: "루마니안 데드리프트 자세 둔근"
  },
  {
    id: "fri_l2",
    order: "2",
    name: "뉴텍 레그 프레스 (발판 상단 둔근 타깃)",
    alternative: "렉스코 파워 레그 프레스",
    machineId: "m31",
    target: "둔근 & 대퇴이두(햄스트링) 집중",
    setsReps: "4세트 × 10~12회",
    restSec: 90,
    targetRpe: "8.5",
    categoryRole: "보조 다관절",
    tip: "발을 발판 상단에 어깨너비로 올려 뒤꿈치로 밀어냅니다. 둔근과 햄스트링에 자극이 집중됩니다.",
    youtubeQuery: "레그프레스 발판 상단 둔근 자극"
  },
  {
    id: "fri_l3",
    order: "3",
    name: "뉴텍 라잉 레그 컬",
    alternative: "",
    machineId: "m24",
    target: "햄스트링 수축 피크",
    setsReps: "3세트 × 12회",
    restSec: 60,
    targetRpe: "8.5",
    categoryRole: "단일관절 고립",
    tip: "반동 없이 발뒤꿈치를 엉덩이 쪽으로 접고 천천히 이완. 골반이 패드에서 뜨지 않게 주의.",
    youtubeQuery: "라잉 레그컬 햄스트링 자극 팁"
  },
  {
    id: "fri_l4",
    order: "4",
    name: "뉴텍 힙 어덕션 (허벅지 안쪽 모으는)",
    alternative: "",
    machineId: "m26",
    target: "허벅지 안쪽 (내전근 탄력)",
    setsReps: "3세트 × 15회",
    restSec: 45,
    targetRpe: "8.0",
    categoryRole: "단일관절 고립",
    tip: "허벅지 안쪽 힘으로 패드를 지그시 모으고 천천히 버티며 이완합니다. 모으는 동작에 집중!",
    youtubeQuery: "힙어덕션 머신 내전근 운동 자세"
  },
  {
    id: "fri_l5",
    order: "5",
    name: "백익스텐션 (허리 기립근 & 둔근)",
    alternative: "45도 하이퍼 익스텐션",
    machineId: null,
    customImage: FITNESS_IMAGES.backExtension,
    target: "둔근 / 기립근 자극 위주 (맨몸)",
    setsReps: "3세트 × 15회",
    restSec: 45,
    targetRpe: "7.5",
    isBodyweight: true,
    categoryRole: "맨몸 코어",
    tip: "패드를 골반 바로 아래 맞추고, 맨몸으로 일직선이 될 때까지만 기립근과 둔근 힘으로 수축합니다.",
    youtubeQuery: "백익스텐션 허리 기립근 엉덩이 자세"
  },
  {
    id: "fri_l6",
    order: "6",
    name: "행잉 레그 레이즈 (서서 다리 올리기)",
    alternative: "행잉 니 레이즈 / 캡틴스 체어",
    machineId: null,
    customImage: FITNESS_IMAGES.hangingLegRaise,
    target: "하복직근 (아랫배 강력 코어)",
    setsReps: "3세트 × 12~15회",
    restSec: 45,
    targetRpe: "8.0",
    isBodyweight: true,
    categoryRole: "맨몸 코어",
    tip: "기구 손잡이(또는 팔꿈치 패드)에 몸을 단단히 지지하고 서서, 반동 없이 아랫배를 말아 올리듯 무릎/다리를 가슴 쪽으로 끌어올립니다.",
    youtubeQuery: "행잉 레그레이즈 초보자 자세 행잉 니레이즈"
  }
];

// --- 토요일 : 유산소 버닝 (35~45분) ---
const EXERCISES_SAT_CARDIO = [
  {
    id: "sat_c1",
    order: "1",
    name: "트레드밀 인터벌 러닝 (or 실내 자전거)",
    alternative: "실내 사이클 40분",
    machineId: null,
    customImage: FITNESS_IMAGES.stairmillCycle,
    target: "전신 대사 활성화 & 체지방 버닝",
    setsReps: "35~45분 진행",
    restSec: 0,
    isCardioTime: true,
    defaultMinutes: 40,
    tip: "워밍업 5분 -> [속도 8.5~9.0km/h 2분 러닝 + 속도 5.5km/h 1분 걷기] × 8~10세트 -> 쿨다운 5분 (무릎/발목 피로 시 실내 사이클 40분 대체)",
    youtubeQuery: "트레드밀 인터벌 러닝 다이어트"
  }
];

// --- 일요일 : 스트레칭 & 폼롤러 회복 (약 25~30분) ---
const EXERCISES_SUN_RECOVERY = [
  {
    id: "sun_r1",
    order: "1",
    name: "등 & 흉추 신전 모빌리티 (폼롤러)",
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
    name: "대퇴사두근 & 장경인대 롤링",
    machineId: null,
    customImage: FITNESS_IMAGES.foamrollerLeg,
    target: "허벅지 앞/옆 근육 뭉침 & 무릎 통증 예방",
    setsReps: "좌/우 각 3분",
    restSec: 30,
    tip: "체중을 실어 허벅지 앞쪽과 바깥쪽을 지긋이 굴려줍니다. 아픈 부위에서 10초간 정지.",
    youtubeQuery: "폼롤러 허벅지 앞쪽 장경인대 풀기"
  },
  {
    id: "sun_r3",
    order: "3",
    name: "이상근(둔근 깊은 곳) & 햄스트링 롤링",
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
    name: "고관절 피죤(비둘기) 자세 & 장요근 런지 스트레칭",
    machineId: null,
    customImage: FITNESS_IMAGES.hipPigeonStretch,
    target: "골반 정렬 & 고관절 굴곡근 유연성",
    setsReps: "좌/우 각 45초 × 2세트",
    restSec: 30,
    tip: "골반이 틀어지지 않게 수평을 유지하고 숨을 내쉬며 골반을 바닥 쪽으로 부드럽게 낮춥니다.",
    youtubeQuery: "비둘기자세 스트레칭 골반교정"
  },
  {
    id: "sun_r5",
    order: "5",
    name: "소흉근 & 승모근 벽 스트레칭",
    machineId: null,
    customImage: FITNESS_IMAGES.neckShoulderStretch,
    target: "라운드숄더 교정 & 거북목 완화",
    setsReps: "5분 진행",
    restSec: 0,
    tip: "벽 모서리에 팔을 대고 가슴 앞쪽을 열어주고, 목을 좌우앞뒤로 부드럽게 당겨 늘립니다.",
    youtubeQuery: "소흉근 스트레칭 라운드숄더 거북목"
  }
];

// 월.화.수.목.금.토.일 각 요일별 개별 루틴 맵
const WEEKLY_ROUTINES = {
  // 월요일 : 상체 A
  mon: {
    id: "mon",
    dayName: "월요일",
    dayShort: "월",
    dayNumber: 1,
    type: "upper",
    title: "월요일 : 상체 A (체스트 & 풀업 중심)",
    subtitle: "복합 다관절 메인 중심 · 6종목 19세트 (약 50분)",
    estimatedTime: "약 50분",
    exercises: EXERCISES_MON_UPPER
  },
  // 화요일 : 하체 A
  tue: {
    id: "tue",
    dayName: "화요일",
    dayShort: "화",
    dayNumber: 2,
    type: "lower",
    title: "화요일 : 하체 A (대퇴사두 & 스쿼트 중심)",
    subtitle: "대퇴사두 & 스쿼트 중심 · 6종목 17세트 (약 45분)",
    estimatedTime: "약 45분",
    exercises: EXERCISES_TUE_LOWER
  },
  // 수요일 : 유산소 (인클라인 러닝)
  wed: {
    id: "wed",
    dayName: "수요일",
    dayShort: "수",
    dayNumber: 3,
    type: "cardio",
    title: "수요일 : 유산소 & 심폐 회복 데이",
    subtitle: "인클라인 파워워킹 또는 가벼운 러닝 인터벌",
    estimatedTime: "35~40분",
    exercises: EXERCISES_WED_CARDIO
  },
  // 목요일 : 상체 B
  thu: {
    id: "thu",
    dayName: "목요일",
    dayShort: "목",
    dayNumber: 4,
    type: "upper",
    title: "목요일 : 상체 B (랫풀다운 & 숄더 중심)",
    subtitle: "등 프레임 & 어깨 입체감 · 6종목 19세트 (약 50분)",
    estimatedTime: "약 50분",
    exercises: EXERCISES_THU_UPPER
  },
  // 금요일 : 하체 B
  fri: {
    id: "fri",
    dayName: "금요일",
    dayShort: "금",
    dayNumber: 5,
    type: "lower",
    title: "금요일 : 하체 B (후면사슬 & 둔근/햄스트링 중심)",
    subtitle: "데드리프트 & 둔근/햄스트링 · 6종목 17세트 (약 45분)",
    estimatedTime: "약 45분",
    exercises: EXERCISES_FRI_LOWER
  },
  // 토요일 : 유산소 (트레드밀 인터벌)
  sat: {
    id: "sat",
    dayName: "토요일",
    dayShort: "토",
    dayNumber: 6,
    type: "cardio",
    title: "토요일 : 유산소 버닝 데이",
    subtitle: "트레드밀 인터벌 러닝 또는 실내 사이클",
    estimatedTime: "35~45분",
    exercises: EXERCISES_SAT_CARDIO
  },
  // 일요일 : 스트레칭 회복
  sun: {
    id: "sun",
    dayName: "일요일",
    dayShort: "일",
    dayNumber: 0,
    type: "recovery",
    title: "일요일 : 폼롤러 회복 & 가동성 스트레칭 데이",
    subtitle: "전신 근육 이완 · 흉추 및 골반 가동성 회복 (약 25~30분)",
    estimatedTime: "약 25분",
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

// 부위 판별용 전체 운동 사전
const EXERCISE_BODY_PARTS = {
  // 하체
  "바벨스쿼트 (스미스 머신)": "하체",
  "루마니안 데드리프트": "하체",
  "데드리프트 (힙쓰러스트)": "하체",
  "뉴텍 레그 익스텐션": "하체",
  "뉴텍 레그 프레스 (or 시티드 레그 프레스)": "하체",
  "뉴텍 레그 프레스 (발판 상단 둔근 타깃)": "하체",
  "프리모션 브이스쿼트 (or 뉴텍 V-스쿼트)": "하체",
  "뉴텍 라잉 레그 컬": "하체",
  "뉴텍 힙 어덕션 (허벅지 안쪽 모으는)": "하체",
  "뉴텍 힙 어브덕션 (엉덩이 바깥쪽 벌리는)": "하체",
  "뉴텍 힙 어덕션 / 어브덕션 (or 링크 아웃타이)": "하체",
  "뉴텍 힙 쓰러스트 (or 부티 힙 쓰러스트)": "하체",
  "백익스텐션 (허리 기립근 & 둔근)": "하체",
  "고관절 스트레칭 & 맨몸 스쿼트": "하체",

  // 상체
  "뉴텍 풀업 어시스트": "상체",
  "뉴텍 시티드 체스트 프레스": "상체",
  "해머 시티드 인클라인 체스트 프레스": "상체",
  "해머 호리존탈 체스트 프레스": "상체",
  "렉스코 랫풀다운": "상체",
  "뉴텍 토쳐 프론트 풀다운": "상체",
  "뉴텍 펙덱플라이 (핀머신)": "상체",
  "뉴텍 펙덱플라이 (플레이트)": "상체",
  "뉴텍 리버스 펙덱플라이 (후면 삼각근)": "상체",
  "해머 아이소 하이로우 (or 로우로우)": "상체",
  "뉴텍 시티드로우 (핀머신)": "상체",
  "해머 디와이 로우 / 롱풀": "상체",
  "뉴텍 숄더프레스 (핀머신)": "상체",
  "뉴텍 사이드 레터럴 레이즈 (핀머신)": "상체",
  "뉴텍 시티드 딥 (핀머신)": "상체",
  "뉴텍 암컬 (핀머신)": "상체",
  "어깨 회전근개 & 동적 상체 스트레칭": "상체",

  // 복근 & 코어
  "행잉 레그 레이즈 (서서 다리 올리기)": "복근",
  "복근운동 - 누워서 다리들기 (레그레이즈)": "복근",
  "옆구리운동 - 바벨 옆으로 들기 (사이드 벤드)": "복근",
  "풀업 머신 행잉 니 레이즈 (딥스 팔걸이 활용)": "복근",
  "풀업 머신 행잉 니 레이즈 (딥스 패드 활용)": "복근",
  "원암 덤벨 사이드 벤드 (덤벨존 활용)": "복근",

  // 유산소
  "트레드밀 달리기": "유산소",
  "트레드밀 인클라인 워킹 & 러닝": "유산소",
  "트레드밀 인터벌 러닝 (or 실내 자전거)": "유산소",
  "가벼운 걷기 & 전신 관절 풀기": "유산소",
  "트레드밀 인클라인 경사 걷기 (or 인터벌 러닝)": "유산소",
  "스텝밀 (천국의 계단) or 실내 사이클": "유산소",
  "쿨다운 워킹 & 심박수 안정화": "유산소",

  // 스트레칭
  "등 & 흉추 신전 모빌리티 (폼롤러)": "스트레칭",
  "대퇴사두근 & 장경인대 롤링": "스트레칭",
  "이상근(둔근 깊은 곳) & 햄스트링 롤링": "스트레칭",
  "고관절 피죤(비둘기) 자세 & 장요근 런지 스트레칭": "스트레칭",
  "소흉근 & 승모근 벽 스트레칭": "스트레칭",
  "폼롤러 등 & 흉추 모빌리티 롤링": "스트레칭",
  "폼롤러 허벅지 앞/옆(장경인대) 이완": "스트레칭",
  "폼롤러 둔근(이상근) & 햄스트링 마사지": "스트레칭",
  "목/어깨 승모근 & 가슴 전면 이완 스트레칭": "스트레칭"
};

// 완료된 운동 목록에서 주 부위를 판별하고 달력 뱃지 텍스트를 만들어주는 지능형 분석 함수
function analyzeWorkoutParts(completedItemNames) {
  if (!completedItemNames || completedItemNames.length === 0) {
    return { mainPart: "없음", badgeText: "기록 없음", badgeClass: "none", counts: { lower: 0, upper: 0, cardio: 0, recovery: 0, core: 0, total: 0 } };
  }

  let lower = 0;
  let upper = 0;
  let cardio = 0;
  let recovery = 0;
  let core = 0;

  completedItemNames.forEach(name => {
    const part = EXERCISE_BODY_PARTS[name] || "";
    if (part === "하체") lower++;
    else if (part === "상체") upper++;
    else if (part === "유산소") cardio++;
    else if (part === "스트레칭") recovery++;
    else if (part === "복근") core++;
    else {
      if (name.includes("레그") || name.includes("스쿼트") || name.includes("타이") || name.includes("익스텐션") || name.includes("힙")) lower++;
      else if (name.includes("체스트") || name.includes("풀다운") || name.includes("플라이") || name.includes("로우") || name.includes("숄더") || name.includes("딥") || name.includes("컬")) upper++;
      else if (name.includes("트레드밀") || name.includes("스텝밀") || name.includes("사이클") || name.includes("유산소")) cardio++;
      else if (name.includes("스트레칭") || name.includes("폼롤러")) recovery++;
      else if (name.includes("니 레이즈") || name.includes("사이드 벤드") || name.includes("복근") || name.includes("다리들기")) core++;
      else upper++;
    }
  });

  const total = completedItemNames.length;
  let mainPart = "상체";
  let maxCount = upper;
  let badgeClass = "badge-upper";

  // 하체 판별 (복근을 하체하는 날 함께 하므로 하체가 1개 이상이고 최다인 경우)
  if (lower >= maxCount && lower > 0) {
    mainPart = "하체";
    maxCount = lower;
    badgeClass = "badge-lower";
  }
  if (cardio > maxCount) {
    mainPart = "유산소";
    maxCount = cardio;
    badgeClass = "badge-cardio";
  }
  if (recovery > maxCount) {
    mainPart = "스트레칭";
    maxCount = recovery;
    badgeClass = "badge-recovery";
  }

  // 상체와 하체가 거의 비등한 경우 전신
  if (Math.abs(upper - lower) <= 1 && upper >= 2 && lower >= 2) {
    mainPart = "전신";
    badgeClass = "badge-fullbody";
  }

  // 뱃지 텍스트 결정 (예: "하체 6개 완료", "✔ 하체 완료")
  let badgeText = `${mainPart} ${total}개`;
  if ((mainPart === "하체" && lower >= 6) || (mainPart === "상체" && upper >= 6) || (mainPart === "유산소" && cardio >= 3)) {
    badgeText = `✔ ${mainPart} 완료`;
  }

  return { mainPart, badgeText, badgeClass, counts: { lower, upper, cardio, recovery, core, total } };
}

// 과거 날짜 편집기에서 선택할 수 있는 부위별 마스터 운동 목록
const ALL_EDITABLE_EXERCISES = [
  {
    category: "하체 & 힙",
    items: [
      "바벨스쿼트 (스미스 머신)",
      "데드리프트 (힙쓰러스트)",
      "뉴텍 레그 익스텐션",
      "뉴텍 레그 프레스 (or 시티드 레그 프레스)",
      "프리모션 브이스쿼트 (or 뉴텍 V-스쿼트)",
      "뉴텍 라잉 레그 컬",
      "뉴텍 힙 어덕션 (허벅지 안쪽 모으는)",
      "뉴텍 힙 어브덕션 (엉덩이 바깥쪽 벌리는)",
      "뉴텍 힙 쓰러스트 (or 부티 힙 쓰러스트)",
      "백익스텐션 (허리 기립근 & 둔근)",
      "고관절 스트레칭 & 맨몸 스쿼트"
    ]
  },
  {
    category: "상체",
    items: [
      "뉴텍 시티드 체스트 프레스",
      "렉스코 랫풀다운",
      "뉴텍 풀업 어시스트",
      "뉴텍 펙덱플라이 (핀머신)",
      "뉴텍 시티드로우 (핀머신)",
      "뉴텍 숄더프레스 (핀머신)",
      "뉴텍 사이드 레터럴 레이즈 (핀머신)",
      "뉴텍 시티드 딥 (핀머신)",
      "뉴텍 암컬 (핀머신)",
      "어깨 회전근개 & 동적 상체 스트레칭"
    ]
  },
  {
    category: "복근 & 코어",
    items: [
      "행잉 레그 레이즈 (서서 다리 올리기)",
      "복근운동 - 누워서 다리들기 (레그레이즈)",
      "옆구리운동 - 바벨 옆으로 들기 (사이드 벤드)",
      "풀업 머신 행잉 니 레이즈 (딥스 패드 활용)",
      "원암 덤벨 사이드 벤드 (덤벨존 활용)"
    ]
  },
  {
    category: "유산소",
    items: [
      "트레드밀 달리기",
      "트레드밀 인클라인 경사 걷기 (or 인터벌 러닝)",
      "스텝밀 (천국의 계단) or 실내 사이클",
      "가벼운 걷기 & 전신 관절 풀기",
      "쿨다운 워킹 & 심박수 안정화"
    ]
  },
  {
    category: "스트레칭",
    items: [
      "폼롤러 등 & 흉추 모빌리티 롤링",
      "폼롤러 허벅지 앞/옆(장경인대) 이완",
      "폼롤러 둔근(이상근) & 햄스트링 마사지",
      "고관절 비둘기 자세 & 장요근 런지 스트레칭",
      "목/어깨 승모근 & 가슴 전면 이완 스트레칭"
    ]
  }
];
