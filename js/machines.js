// 헬스 머신 도감 데이터베이스 (피트니스 센터 주요 머신 33종)
const BASE_IMG_URL = "https://highclass-dongcheon-guide.sungpark266.chatgpt.site";

const MACHINES_DATA = [
  // --- 가슴 (CHEST) ---
  {
    id: "m01",
    name: "해머 호리존탈 체스트 프레스",
    brand: "HAMMER STRENGTH",
    category: "chest",
    categoryLabel: "가슴",
    target: "가슴 전체 · 삼두",
    image: `${BASE_IMG_URL}/machine-photos/hammer-horizontal.webp`,
    setupTip: "손잡이가 가슴 중앙(유두선) 높이에 오도록 시트 높이를 조절합니다.",
    formTip: "견갑골(날개뼈)을 뒤로 모아 등받이에 밀착하고, 가슴을 활짝 편 상태에서 밀어냅니다.",
    caution: "팔꿈치가 어깨선 위로 올라가면 어깨 관절에 무리가 갈 수 있습니다."
  },
  {
    id: "m02",
    name: "해머 시티드 인클라인 체스트 프레스",
    brand: "HAMMER STRENGTH",
    category: "chest",
    categoryLabel: "가슴",
    target: "윗가슴 · 앞어깨 · 삼두",
    image: `${BASE_IMG_URL}/machine-photos/hammer-incline.webp`,
    setupTip: "손잡이 위치가 쇄골 아랫부분에 맞춰지도록 의자를 조절합니다.",
    formTip: "대각선 위쪽 방향으로 가슴 상부의 긴장을 느끼며 자연스럽게 밀어 올립니다.",
    caution: "허리를 과도하게 꺾지 말고 복부에 힘을 단단히 유지하세요."
  },
  {
    id: "m03",
    name: "뉴텍 시티드 체스트 프레스",
    brand: "NEWTECH",
    category: "chest",
    categoryLabel: "가슴",
    target: "가슴 전체 · 삼두",
    image: `${BASE_IMG_URL}/machine-photos/seated-chest.webp`,
    setupTip: "손잡이가 가슴 중앙에 오도록 발판 레버나 시트 높이를 맞춥니다.",
    formTip: "밀 때는 가슴 안쪽까지 쥐어짜고, 돌아올 때는 천천히 가슴 근육을 늘려줍니다.",
    caution: "밀 때 어깨가 솟아오르지(으쓱하지) 않도록 하강 고정합니다."
  },
  {
    id: "m04",
    name: "뉴텍 펙덱플라이 (플레이트머신)",
    brand: "NEWTECH",
    category: "chest",
    categoryLabel: "가슴",
    target: "가슴 전체 · 가슴 안쪽",
    image: `${BASE_IMG_URL}/machine-photos/plate-pec-fly.webp`,
    setupTip: "팔꿈치 패드나 손잡이가 가슴 중앙 높이에 오도록 조절합니다.",
    formTip: "큰 나무를 껴안는 느낌으로 팔꿈치 각도를 살짝 굽혀 고정하고 가슴을 모아줍니다.",
    caution: "팔꿈치를 뒤로 너무 과도하게 넘기면 어깨 앞쪽 인대에 무리가 갑니다."
  },
  {
    id: "m05",
    name: "뉴텍 펙덱플라이 (핀머신)",
    brand: "NEWTECH",
    category: "chest",
    categoryLabel: "가슴",
    target: "가슴 · 후면어깨",
    image: `${BASE_IMG_URL}/machine-photos/pec-reverse.webp`,
    setupTip: "상단 레버 핀을 뽑아 플라이 각도로 맞춥니다. 시트는 어깨보다 살짝 낮게 세팅.",
    formTip: "숨을 내쉬며 가슴 중앙을 모아주고, 들이마시며 2~3초간 천천히 이완합니다.",
    caution: "손목이 꺾이지 않도록 손목과 전완근을 일직선으로 유지하세요."
  },
  {
    id: "m06",
    name: "뉴텍 디클라인 시티드 체스트 프레스",
    brand: "NEWTECH",
    category: "chest",
    categoryLabel: "가슴",
    target: "아랫가슴 · 삼두",
    image: `${BASE_IMG_URL}/machine-photos/decline-chest.webp`,
    setupTip: "손잡이를 잡았을 때 명치 아랫방향으로 밀 수 있는 포지션을 만듭니다.",
    formTip: "가슴 아랫라인 궤적을 따라 사선 아래로 밀어내며 아랫가슴 라인을 다듬습니다.",
    caution: "반동을 쓰지 말고 일정한 속도로 밀고 당겨주세요."
  },
  {
    id: "m07",
    name: "뉴텍 시티드 딥 (핀머신)",
    brand: "NEWTECH",
    category: "chest",
    categoryLabel: "가슴",
    target: "아랫가슴 · 삼두",
    image: `${BASE_IMG_URL}/machine-photos/seated-dip.webp`,
    setupTip: "허벅지 패드가 몸을 단단히 고정하도록 조절합니다.",
    formTip: "상체를 살짝 앞으로 숙이면 아랫가슴, 상체를 곧게 세우면 삼두근에 강한 자극이 옵니다.",
    caution: "어깨가 위로 밀려 올라가지 않도록 날개뼈를 아래로 꽉 눌러 고정합니다."
  },

  // --- 어깨 (SHOULDERS) ---
  {
    id: "m08",
    name: "뉴텍 사이드 레터럴 레이즈 (핀머신)",
    brand: "NEWTECH",
    category: "shoulders",
    categoryLabel: "어깨",
    target: "어깨 옆면 (측면삼각근)",
    image: `${BASE_IMG_URL}/machine-photos/standing-lateral.webp`,
    setupTip: "패드가 팔꿈치 살짝 위쪽 또는 바깥쪽에 오도록 가슴 패드 높이를 조절합니다.",
    formTip: "승모근 개입을 줄이고 팔꿈치로 물을 붓듯이 양옆으로 멀리 밀어 올립니다.",
    caution: "팔을 너무 높게(어깨 위로) 올리면 승모근이 과도하게 쓰입니다."
  },
  {
    id: "m09",
    name: "뉴텍 숄더프레스 (핀머신)",
    brand: "NEWTECH",
    category: "shoulders",
    categoryLabel: "어깨",
    target: "어깨 전면/측면 · 삼두",
    image: `${BASE_IMG_URL}/machine-photos/shoulder-press.webp`,
    setupTip: "손잡이가 귀나 턱 높이에서 시작하도록 시트 높이를 조절합니다.",
    formTip: "허리를 가볍게 아치형으로 만들고 머리 위로 수직으로 밀어 올립니다.",
    caution: "팔꿈치가 몸통 뒤로 빠지지 않도록 살짝 앞으로 모아주세요."
  },
  {
    id: "m10",
    name: "뉴텍 숄더프레스 (플레이트머신)",
    brand: "NEWTECH",
    category: "shoulders",
    categoryLabel: "어깨",
    target: "어깨 전체 · 삼두",
    image: `${BASE_IMG_URL}/machine-photos/plate-shoulder.webp`,
    setupTip: "원판을 균등하게 꽂고 손잡이 위치가 턱선에 오도록 안장 높이를 세팅합니다.",
    formTip: "고중량을 안정적으로 다룰 수 있는 원판 머신입니다. 머리 위로 힘차게 밀어올립니다.",
    caution: "끝까지 밀었을 때 팔꿈치를 락(lock)하지 말고 살짝 굽힌 상태를 유지합니다."
  },

  // --- 등 (BACK) ---
  {
    id: "m11",
    name: "뉴텍 풀업머신 (어시스티드)",
    brand: "NEWTECH",
    category: "back",
    categoryLabel: "등",
    target: "광배근 · 이두 · 코어",
    image: `${BASE_IMG_URL}/machine-photos/assisted-pullup.webp`,
    setupTip: "핀 무게가 무거울수록 내 몸무게를 더 많이 받쳐주어 쉬워집니다.",
    formTip: "가슴을 하늘 쪽으로 열며 쇄골이 바에 닿는 느낌으로 등 근육으로 당깁니다.",
    caution: "반동으로 몸을 튕기지 말고 등을 쥐어짜며 통제하세요."
  },
  {
    id: "m12",
    name: "해머 아이소 하이로우",
    brand: "HAMMER STRENGTH",
    category: "back",
    categoryLabel: "등",
    target: "광배근 위쪽 · 등 상부 · 이두",
    image: `${BASE_IMG_URL}/machine-photos/hammer-high-row.webp`,
    setupTip: "가슴 패드에 상체를 안정적으로 지지하고 시트 높이를 설정합니다.",
    formTip: "위에서 아래 사선 방향으로 팔꿈치를 골반 쪽으로 깊게 찍어 누르듯 당깁니다.",
    caution: "상체가 패드에서 떨어지지 않도록 가슴을 밀착시키세요."
  },
  {
    id: "m13",
    name: "해머 디와이 로우 (DY Row)",
    brand: "HAMMER STRENGTH",
    category: "back",
    categoryLabel: "등",
    target: "광배근 하부 · 능형근 · 이두",
    image: `${BASE_IMG_URL}/machine-photos/hammer-dy-row.webp`,
    setupTip: "발판을 지지하고 가슴 패드 상단에 명치가 걸치도록 합니다.",
    formTip: "도리안 예이츠 스타일 로우 머신으로, 광배근 하부를 아주 강하게 타깃팅합니다.",
    caution: "허리를 과도하게 뒤로 젖히며 당기지 마세요."
  },
  {
    id: "m14",
    name: "해머 로우로우 (Low Row)",
    brand: "HAMMER STRENGTH",
    category: "back",
    categoryLabel: "등",
    target: "광배근 아래쪽 · 등 중앙 · 이두",
    image: `${BASE_IMG_URL}/machine-photos/hammer-low-row.jpg`,
    setupTip: "시트에 앉아 가슴 패드를 몸통에 단단히 밀착시킵니다.",
    formTip: "아래에서 위 대각선 방향으로 팔꿈치를 뒤로 보내며 등을 접어줍니다.",
    caution: "어깨가 올라가지 않도록 주의하고 팔꿈치 궤적에 집중합니다."
  },
  {
    id: "m15",
    name: "렉스코 랫풀다운",
    brand: "LEXCO",
    category: "back",
    categoryLabel: "등",
    target: "광배근 (등 넓이) · 이두",
    image: `${BASE_IMG_URL}/machine-photos/lexco-lat-pulldown.jpg`,
    setupTip: "허벅지 지지 패드가 들썩거리지 않게 꽉 맞물리도록 조절합니다.",
    formTip: "바를 쇄골 쪽으로 당기며 가슴을 위로 들어 올리고, 올릴 때는 천천히 광배근을 늘립니다.",
    caution: "상체를 너무 뒤로 과도하게 눕지 마세요 (15~20도 적당)."
  },
  {
    id: "m16",
    name: "뉴텍 토쳐 프론트 풀다운",
    brand: "NEWTECH · M-TORTURE",
    category: "back",
    categoryLabel: "등",
    target: "광배근 · 이두",
    image: `${BASE_IMG_URL}/machine-photos/wide-front.webp`,
    setupTip: "시트에 깊숙이 앉아 무릎 패드를 단단히 잠급니다.",
    formTip: "좌우 독립 궤적으로 움직이므로 밸런스를 잡기에 매우 우수합니다.",
    caution: "한쪽으로 힘이 쏠리지 않도록 양쪽 광배근을 균형 있게 씁니다."
  },
  {
    id: "m17",
    name: "뉴텍 토쳐 와이드 풀다운",
    brand: "NEWTECH · M-TORTURE",
    category: "back",
    categoryLabel: "등",
    target: "광배근 바깥쪽 · 등 상부",
    image: `${BASE_IMG_URL}/machine-photos/wide-rear.webp`,
    setupTip: "넓은 그립 궤적에 맞춰 시트 위치를 조절합니다.",
    formTip: "팔꿈치로 큰 호를 그리며 광배근 외측을 넓혀주는 느낌으로 당깁니다.",
    caution: "목에 힘을 주지 말고 시선은 15도 위를 바라보세요."
  },
  {
    id: "m18",
    name: "티바로우 (T-Bar Row)",
    brand: "NEWTECH",
    category: "back",
    categoryLabel: "등",
    target: "등 전체 두께감 · 후면어깨 · 이두",
    image: `${BASE_IMG_URL}/machine-photos/newtech-tbar-row.webp`,
    setupTip: "발판에 발을 견고히 딛고 가슴 패드에 상체를 안착시킵니다.",
    formTip: "등의 두께감을 키우는 최고의 머신입니다. 팔꿈치를 몸통 뒤로 강하게 당기세요.",
    caution: "가슴 패드에서 상체가 들썩거리지 않도록 코어를 고정합니다."
  },
  {
    id: "m19",
    name: "뉴텍 시티드로우 (핀머신)",
    brand: "NEWTECH",
    category: "back",
    categoryLabel: "등",
    target: "등 중앙 (능형근/중부승모근) · 광배근",
    image: `${BASE_IMG_URL}/machine-photos/seated-row-pin.webp`,
    setupTip: "가슴 패드가 명치 부근에 닿도록 손잡이 거리를 조절합니다.",
    formTip: "당길 때 견갑골을 서로 맞닿게 접어주고 가슴을 펴줍니다.",
    caution: "허리를 뒤로 젖히는 반동을 쓰지 마세요."
  },
  {
    id: "m20",
    name: "뉴텍 토쳐 시티드로우",
    brand: "NEWTECH · M-TORTURE",
    category: "back",
    categoryLabel: "등",
    target: "등 중앙 · 광배근 하부",
    image: `${BASE_IMG_URL}/machine-photos/tocher-seated-row.png`,
    setupTip: "원판 로딩 방식으로 묵직한 자극을 전달합니다. 시트 높이를 맞춥니다.",
    formTip: "손잡이를 명치 아래쪽으로 부드럽게 당겨 등 깊숙한 곳까지 자극을 줍니다.",
    caution: "손목에 힘을 빼고 팔꿈치가 이끄는 느낌으로 당깁니다."
  },
  {
    id: "m21",
    name: "뉴텍 케이블 시티드로우 (롱풀)",
    brand: "NEWTECH",
    category: "back",
    categoryLabel: "등",
    target: "광배근 · 등 중앙 · 이두",
    image: `${BASE_IMG_URL}/machine-photos/long-pull.webp`,
    setupTip: "발판에 발을 딛고 무릎은 살짝 굽힌 상태를 유지합니다.",
    formTip: "상체를 수직으로 세우고 케이블을 배꼽 쪽으로 당기며 등을 모읍니다.",
    caution: "상체가 앞뒤로 과도하게 흔들리지 않도록 복압을 유지하세요."
  },

  // --- 하체 (LEGS) ---
  {
    id: "m22",
    name: "뉴텍 시티드 레그프레스",
    brand: "NEWTECH",
    category: "legs",
    categoryLabel: "하체",
    target: "허벅지 전반 · 엉덩이(둔근)",
    image: `${BASE_IMG_URL}/machine-photos/newtech-seated-leg-press.webp`,
    setupTip: "무릎 각도가 약 90도가 되도록 등받이 거리를 조절합니다.",
    formTip: "발판 중앙에 발을 골반 너비로 두고 뒤꿈치로 힘차게 밀어냅니다.",
    caution: "무릎을 완전히 펴서 꺾지 말고, 무릎이 안쪽으로 모이지 않게 주의합니다."
  },
  {
    id: "m23",
    name: "뉴텍 레그 익스텐션",
    brand: "NEWTECH",
    category: "legs",
    categoryLabel: "하체",
    target: "허벅지 앞쪽 (대퇴사두근 웜업/선피로)",
    image: `${BASE_IMG_URL}/machine-photos/newtech-leg-extension.webp`,
    setupTip: "발목 롤패드가 복사뼈 바로 위에 오고, 무릎 관절 회전축과 머신 축을 일치시킵니다.",
    formTip: "엉덩이가 뜨지 않게 옆 손잡이를 꽉 잡고 허벅지 앞쪽 근육을 쥐어짜며 올립니다.",
    caution: "반동을 주지 말고 올릴 때 1초 멈춤, 내릴 때 2~3초 버티며 내립니다."
  },
  {
    id: "m24",
    name: "뉴텍 라잉 레그컬",
    brand: "NEWTECH",
    category: "legs",
    categoryLabel: "하체",
    target: "허벅지 뒤쪽 (햄스트링)",
    image: `${BASE_IMG_URL}/machine-photos/newtech-leg-curl.webp`,
    setupTip: "패드가 아킬레스건 윗부분에 닿도록 길이 조절, 골반 패드에 엎드립니다.",
    formTip: "골반이 패드에서 뜨지 않도록 손잡이를 당기며 뒤꿈치를 엉덩이 쪽으로 접습니다.",
    caution: "허리로 들지 마세요! 골반을 패드에 꾹 누르고 햄스트링 힘만 씁니다."
  },
  {
    id: "m25",
    name: "뉴텍 스탠딩 힙쓰러스트",
    brand: "NEWTECH",
    category: "legs",
    categoryLabel: "하체/힙",
    target: "엉덩이(둔근) · 척추기립근 · 햄스트링",
    image: `${BASE_IMG_URL}/machine-photos/newtech-hip-thrust.webp`,
    setupTip: "골반 벨트나 패드를 골반 뼈 바로 아래에 단단히 고정합니다.",
    formTip: "발뒤꿈치로 지면을 누르며 골반을 앞으로 힘차게 밀어 엉덩이를 최대로 수축합니다.",
    caution: "허리를 과하게 꺾지 말고 골반을 말아 올린다는 느낌으로 진행합니다."
  },
  {
    id: "m26",
    name: "뉴텍 힙 어덕션 / 어브덕션",
    brand: "NEWTECH",
    category: "legs",
    categoryLabel: "하체/힙",
    target: "엉덩이 옆 (중둔근) / 허벅지 안쪽 (내전근)",
    image: `${BASE_IMG_URL}/machine-photos/newtech-in-out-thigh.webp`,
    setupTip: "패드를 돌려 바깥쪽(아웃타이: 중둔근) 또는 안쪽(이너타이: 내전근)으로 세팅합니다.",
    formTip: "벌릴 때는 무릎 바깥쪽으로 밀고, 모을 때는 허벅지 안쪽 힘으로 쥐어짭니다.",
    caution: "상체를 살짝 숙이면 엉덩이 상부 자극이 훨씬 더 깊게 들어옵니다."
  },
  {
    id: "m27",
    name: "부티빌더 힙쓰러스트 (Booty Builder)",
    brand: "BOOTY BUILDER",
    category: "legs",
    categoryLabel: "하체/힙",
    target: "엉덩이 극대화 · 힙업 · 기립근",
    image: `${BASE_IMG_URL}/machine-photos/booty-hip-thrust-large.webp`,
    setupTip: "벨트를 골반에 조이고 발을 발판 중앙에 편안하게 놓습니다.",
    formTip: "턱을 살짝 당기고 시선은 정면을 보며 골반을 위로 뻗어 올려 엉덩이를 꽉 조입니다.",
    caution: "정점에서 1~2초간 엉덩이를 강하게 쥐어짜는 홀딩이 핵심입니다."
  },
  {
    id: "m28",
    name: "렉스코 링크 아웃타이",
    brand: "LEXCO",
    category: "legs",
    categoryLabel: "하체/힙",
    target: "엉덩이 옆면 (중둔근/소둔근) 볼륨",
    image: `${BASE_IMG_URL}/machine-photos/link-out-thigh.webp`,
    setupTip: "무릎 패드 바깥쪽에 허벅지를 위치시키고 안장에 앉습니다.",
    formTip: "상체를 45도 숙이고 손잡이를 잡은 뒤 양쪽 무릎을 바깥으로 넓게 벌립니다.",
    caution: "발목이 아닌 무릎으로 패드를 밀어내야 엉덩이에 직접 자극이 갑니다."
  },
  {
    id: "m29",
    name: "뉴텍 브이스쿼트 (V-Squat)",
    brand: "NEWTECH",
    category: "legs",
    categoryLabel: "하체",
    target: "허벅지 전체 · 둔근 · 척추기립근",
    image: `${BASE_IMG_URL}/machine-photos/newtech-v-squat.png`,
    setupTip: "어깨 패드를 걸치고 안전 레버를 풀어줍니다. 정방향 또는 역방향(리버스) 가능.",
    formTip: "엉덩이를 뒤로 빼며 고관절을 접어 깊숙이 앉았다가 뒤꿈치로 발판을 밀며 일어섭니다.",
    caution: "일어날 때 무릎을 튕기지 말고 허벅지와 엉덩이 텐션을 끝까지 유지합니다."
  },
  {
    id: "m30",
    name: "프리모션 브이스쿼트",
    brand: "FREEMOTION",
    category: "legs",
    categoryLabel: "하체",
    target: "허벅지 전체 · 둔근 · 코어",
    image: `${BASE_IMG_URL}/machine-photos/freemotion-v-squat.jpg`,
    setupTip: "발을 발판 앞쪽에 두면 둔근/햄스트링, 뒤쪽에 두면 대퇴사두근에 집중됩니다.",
    formTip: "자유로운 호를 그리는 프리모션 특유의 부드러운 궤적으로 관절 부담이 적습니다.",
    caution: "허리가 굽지 않도록 가슴을 펴고 복압을 꽉 채우세요."
  },
  {
    id: "m31",
    name: "뉴텍 파워 레그프레스",
    brand: "NEWTECH",
    category: "legs",
    categoryLabel: "하체",
    target: "하체 전반 메인 고중량 · 둔근",
    image: `${BASE_IMG_URL}/machine-photos/newtech-leg-press.webp`,
    setupTip: "원판을 균형 있게 꽂고, 안전 멈춤 레버 위치를 유연성에 맞게 세팅합니다.",
    formTip: "엉덩이가 등받이에서 뜨지 않도록 손잡이를 강하게 당기며 깊이 내렸다가 밉니다.",
    caution: "밀었을 때 무릎을 완전히 펴지(락킹하지) 마세요. 관절 부상 위험이 있습니다."
  },
  {
    id: "m32",
    name: "뉴텍 핵스쿼트 (Hack Press)",
    brand: "NEWTECH",
    category: "legs",
    categoryLabel: "하체",
    target: "허벅지 앞쪽 (대퇴사두근) 강력 타깃",
    image: `${BASE_IMG_URL}/machine-photos/newtech-hack-press.webp`,
    setupTip: "어깨 패드에 어깨를 밀착하고 발을 발판 중간에 둡니다 (리버스 스쿼트도 가능).",
    formTip: "대퇴사두근을 찢어주는 느낌으로 깊숙이 내려갔다가 앞 허벅지 힘으로 밀어 올립니다.",
    caution: "뒤꿈치가 뜨지 않도록 발바닥 전체로 지면을 지지합니다."
  },

  // --- 팔 (ARMS) ---
  {
    id: "m33",
    name: "뉴텍 암컬 (핀머신)",
    brand: "NEWTECH",
    category: "arms",
    categoryLabel: "팔",
    target: "팔 앞쪽 (상완이두근)",
    image: `${BASE_IMG_URL}/machine-photos/arm-curl.webp`,
    setupTip: "겨드랑이가 경사 패드 꼭대기에 편안히 밀착되도록 안장을 조절합니다.",
    formTip: "팔꿈치를 패드에 단단히 고정하고 손목을 꺾지 않은 채 이두근을 접어 올립니다.",
    caution: "몸을 뒤로 젖히며 반동을 주지 말고 팔꿈치 관절만 사용합니다."
  }
];

// 기구 이름으로 쉽게 매칭할 수 있는 헬퍼
function findMachineByName(nameQuery) {
  if (!nameQuery) return null;
  const q = nameQuery.toLowerCase().replace(/[\s\(\)\-\_]/g, "");
  return MACHINES_DATA.find(m => {
    const mName = m.name.toLowerCase().replace(/[\s\(\)\-\_]/g, "");
    return mName.includes(q) || q.includes(mName);
  });
}
