export interface FacialItem {
  imageName: string;
  emotionName: string;
  sex: '남자' | '여자';
  durationMs: number;
}

const rawFacialData: Omit<FacialItem, 'durationMs'>[] = [
  { imageName: 'ew_dis_40', emotionName: '혐오', sex: '남자' },
  { imageName: 'ew_dis_60', emotionName: '혐오', sex: '남자' },
  { imageName: 'ew_dis_80', emotionName: '혐오', sex: '남자' },
  { imageName: 'ew_dis_100', emotionName: '혐오', sex: '남자' },
  { imageName: 'ew_fea_40', emotionName: '공포', sex: '남자' },
  { imageName: 'ew_fea_60', emotionName: '공포', sex: '남자' },
  { imageName: 'ew_fea_80', emotionName: '공포', sex: '남자' },
  { imageName: 'ew_fea_100', emotionName: '공포', sex: '남자' },
  { imageName: 'ew_sad_40', emotionName: '슬픔', sex: '남자' },
  { imageName: 'ew_sad_60', emotionName: '슬픔', sex: '남자' },
  { imageName: 'ew_sad_80', emotionName: '슬픔', sex: '남자' },
  { imageName: 'ew_sad_100', emotionName: '슬픔', sex: '남자' },
  { imageName: 'jh_con_40', emotionName: '경멸', sex: '남자' },
  { imageName: 'jh_con_60', emotionName: '경멸', sex: '남자' },
  { imageName: 'jh_con_80', emotionName: '경멸', sex: '남자' },
  { imageName: 'jh_con_100', emotionName: '경멸', sex: '남자' },
  { imageName: 'jh_sur_40', emotionName: '놀람', sex: '남자' },
  { imageName: 'jh_sur_60', emotionName: '놀람', sex: '남자' },
  { imageName: 'jh_sur_80', emotionName: '놀람', sex: '남자' },
  { imageName: 'jh_sur_100', emotionName: '놀람', sex: '남자' },
  { imageName: 'jm_ang_40', emotionName: '분노', sex: '남자' },
  { imageName: 'jm_ang_60', emotionName: '분노', sex: '남자' },
  { imageName: 'jm_ang_80', emotionName: '분노', sex: '남자' },
  { imageName: 'jm_ang_100', emotionName: '분노', sex: '남자' },
  { imageName: 'jm_hap_40', emotionName: '행복', sex: '남자' },
  { imageName: 'jm_hap_60', emotionName: '행복', sex: '남자' },
  { imageName: 'jm_hap_80', emotionName: '행복', sex: '남자' },
  { imageName: 'jm_hap_100', emotionName: '행복', sex: '남자' },
  { imageName: 'sj_dis_40', emotionName: '혐오', sex: '여자' },
  { imageName: 'sj_dis_60', emotionName: '혐오', sex: '여자' },
  { imageName: 'sj_dis_80', emotionName: '혐오', sex: '여자' },
  { imageName: 'sj_dis_100', emotionName: '혐오', sex: '여자' },
  { imageName: 'sj_fea_40', emotionName: '공포', sex: '여자' },
  { imageName: 'sj_fea_60', emotionName: '공포', sex: '여자' },
  { imageName: 'sj_fea_80', emotionName: '공포', sex: '여자' },
  { imageName: 'sj_fea_100', emotionName: '공포', sex: '여자' },
  { imageName: 'sj_sad_40', emotionName: '슬픔', sex: '여자' },
  { imageName: 'sj_sad_60', emotionName: '슬픔', sex: '여자' },
  { imageName: 'sj_sad_80', emotionName: '슬픔', sex: '여자' },
  { imageName: 'sj_sad_100', emotionName: '슬픔', sex: '여자' },
  { imageName: 'sr_hap_40', emotionName: '행복', sex: '여자' },
  { imageName: 'sr_hap_60', emotionName: '행복', sex: '여자' },
  { imageName: 'sr_hap_80', emotionName: '행복', sex: '여자' },
  { imageName: 'sr_hap_100', emotionName: '행복', sex: '여자' },
  { imageName: 'sr_sur_40', emotionName: '놀람', sex: '여자' },
  { imageName: 'sr_sur_60', emotionName: '놀람', sex: '여자' },
  { imageName: 'sr_sur_80', emotionName: '놀람', sex: '여자' },
  { imageName: 'sr_sur_100', emotionName: '놀람', sex: '여자' },
  { imageName: 'yj_ang_40', emotionName: '분노', sex: '여자' },
  { imageName: 'yj_ang_60', emotionName: '분노', sex: '여자' },
  { imageName: 'yj_ang_80', emotionName: '분노', sex: '여자' },
  { imageName: 'yj_ang_100', emotionName: '분노', sex: '여자' },
  { imageName: 'yj_con_40', emotionName: '경멸', sex: '여자' },
  { imageName: 'yj_con_60', emotionName: '경멸', sex: '여자' },
  { imageName: 'yj_con_80', emotionName: '경멸', sex: '여자' },
  { imageName: 'yj_con_100', emotionName: '경멸', sex: '여자' },
];

function getDuration(imageName: string): number {
  if (imageName.includes('_40')) return 2000;
  if (imageName.includes('_60')) return 2600;
  if (imageName.includes('_80')) return 3200;
  return 3800;
}

const FACIAL_DATA: FacialItem[] = rawFacialData.map(d => ({ ...d, durationMs: getDuration(d.imageName) }));

function pickNext(remaining: FacialItem[], lastEmotion: string, lastSex: string): FacialItem {
  const candidates = remaining.filter(d => d.emotionName !== lastEmotion && d.sex !== lastSex);
  const pool = candidates.length > 0 ? candidates : remaining;
  return pool[Math.floor(Math.random() * pool.length)];
}

function shuffleWithConstraints(data: FacialItem[]): FacialItem[] {
  const result: FacialItem[] = [];
  let remaining = [...data];
  let lastEmotion = '';
  let lastSex = '';

  while (remaining.length > 0) {
    const selected = pickNext(remaining, lastEmotion, lastSex);
    result.push(selected);
    remaining = remaining.filter(d => d !== selected);
    lastEmotion = selected.emotionName;
    lastSex = selected.sex;
  }
  return result;
}

export function getShuffledFacialData(): FacialItem[] {
  return shuffleWithConstraints(FACIAL_DATA);
}

export function ferImageUrl(name: string): string {
  return `/assets/fer/${name}.gif`;
}

export const EMOTION_LABELS = ['행복', '슬픔', '분노', '경멸', '공포', '혐오', '놀람'];
