import axios from 'axios';
import { ResSubTestList, SubTestInfo, ReqCognitiveTestResult, ResCognitiveTestResult, TestStartResponse } from '../types/cognitive';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Mock data (used when BASE_URL is not set or when request fails) ──────────

function sub(id: string, name: string, code: string, desc: string, dur: string | null, hasSubs = false): SubTestInfo {
  return {
    testId: id, testName: name, testCode: code,
    testDescription: desc, testDuration: dur,
    testSeq: null, testProgress: 0,
    subTestList: hasSubs ? [{ testId: null, testName: '쉬는 시간', testCode: null, testDuration: '05:00', testDescription: null, testSeq: null, testProgress: null }] : null,
  };
}

const MOCK_CA01: SubTestInfo[] = [
  sub('mock-vpa', '단어 연합 기억 검사', 'VPA', '새로운 정보를 학습하고 기억하는 능력', null),
  sub('mock-mst', '유사성 기억 변별 검사', 'MST', '기억의 세부사항을 구분하는 능력', null),
  sub('mock-sps', '공간 패턴 변별 검사', 'SPS', '공간적 정보를 기억하고 사용하는 능력', null),
  sub('mock-fer', '얼굴 표정 인식 검사', 'FER', '사회적 상호작용에 중요한 결정 인식 능력', null),
];

const MOCK_VPA: SubTestInfo[] = [
  sub('mock-vpa-learning', '학습', 'LEARNING', '주어진 단어 쌍 외우기', '1분'),
  {
    testId: 'mock-vpa-immediate', testName: '즉각회상 1~3', testCode: 'IM_REC',
    testDescription: '학습한 단어 쌍 기억 인출하기', testDuration: '15분',
    testSeq: null, testProgress: 0,
    subTestList: [
      { testId: 'mock-vpa-imm-1', testName: '즉각회상 1', testCode: 'IM_REC_1', testDuration: null, testDescription: null, testSeq: null, testProgress: 0 },
      { testId: 'mock-vpa-imm-2', testName: '즉각회상 2', testCode: 'IM_REC_2', testDuration: null, testDescription: null, testSeq: null, testProgress: 0 },
      { testId: 'mock-vpa-imm-3', testName: '즉각회상 3', testCode: 'IM_REC_3', testDuration: null, testDescription: null, testSeq: null, testProgress: 0 },
    ],
  },
  sub('mock-vpa-delay', '지연', 'DELAY', '5분간 짧은 소과제 수행하기', '5분'),
  sub('mock-vpa-jaein', '재인', 'REPRODUCTION', '단서 기반 단어 쌍 기억 인출하기', '5분'),
];

const MOCK_MST: SubTestInfo[] = [
  sub('mock-mst-judge', '범주 지각 및 판단', 'CAT_PERC_JUDG', '주어진 대상 생물/무생물 범주로 분류하기', '1분'),
  sub('mock-mst-practice', '연습시행', 'PRACTICE', '유사성 변별 과제 수행을 위한 사전연습하기', null),
  sub('mock-mst-distinction', '유사성 변별', 'SIM_ASMT', '일화기억을 토대로 주어진 대상의 유사성 변별하기', '15분'),
];

const MOCK_FER: SubTestInfo[] = [
  sub('mock-fer-01', '얼굴 표정 정서 읽기1', 'FER1', '5분 내에 시작해 주세요!', null),
  sub('mock-fer-02', '얼굴 표정 정서 읽기2', 'FER2', '정서읽기 1을 완료해야 활성화됩니다.', null),
];

const MOCK_SPS: SubTestInfo[] = [
  sub('mock-sps-01', '공간 패턴 분리 및 완성', 'SPS1', '제시되는 회색 원 도형의 위치로 기억한 다음, 계산 과제 수행 후에 회색 원이 있었던 위치에 대응하는 원의 색상을 선택해 주세요.', '15분'),
];

function mockSubTestList(testId: string): ResSubTestList {
  let rows: SubTestInfo[] = [];
  if (testId === 'CA01') rows = MOCK_CA01;
  else if (testId.startsWith('mock-vpa')) rows = MOCK_VPA;
  else if (testId.startsWith('mock-mst')) rows = MOCK_MST;
  else if (testId.startsWith('mock-sps')) rows = MOCK_SPS;
  else if (testId.startsWith('mock-fer')) rows = MOCK_FER;
  return { code: '200', result: 'SUCCESS', message: null, count: rows.length, rows };
}

const USE_MOCK = !BASE_URL;

async function withMockFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (USE_MOCK) return fallback;
  try { return await fn(); } catch { return fallback; }
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const cognitiveApi = {
  getSubTestList: (testId: string): Promise<ResSubTestList> =>
    withMockFallback(
      () => api.get(`/v1/api/common/cognitive/test/${testId}/subTest`).then(r => r.data),
      mockSubTestList(testId),
    ),

  startTest: (testId: string): Promise<TestStartResponse> =>
    withMockFallback(
      () => api.post(`/v1/api/common/cognitive/test/${testId}/start`).then(r => r.data),
      { code: '200' },
    ),

  submitResult: (testId: string, body: ReqCognitiveTestResult): Promise<ResCognitiveTestResult> =>
    withMockFallback(
      () => api.post(`/v1/api/common/cognitive/test/${testId}/execution`, body).then(r => r.data),
      { nextTestId: null },
    ),

  submitTimeout: (testId: string): Promise<void> =>
    withMockFallback(
      () => api.post(`/v1/api/common/cognitive/test/${testId}/timeout`).then(r => r.data),
      undefined,
    ),
};
