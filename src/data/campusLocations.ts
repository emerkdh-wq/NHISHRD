import type { MindfulPoint, TeleportSpot, WishNote } from '../types/metaverse';

export const TELEPORT_SPOTS: TeleportSpot[] = [
  {
    id: 'field-center',
    label: '운동장 중앙',
    subtitle: '잔디 운동장과 금수산·청풍호 파노라마',
    position: [0, 0, 14],
    yaw: Math.PI, // facing north toward main building
  },
  {
    id: 'main-plaza',
    label: '본관 광장',
    subtitle: '국민건강보험공단 인재개발원 본관 앞',
    position: [0, 2.6, -42],
    yaw: Math.PI,
  },
  {
    id: 'pergola-deck',
    label: '파고라 쉼터',
    subtitle: '운동장이 한눈에 내려다보이는 목재 데크',
    position: [0, 1.1, -32.8],
    yaw: 0, // facing south over the field & lake
  },
  {
    id: 'bell-pavilion',
    label: '명상종각',
    subtitle: '마음을 비우는 청풍 명상종',
    position: [21, 2.6, -39.5],
    yaw: -Math.PI * 0.25,
  },
  {
    id: 'lake-overlook',
    label: '청풍호 전망대',
    subtitle: '잔잔한 청풍호반과 소원 연등 데크',
    position: [22, 0.45, 58],
    yaw: 0, // facing south over Cheongpung Lake
  },
  {
    id: 'tennis-court',
    label: '테니스·농구장',
    subtitle: '남쪽 테니스 코트 및 야외 체육 공간',
    position: [-25, -0.25, 33.5],
    yaw: Math.PI * 0.85,
  },
];

export const MINDFUL_POINTS: MindfulPoint[] = [
  {
    id: 'center-walk',
    title: '운동장 행선(行禪) 명상원',
    subtitle: '넓은 초록 운동장을 천천히 걸으며 호흡을 가다듬는 자리',
    quote: '발걸음 하나마다 땅의 온기를 느끼고, 눈을 들면 산과 호수가 마음 안에 들어옵니다.',
    actionLabel: '잠시 멈춰 호흡하기',
    position: [0, 0, 0],
    radius: 6.5,
  },
  {
    id: 'resonance-bell',
    title: '청풍 명상종(冥想鐘)',
    subtitle: '맑은 쇠울림으로 생각의 결을 고르게 하는 종각',
    quote: '한 번의 울림이 허공에 퍼지고, 소리가 사라진 자리에 고요만 남습니다.',
    actionLabel: '명상종 울리기',
    position: [24, 2.6, -42],
    radius: 5.5,
  },
  {
    id: 'pergola-rest',
    title: '목재 파고라 다담(茶談) 쉼터',
    subtitle: '나무 그늘 아래서 캠퍼스와 운동장을 바라보는 쉼의 공간',
    quote: '잠시 멈추어 앉으니 바람결에 실려온 솔향이 하루의 무게를 덜어줍니다.',
    actionLabel: '바람소리 듣기',
    position: [0, 1.1, -33.2],
    radius: 5.0,
  },
  {
    id: 'lake-lantern',
    title: '청풍호반 연등 전망대',
    subtitle: '청풍호 물결 위로 소원과 다짐의 연등을 띄우는 곳',
    quote: '잔잔한 호수 위에 작은 등불 하나 띄우며 오늘의 감사와 평안을 새깁니다.',
    actionLabel: '소원 연등 띄우기',
    position: [22, 0.45, 61.5],
    radius: 6.0,
  },
];

export const INITIAL_WISHES: WishNote[] = [
  {
    id: 'w1',
    author: '연수생 김서연',
    message: '청풍호의 고요한 아침처럼 올 한 해도 마음이 단단하고 평온하기를 바랍니다.',
    createdAt: '오늘 아침',
    color: '#F59E0B',
  },
  {
    id: 'w2',
    author: '이도현',
    message: '국민건강보험의 가치처럼 이웃과 나 자신의 건강을 돌보는 따뜻한 사람이 되겠습니다.',
    createdAt: '어제 저녁',
    color: '#FB7185',
  },
  {
    id: 'w3',
    author: '박지훈',
    message: '산사 같은 인재개발원 운동장을 걸으며 오래된 걱정을 내려놓고 갑니다.',
    createdAt: '2일 전',
    color: '#34D399',
  },
];

export function detectZoneName(x: number, z: number): string {
  if (x >= -48 && x <= 48 && z >= -29 && z <= 29) {
    return '대운동장 (잔디 축구장)';
  }
  if (x >= -48 && x <= -28 && z >= -37.5 && z < -29) {
    return '야외 농구장';
  }
  if (x >= -26 && x <= 36 && z >= -36.5 && z < -29) {
    return '목재 파고라 스탠드';
  }
  if (x >= -26 && x <= 26 && z >= -52 && z < -37) {
    return '인재개발원 본관 광장';
  }
  if (x > 16 && x <= 32 && z >= -47 && z <= -37) {
    return '청풍 명상종각';
  }
  if (x >= -46 && x <= -4 && z >= 33 && z <= 61) {
    return '남측 테니스장';
  }
  if (x >= 4 && x <= 46 && z >= 33 && z <= 68) {
    return '청풍호반 명상 정자 · 전망대';
  }
  if (x > 34 && z < -35) {
    return '동측 생활관 · 체육관 길';
  }
  if (x < -34 && z < -35) {
    return '서측 생활관 · 암석원 길';
  }
  return '인재개발원 산책로';
}
