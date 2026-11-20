export interface JudgeItem {
  imageName: string;
  isLiving: boolean;
}

export interface DistinctionItem {
  imageName: string;
  answer: '똑같음' | '비슷함' | '처음 봄';
}

export interface PracticeItem {
  imageName: string;
  answer: string;
}

export interface PracticeAnswerItem {
  imageName: string;
  correctImageName: string;
  answer: string;
}

export const JUDGE_DATA: JudgeItem[] = [
  { imageName: 'a1_a', isLiving: true }, { imageName: 'a13_a', isLiving: true },
  { imageName: 'a20_a', isLiving: false }, { imageName: 'a30_a', isLiving: false },
  { imageName: 'a35_a', isLiving: true }, { imageName: 'a36_a', isLiving: true },
  { imageName: 'a37_a', isLiving: true }, { imageName: 'b2_a', isLiving: false },
  { imageName: 'b3_a', isLiving: true }, { imageName: 'b24_a', isLiving: true },
  { imageName: 'b26_a', isLiving: false }, { imageName: 'b33_a', isLiving: true },
  { imageName: 'b40_a', isLiving: true }, { imageName: 'b48_a', isLiving: false },
  { imageName: 'c18_a', isLiving: true }, { imageName: 'c21_a', isLiving: false },
  { imageName: 'c23_a', isLiving: false }, { imageName: 'c24_a', isLiving: false },
  { imageName: 'c32_a', isLiving: false }, { imageName: 'c33_a', isLiving: true },
  { imageName: 'c37_a', isLiving: true }, { imageName: 'c57_a', isLiving: false },
  { imageName: 'd11_b', isLiving: false }, { imageName: 'd13_b', isLiving: false },
  { imageName: 'd15_a', isLiving: true }, { imageName: 'd24_b', isLiving: false },
  { imageName: 'd26_b', isLiving: false }, { imageName: 'd27_b', isLiving: false },
  { imageName: 'd29_a', isLiving: false }, { imageName: 'd36_a', isLiving: false },
  { imageName: 'd43_b', isLiving: false }, { imageName: 'd49_b', isLiving: false },
];

export const PRACTICE_FAKE_DATA: PracticeItem[] = [
  { imageName: 'b6_a', answer: '무생물' },
  { imageName: 'c6_b', answer: '생물' },
  { imageName: 'b8_a', answer: '생물' },
  { imageName: 'a32_a', answer: '무생물' },
];

export const PRACTICE_REAL_DATA: PracticeItem[] = [
  { imageName: 'c6_b', answer: '똑같음' },
  { imageName: 'b6_b', answer: '비슷함' },
  { imageName: 'b8_b', answer: '비슷함' },
  { imageName: 'c3_b', answer: '처음 봄' },
];

export const PRACTICE_REAL_CORRECT_IMAGES: Record<string, string> = {
  'c6_b': 'c6_b',
  'b6_b': 'b6_a',
  'b8_b': 'b8_a',
  'c3_b': 'a32_a',
};

export const DISTINCTION_DATA: DistinctionItem[] = [
  { imageName: 'd11_b', answer: '똑같음' }, { imageName: 'd13_b', answer: '똑같음' },
  { imageName: 'd15_a', answer: '똑같음' }, { imageName: 'd24_b', answer: '똑같음' },
  { imageName: 'd26_b', answer: '똑같음' }, { imageName: 'd27_b', answer: '똑같음' },
  { imageName: 'd29_a', answer: '똑같음' }, { imageName: 'd36_a', answer: '똑같음' },
  { imageName: 'd43_b', answer: '똑같음' }, { imageName: 'd49_b', answer: '똑같음' },
  { imageName: 'a1_b', answer: '비슷함' }, { imageName: 'a13_b', answer: '비슷함' },
  { imageName: 'a20_b', answer: '비슷함' }, { imageName: 'a30_b', answer: '비슷함' },
  { imageName: 'a35_b', answer: '비슷함' }, { imageName: 'a36_b', answer: '비슷함' },
  { imageName: 'a37_b', answer: '비슷함' }, { imageName: 'b2_b', answer: '비슷함' },
  { imageName: 'b3_b', answer: '비슷함' }, { imageName: 'b24_b', answer: '비슷함' },
  { imageName: 'b26_b', answer: '비슷함' }, { imageName: 'b33_b', answer: '비슷함' },
  { imageName: 'b40_b', answer: '비슷함' }, { imageName: 'b48_b', answer: '비슷함' },
  { imageName: 'c18_b', answer: '비슷함' }, { imageName: 'c21_b', answer: '비슷함' },
  { imageName: 'c23_b', answer: '비슷함' }, { imageName: 'c24_b', answer: '비슷함' },
  { imageName: 'c32_b', answer: '비슷함' }, { imageName: 'c33_b', answer: '비슷함' },
  { imageName: 'c37_b', answer: '비슷함' }, { imageName: 'c57_b', answer: '비슷함' },
  { imageName: 'e3', answer: '처음 봄' }, { imageName: 'e4', answer: '처음 봄' },
  { imageName: 'e6', answer: '처음 봄' }, { imageName: 'e8', answer: '처음 봄' },
  { imageName: 'e9', answer: '처음 봄' }, { imageName: 'e16', answer: '처음 봄' },
  { imageName: 'e18', answer: '처음 봄' }, { imageName: 'e21', answer: '처음 봄' },
  { imageName: 'e24', answer: '처음 봄' }, { imageName: 'e35', answer: '처음 봄' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getShuffledJudgeData(): JudgeItem[] { return shuffle(JUDGE_DATA); }
export function getShuffledDistinctionData(): DistinctionItem[] { return shuffle(DISTINCTION_DATA); }
export function mstImageUrl(name: string): string { return `/assets/mst/${name}.png`; }
