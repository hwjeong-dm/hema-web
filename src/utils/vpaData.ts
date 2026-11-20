export interface LearningData {
  first: string;
  second: string;
}

export interface NumberQuestionData {
  questionName: string;
  numbers: number[];
}

export interface FigureOption {
  id: string;
  shape: 'circle' | 'rectangle' | 'star' | 'pentagon' | 'heart' | 'triangle';
  color: string;
  label: string;
  asset: string;
}

export interface FigureQuestionData {
  questionName: string;
  options: FigureOption[];
}

const WORD_PAIRS: LearningData[] = [
  { first: '암', second: '약' },
  { first: '술', second: '한자' },
  { first: '면', second: '고라니' },
  { first: '건강', second: '몸' },
  { first: '바지', second: '향기' },
  { first: '간식', second: '빗자루' },
  { first: '귀마개', second: '침' },
  { first: '개나리', second: '항구' },
  { first: '아버지', second: '어머니' },
];

export function getLearningWords(): LearningData[] {
  return [...WORD_PAIRS].sort(() => Math.random() - 0.5);
}

export function getJaeinAnswers(answer: string): string[] {
  const answers: Record<string, string[]> = {
    약: ['약', '약국', '영화관'], 한자: ['한자', '한글', '근육'],
    고라니: ['고라니', '사슴', '전단지'], 몸: ['몸', '귀', '편지'],
    향기: ['향기', '향초', '화가'], 빗자루: ['빗자루', '청소', '죽'],
    침: ['침', '바늘', '태극기'], 항구: ['항구', '바다', '늑대'],
    어머니: ['어머니', '부부', '은행'],
  };
  return [...(answers[answer] || [])].sort(() => Math.random() - 0.5);
}

export function getNumberQuestion(): NumberQuestionData {
  return {
    questionName: Math.random() < 0.5 ? '가장 큰 수에서 작은 수\n순서대로 눌러주세요.' : '가장 작은 수에서 큰 수\n순서대로 눌러주세요.',
    numbers: [...Array.from({ length: 99 }, (_, i) => i + 1)].sort(() => Math.random() - 0.5).slice(0, 9),
  };
}

export function getFigureQuestion(): FigureQuestionData {
  // Android's figure pool: pink triangles(4), green stars(4), yellow
  // rectangles(2), blue circles(2), red hearts(4), purple pentagons(4).
  const groups: Array<[FigureOption['shape'], string, number]> = [
    ['triangle', '#EF5DA8', 4], ['star', '#5AC77D', 4],
    ['rectangle', '#F2C94C', 2], ['circle', '#2F80ED', 2],
    ['heart', '#EB5757', 4], ['pentagon', '#9B51E0', 4],
  ];
  const labels: Record<FigureOption['shape'], string> = { circle: '●', rectangle: '■', star: '★', pentagon: '⬟', heart: '♥', triangle: '▲' };
  const options = groups.flatMap(([shape, color, count]) => Array.from({ length: count }, (_, id) => {
    const reverse = shape !== 'circle' && shape !== 'rectangle' && id % 2 === 1;
    return { shape, id: `${shape}-${id}`, color, label: labels[shape], asset: `ic_${shape}${reverse ? '_reverse' : ''}.svg` };
  }));
  return {
    questionName: ['분홍색을 모두 선택하세요', '노란색을 모두 선택하세요', '초록색을 모두 선택하세요', '파란색을 모두 선택하세요', '빨간색을 모두 선택하세요', '보라색을 모두 선택하세요', '별 모양 도형을 모두 선택하세요', '원 모양 도형을 모두 선택하세요', '삼각 모양 도형을 모두 선택하세요', '사각 모양 도형을 모두 선택하세요', '오각 모양 도형을 모두 선택하세요', '하트 모양 도형을 모두 선택하세요'][Math.floor(Math.random() * 12)],
    options: options.sort(() => Math.random() - 0.5),
  };
}

export function getEmotionAnswers(): string[] {
  return ['행복', '슬픔', '화남', '놀람', '공포', '혐오', '중립'];
}
