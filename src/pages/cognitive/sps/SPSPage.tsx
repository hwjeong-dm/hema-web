import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cognitiveApi } from '../../../api/cognitive';
import { CognitiveTestResult } from '../../../types/cognitive';
import {
  getPatternList, getCalculateData, getRandomCircleHorizontalBias, getRandomCircleDirection,
  PatternData, CalculateData,
} from '../../../utils/spsData';
import ProgressBar from '../../../components/common/ProgressBar';
import Modal from '../../../components/common/Modal';

type Phase = 'intro' | 'explain' | 'focus' | 'question' | 'calculate' | 'answer' | 'complete';

const QUESTION_MS = 5000;
const CALCULATE_MS = 10000;
const ANSWER_MS = 10000;
const TOTAL_QUESTIONS = 32;

interface CirclePosition { bias: number }
interface AnswerChoice { isOriginal: boolean; color: 'blue' | 'red'; offsetPx: number }

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const centis = Math.floor((ms % 1000) / 10);
  return `${String(s).padStart(2, '0')}:${String(centis).padStart(2, '0')}`;
}

function LandscapePrompt() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#1a1a2e',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24,
    }}>
      <div style={{ fontSize: 72, animation: 'rotateHint 2s ease-in-out infinite' }}>📱</div>
      <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.5 }}>
        기기를 가로로 돌려주세요
      </div>
      <div style={{ fontSize: 'var(--fs-base)', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
        공간 패턴 검사는 가로 모드에서만 진행됩니다
      </div>
      <style>{`
        @keyframes rotateHint {
          0%   { transform: rotate(0deg); }
          30%  { transform: rotate(90deg); }
          70%  { transform: rotate(90deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
}

export default function SPSPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { testId: string } };
  const testId = state?.testId;

  const [isPortrait, setIsPortrait] = useState(() => window.innerHeight > window.innerWidth);

  useEffect(() => {
    const check = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  const [phase, setPhase] = useState<Phase>('intro');
  const [explainStep, setExplainStep] = useState(1);
  const [currentQ, setCurrentQ] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [circlePos, setCirclePos] = useState<CirclePosition>({ bias: 0.5 });
  const [calcData, setCalcData] = useState<CalculateData | null>(null);
  const [shuffledAnswers, setShuffledAnswers] = useState<number[]>([]);
  const [answerChoices, setAnswerChoices] = useState<AnswerChoice[]>([]);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const patternList = useRef<PatternData[]>(getPatternList());
  const testResults = useRef<CognitiveTestResult[]>([]);
  const startTime = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const calculateStep = useRef(1);
  const correctAttempts = useRef(0);
  const currentCalc = useRef<CalculateData | null>(null);
  const currentQRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback((durationMs: number, onFinish: () => void) => {
    clearTimer();
    setRemaining(durationMs);
    const end = performance.now() + durationMs;
    timerRef.current = setInterval(() => {
      const left = Math.max(0, end - performance.now());
      setRemaining(left);
      if (left <= 0) {
        clearTimer();
        onFinish();
      }
    }, 16);
  }, [clearTimer]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const updateCalculateStep = useCallback((correct: boolean) => {
    correctAttempts.current += correct ? 1 : -1;
    if (correctAttempts.current >= 3) {
      calculateStep.current = Math.min(calculateStep.current + 1, 5);
      correctAttempts.current = 0;
    } else if (correctAttempts.current <= -3) {
      calculateStep.current = Math.max(calculateStep.current - 1, 1);
      correctAttempts.current = 0;
    }
  }, []);

  const submitResults = useCallback(async () => {
    try {
      await cognitiveApi.submitResult(testId, { testResultList: testResults.current });
      setPhase('complete');
    } catch {
      setErrorModal('결과 제출 중 오류가 발생했습니다.');
    }
  }, [testId]);

  const beginFocusPhase = useCallback(() => {
    setPhase('focus');
  }, []);

  const goNextQuestion = useCallback(() => {
    clearTimer();
    const next = currentQRef.current + 1;
    if (next >= TOTAL_QUESTIONS) {
      submitResults();
    } else {
      currentQRef.current = next;
      setCurrentQ(next);
      beginFocusPhase();
    }
  }, [clearTimer, submitResults, beginFocusPhase]);

  const beginAnswerPhase = useCallback((bias: number, data: PatternData) => {
    clearTimer();
    const dir = getRandomCircleDirection();
    const offsetPx = data.circleDistance === 0 ? 0 : Math.round(data.circleDistance * 120);
    const blueIsOriginal = Math.random() < 0.5;
    const choices: AnswerChoice[] = ([
      { isOriginal: blueIsOriginal, color: 'blue' as const, offsetPx: dir === 1 ? offsetPx : 0 },
      { isOriginal: !blueIsOriginal, color: 'red' as const, offsetPx: dir === 1 ? 0 : offsetPx },
    ] as AnswerChoice[]).sort(() => Math.random() - 0.5);
    setAnswerChoices(choices);
    setCirclePos({ bias });
    startTime.current = performance.now();
    setPhase('answer');
    startTimer(ANSWER_MS, () => {
      const q = patternList.current[currentQRef.current];
      testResults.current.push({ question: q.question, userAnswer: null, isCorrect: null, responseTime: 10.0 });
      goNextQuestion();
    });
  }, [clearTimer, startTimer, goNextQuestion]);

  const beginCalculatePhase = useCallback((bias: number) => {
    const cd = getCalculateData(calculateStep.current);
    currentCalc.current = cd;
    setCalcData(cd);
    const opts = [cd.answer, cd.answer - 5, cd.answer + 5].sort(() => Math.random() - 0.5);
    setShuffledAnswers(opts);
    setCirclePos({ bias });
    startTime.current = performance.now();
    setPhase('calculate');
    startTimer(CALCULATE_MS, () => {
      const q = patternList.current[currentQRef.current];
      testResults.current.push({ question: cd.question, userAnswer: null, isCorrect: false, responseTime: 10.0 });
      updateCalculateStep(false);
      beginAnswerPhase(bias, q);
    });
  }, [startTimer, updateCalculateStep, beginAnswerPhase]);

  const beginQuestionPhase = useCallback(() => {
    const bias = getRandomCircleHorizontalBias();
    setCirclePos({ bias });
    startTime.current = performance.now();
    setPhase('question');
    startTimer(QUESTION_MS, () => beginCalculatePhase(bias));
  }, [startTimer, beginCalculatePhase]);

  const handleCalculateAnswer = (chosen: number) => {
    clearTimer();
    const cd = currentCalc.current!;
    const isCorrect = chosen === cd.answer;
    const rt = parseFloat(((performance.now() - startTime.current) / 1000).toFixed(3));
    testResults.current.push({ question: cd.question, userAnswer: String(chosen), isCorrect, responseTime: rt });
    updateCalculateStep(isCorrect);
    beginAnswerPhase(circlePos.bias, patternList.current[currentQRef.current]);
  };

  const handleAnswerChoice = (choice: AnswerChoice) => {
    clearTimer();
    const rt = parseFloat(((performance.now() - startTime.current) / 1000).toFixed(3));
    const q = patternList.current[currentQRef.current];
    testResults.current.push({ question: q.question, userAnswer: choice.color, isCorrect: choice.isOriginal, responseTime: rt });
    goNextQuestion();
  };

  if (isPortrait && phase !== 'intro' && phase !== 'explain') {
    return <LandscapePrompt />;
  }

  if (phase === 'intro') {
    return (
      <div style={{ height: '100vh', background: '#F2F4F6' }}>
        <Modal
          title="안내사항"
          message={"공간 패턴 분리 및 완성은 약 15분 소요됩니다.\n모든 검사를 완료해야 검사 결과를 확인하실 수 있습니다.\n\n쉬지 않고 바로 실시하는 것을 권고드립니다."}
          confirmLabel="확인"
          onConfirm={() => setPhase('explain')}
        />
      </div>
    );
  }

  if (phase === 'explain') {
    return (
      <ExplainScreen
        step={explainStep}
        onNext={() => setExplainStep(s => s + 1)}
        onPrev={() => { if (explainStep === 1) navigate(-1); else setExplainStep(s => s - 1); }}
        onStart={() => setPhase('focus')}
      />
    );
  }

  if (phase === 'focus') {
    return (
      <div style={{ ...fullPageStyle, alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--fs-4xl)', marginBottom: 24 }}>👁️</div>
          <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, marginBottom: 12 }}>화면을 집중해 주세요</div>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--color-text-secondary)', marginBottom: 40 }}>
            {currentQ + 1} / {TOTAL_QUESTIONS}번 문항
          </div>
          <button
            style={{ padding: '16px 48px', borderRadius: 12, background: 'var(--color-primary)', color: '#fff', fontSize: 'var(--fs-title)', fontWeight: 700, boxShadow: 'var(--shadow-btn)' }}
            onClick={beginQuestionPhase}
          >준비 완료</button>
        </div>
      </div>
    );
  }

  if (phase === 'question') {
    return (
      <div style={{ ...fullPageStyle, flexDirection: 'column', background: '#fff' }}>
        <TopBar label={`${currentQ + 1} / ${TOTAL_QUESTIONS}`} />
        <div style={{ padding: '0 32px 16px' }}>
          <div style={{ marginBottom: 6, fontSize: 'var(--fs-sm)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>{formatTime(remaining)}</div>
          <ProgressBar value={remaining} max={QUESTION_MS} color="var(--color-primary)" />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'relative', width: '80%', height: 120, border: '2px dashed #E0E5EC', borderRadius: 12 }}>
            <div style={{
              position: 'absolute', top: '50%', transform: 'translateY(-50%)',
              left: `calc(${circlePos.bias * 100}% - 24px)`,
              width: 48, height: 48, borderRadius: '50%',
              background: '#4A90D9', boxShadow: '0 4px 16px rgba(74,144,217,0.4)',
            }} />
          </div>
        </div>
        <div style={{ padding: '16px 32px', textAlign: 'center', fontSize: 'var(--fs-label)', color: 'var(--color-text-secondary)' }}>
          원의 위치를 기억하세요
        </div>
      </div>
    );
  }

  if (phase === 'calculate' && calcData) {
    return (
      <div style={{ ...fullPageStyle, flexDirection: 'column', background: '#fff' }}>
        <TopBar label={`${currentQ + 1} / ${TOTAL_QUESTIONS}`} />
        <div style={{ padding: '0 32px 16px' }}>
          <div style={{ marginBottom: 6, fontSize: 'var(--fs-sm)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>{formatTime(remaining)}</div>
          <ProgressBar value={remaining} max={CALCULATE_MS} color="var(--color-warning)" />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
          <div style={{ fontSize: 'var(--fs-4xl)', fontWeight: 800, color: 'var(--color-text-primary)' }}>{calcData.question} = ?</div>
          <div style={{ display: 'flex', gap: 20 }}>
            {shuffledAnswers.map((ans, i) => (
              <button key={i} onClick={() => handleCalculateAnswer(ans)} style={calcBtnStyle}>{ans}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'answer') {
    return (
      <div style={{ ...fullPageStyle, flexDirection: 'column', background: '#fff' }}>
        <TopBar label={`${currentQ + 1} / ${TOTAL_QUESTIONS}`} />
        <div style={{ padding: '0 32px 16px' }}>
          <div style={{ marginBottom: 6, fontSize: 'var(--fs-sm)', color: 'var(--color-text-secondary)', textAlign: 'right' }}>{formatTime(remaining)}</div>
          <ProgressBar value={remaining} max={ANSWER_MS} color="var(--color-error)" />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
          <div style={{ fontSize: 'var(--fs-body)', color: 'var(--color-text-secondary)' }}>처음에 본 원과 같은 위치의 원을 선택하세요</div>
          <div style={{ position: 'relative', width: '80%', height: 140, border: '2px dashed #E0E5EC', borderRadius: 12 }}>
            {answerChoices.map((choice, i) => (
              <div
                key={i}
                onClick={() => handleAnswerChoice(choice)}
                style={{
                  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                  // At distance 0 Android places both circles at the same
                  // coordinate. On the web that makes one circle disappear
                  // behind the other, so separate only this visual case.
                  left: `calc(${circlePos.bias * 100}% - 24px + ${choice.offsetPx === 0 ? (choice.color === 'red' ? 28 : -28) : choice.offsetPx}px)`,
                  width: 48, height: 48, borderRadius: '50%',
                  background: choice.color === 'blue' ? '#4A90D9' : '#E74C3C',
                  border: choice.color === 'red' ? '2px solid #B42318' : '2px solid #2365CC',
                  cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {answerChoices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleAnswerChoice(choice)}
                style={{ ...calcBtnStyle, background: choice.color === 'blue' ? '#4A90D9' : '#E74C3C', color: '#fff' }}
              >
                {choice.color === 'blue' ? '파란 원' : '빨간 원'}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div style={{ ...fullPageStyle, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24, background: '#fff' }}>
        <div style={{ fontSize: 'var(--fs-5xl)' }}>✅</div>
        <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700 }}>공간 패턴 분리 완료!</div>
        <div style={{ fontSize: 'var(--fs-base)', color: 'var(--color-text-secondary)' }}>총 {TOTAL_QUESTIONS}문항을 완료했습니다.</div>
        <button
          style={{ padding: '16px 48px', borderRadius: 12, background: 'var(--color-primary)', color: '#fff', fontSize: 'var(--fs-title)', fontWeight: 700, boxShadow: 'var(--shadow-btn)' }}
          onClick={() => navigate('/cognitive')}
        >검사 목록으로</button>
      </div>
    );
  }

  return (
    <>
      {errorModal && <Modal title="오류" message={errorModal} onConfirm={() => setErrorModal(null)} />}
    </>
  );
}

function TopBar({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ fontSize: 'var(--fs-label)', fontWeight: 700, color: 'var(--color-primary)' }}>SPS · 공간 패턴 분리</span>
      <span style={{ fontSize: 'var(--fs-label)', color: 'var(--color-text-secondary)' }}>{label}</span>
    </div>
  );
}

function ExplainScreen({ step, onNext, onPrev, onStart }: {
  step: number; onNext: () => void; onPrev: () => void; onStart: () => void;
}) {
  const explains = [
    { title: '검사 소개', content: '화면에 원이 표시됩니다.\n원의 위치를 기억하세요.', icon: '⭕' },
    { title: '계산 문제', content: '원이 사라진 후 계산 문제가 나타납니다.\n정답을 선택하세요.', icon: '🔢' },
    { title: '위치 선택', content: '두 개의 원이 나타납니다.\n처음 본 원과 같은 위치의 원을 선택하세요.', icon: '🎯' },
    { title: '준비 완료', content: '총 32문항이 진행됩니다.\n천천히 집중해서 진행해 주세요.', icon: '✅' },
  ];
  const ex = explains[step - 1];
  return (
    <div style={{ ...fullPageStyle, flexDirection: 'column', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--color-border)' }}>
        <button onClick={onPrev} style={{ background: 'none', fontSize: 'var(--fs-lg)', padding: 8 }}>←</button>
        <span style={{ marginLeft: 12, fontSize: 'var(--fs-body)', fontWeight: 700 }}>공간 패턴 분리 설명 ({step}/4)</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: '0 48px' }}>
        <div style={{ fontSize: 'var(--fs-countdown)' }}>{ex.icon}</div>
        <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800 }}>{ex.title}</div>
        <div style={{ fontSize: 'var(--fs-body)', color: 'var(--color-text-secondary)', textAlign: 'center', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{ex.content}</div>
      </div>
      <div style={{ padding: '24px 32px', display: 'flex', gap: 16 }}>
        {step < 4
          ? <button style={primaryBtnStyle} onClick={onNext}>다음</button>
          : <button style={primaryBtnStyle} onClick={onStart}>검사 시작</button>
        }
      </div>
    </div>
  );
}

const fullPageStyle: React.CSSProperties = { height: '100vh', display: 'flex', background: 'var(--color-bg)' };

const calcBtnStyle: React.CSSProperties = {
  padding: '20px 36px', borderRadius: 16,
  background: '#F0F4F8', fontSize: 'var(--fs-xl)', fontWeight: 700,
  color: 'var(--color-text-primary)', border: '2px solid var(--color-border)', minWidth: 120,
};

const primaryBtnStyle: React.CSSProperties = {
  flex: 1, padding: '16px 0', borderRadius: 12,
  background: 'var(--color-primary)', color: '#fff',
  fontSize: 'var(--fs-md)', fontWeight: 700, boxShadow: 'var(--shadow-btn)',
};
