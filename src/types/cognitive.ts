export interface SubTestInfo {
  testId: string | null;
  testName: string | null;
  testCode: string | null;
  testDuration: string | null;
  testDescription: string | null;
  testSeq: number | null;
  testProgress: number | null;
  subTestList: SubSubTestInfo[] | null;
}

export interface SubSubTestInfo {
  testId: string | null;
  testName: string | null;
  testCode: string | null;
  testDuration: string | null;
  testDescription: string | null;
  testSeq: number | null;
  testProgress: number | null;
}

export interface ResSubTestList {
  code: string;
  result: string | null;
  message: string | null;
  count: number | null;
  rows: SubTestInfo[];
}

export interface CognitiveTestResult {
  question: string;
  userAnswer: string | null;
  isCorrect: boolean | null;
  responseTime: number;
}

export interface ReqCognitiveTestResult {
  testResultList: CognitiveTestResult[] | null;
}

export interface ResCognitiveTestResult {
  nextTestId: string | null;
}

export type SubTestCode = 'VPA' | 'MST' | 'SPS' | 'FER';

export interface TestStartResponse {
  code: string;
  message?: string;
}
