import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cognitiveApi } from '../../../api/cognitive';
import { SubTestInfo } from '../../../types/cognitive';
import {
  getShuffledJudgeData, getShuffledDistinctionData,
  PRACTICE_FAKE_DATA, PRACTICE_REAL_DATA, PRACTICE_REAL_CORRECT_IMAGES,
  mstImageUrl, JudgeItem, DistinctionItem,
} from '../../../utils/mstData';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import Modal from '../../../components/common/Modal';

type SubView = 'list' | 'judge' | 'practice' | 'distinction';

// ─── Shared styles ────────────────────────────────────────────────────────────

const headerStyle: React.CSSProperties = {
  height: 56, flexShrink: 0, background: '#fff',
  display: 'flex', alignItems: 'center',
  borderBottom: '1px solid #E5E8EB', position: 'relative',
};

function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={headerStyle}>
      <button onClick={onBack} style={{ padding: 10, position: 'absolute', left: 0 }}>
        <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
          <path d="M9 1L1 9L9 17" stroke="#191F28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <span style={{ width: '100%', textAlign: 'center', fontSize: 'var(--fs-md)', fontWeight: 700, color: '#191F28' }}>
        {title}
      </span>
    </div>
  );
}

function SubTestItem({ index, data, onPress, disabled }: {
  index: number; data: SubTestInfo; onPress: () => void; disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const done = data.testProgress === 100;
  const inProgress = (data.testProgress ?? 0) > 0 && !done;
  const hasChildren = data.subTestList != null && data.subTestList.some(s => s.testId !== null);

  return (
    <div className="sub-item sub-item-card" style={{
      width: '90%', margin: '0 auto',
      background: '#fff', borderRadius: 20,
      border: `1px solid ${done ? '#E5E8EB' : '#2C74DB'}`,
      opacity: disabled && !done ? 0.6 : 1,
    }}>
      <div className="sub-item-inner" style={{ padding: '0 7%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="sub-num-badge" style={{
            borderRadius: '50%', background: '#333D4B',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, flexShrink: 0,
          }}>{index + 1}</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
            <span style={{ fontSize: 'var(--fs-sub-name)', fontWeight: 700, color: '#191F28' }}>{data.testName}</span>
            {data.testDuration && !done && (
              <span style={{ fontSize: 'var(--fs-sub-dur)', fontWeight: 600, color: inProgress ? '#2C74DB' : '#6B7684', flexShrink: 0 }}>{data.testDuration}</span>
            )}
          </div>
          <button
            className="sub-start-btn"
            onClick={() => { if (done || disabled) return; if (hasChildren) setExpanded(e => !e); else onPress(); }}
            disabled={done || disabled}
            style={{
              background: done ? '#E5E8EB' : '#2C74DB',
              color: done ? '#B0B8C1' : '#fff',
              fontSize: 'var(--fs-sub-btn)', fontWeight: 700, border: 'none', flexShrink: 0,
              cursor: done || disabled ? 'default' : 'pointer',
            }}
          >{done ? '완료' : '시작하기'}</button>
        </div>
        {!done && data.testDescription && (
          <div style={{ background: '#F9FAFB', borderRadius: 6, padding: 6, fontSize: 'var(--fs-sub-desc)', color: '#4E5968', lineHeight: 1.5 }}>
            {data.testDescription}
          </div>
        )}
        {hasChildren && expanded && data.subTestList!.filter(s => s.testId !== null).map((child, i) => {
          const childDone = child.testProgress === 100;
          return (
            <div key={child.testId ?? i} className="sub-child" style={{
              background: '#F9FAFB', borderRadius: 12,
              border: `1px solid ${childDone ? '#E5E8EB' : '#D1E4FB'}`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ flex: 1, fontSize: 'var(--fs-sub-child)', fontWeight: 600, color: '#191F28' }}>{child.testName}</span>
              <button
                className="sub-child-btn"
                onClick={!childDone ? () => onPress() : undefined}
                disabled={childDone}
                style={{
                  background: childDone ? '#E5E8EB' : '#2C74DB',
                  color: childDone ? '#B0B8C1' : '#fff',
                  fontSize: 'var(--fs-sub-cbtn)', fontWeight: 700,
                  border: 'none', flexShrink: 0,
                  cursor: childDone ? 'default' : 'pointer',
                }}
              >{childDone ? '완료' : '시작'}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Focus countdown overlay ──────────────────────────────────────────────────

function FocusOverlay({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (count <= 0) { onDone(); return; }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, onDone]);
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 999,
    }}>
      <div style={{ fontSize: 'var(--fs-title)', color: '#fff', marginBottom: 24, fontWeight: 600 }}>화면을 집중해 주세요</div>
      <div style={{ fontSize: 'var(--fs-countdown)', fontWeight: 800, color: '#fff' }}>{count === 0 ? '+' : count}</div>
    </div>
  );
}

// ─── Timer bar + countdown text ───────────────────────────────────────────────

function TimerBar({ totalMs, remainMs }: { totalMs: number; remainMs: number }) {
  const pct = (remainMs / totalMs) * 100;
  const sec = Math.floor(remainMs / 1000);
  const ms = Math.floor((remainMs % 1000) / 10);
  const secStr = String(sec).padStart(2, '0');
  const msStr = String(ms).padStart(2, '0');
  return (
    <div style={{ padding: '12px 5% 0' }}>
      <div style={{ height: 6, background: '#E5E8EB', borderRadius: 999 }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: '#2C74DB',
          borderRadius: 999, transition: 'width 0.05s linear',
        }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#868E96" strokeWidth="2"/>
          <path d="M12 7v5l3 3" stroke="#868E96" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 'var(--fs-xs)', color: '#868E96' }}>제시 시간</span>
        <span style={{ fontSize: 'var(--fs-xs)', color: '#868E96', marginLeft: 'auto' }}>
          {secStr}.{msStr}초
        </span>
      </div>
    </div>
  );
}

// ─── Main MST Page ────────────────────────────────────────────────────────────

export default function MSTPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { testId: string } };
  const testId = state?.testId;

  const [subView, setSubView] = useState<SubView>('list');
  const [subTests, setSubTests] = useState<SubTestInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [currentSubTestId, setCurrentSubTestId] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  const loadSubTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cognitiveApi.getSubTestList(testId);
      setSubTests(res.rows);
      const allDone = res.rows.every(r => r.testProgress === 100);
      if (allDone) navigate('/cognitive');
    } catch {
      setErrorModal('세부검사 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [testId, navigate]);

  useEffect(() => { loadSubTests(); }, [loadSubTests]);

  const handleSubTestPress = async (sub: SubTestInfo) => {
    if (!sub.testId) return;
    setStarting(true);
    try {
      const res = await cognitiveApi.startTest(sub.testId);
      if (res.code === '200') {
        setCurrentSubTestId(sub.testId);
        const name = sub.testName ?? '';
        let view: SubView = 'judge';
        if (name.includes('연습')) view = 'practice';
        else if (name.includes('변별')) view = 'distinction';
        setSubView(view);
      } else {
        setErrorModal(res.message || '세부검사를 시작할 수 없습니다.');
      }
    } catch {
      setErrorModal('오류가 발생했습니다.');
    } finally {
      setStarting(false);
    }
  };

  const onSubTestDone = useCallback(() => {
    setSubView('list');
    loadSubTests();
  }, [loadSubTests]);

  if (loading) return <div style={{ height: '100vh' }}><LoadingSpinner /></div>;

  if (showIntro) {
    return (
      <div style={{ height: '100vh', background: '#F2F4F6' }}>
        <Modal
          title="안내사항"
          message={"유사성 기억 변별 검사는\n총 3개의 세부 검사로 구성되어 있으며,\n모든 검사를 완료해야 검사 결과를\n확인하실 수 있습니다.\n\n각 세부 검사는 쉬지 않고\n바로 실시하는 것을 권고드립니다.\n부득이하게 쉬는 시간이 필요할 경우,\n5분 내에 세부 검사를 시작해야 합니다."}
          confirmLabel="확인"
          onConfirm={() => setShowIntro(false)}
        />
      </div>
    );
  }

  if (subView === 'judge' && currentSubTestId) {
    return <JudgeTest testId={currentSubTestId} onDone={onSubTestDone} />;
  }
  if (subView === 'practice' && currentSubTestId) {
    return <PracticeTest testId={currentSubTestId} onDone={onSubTestDone} />;
  }
  if (subView === 'distinction' && currentSubTestId) {
    return <DistinctionTest testId={currentSubTestId} onDone={onSubTestDone} />;
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F2F4F6' }}>
      <PageHeader title="유사성 기억 (MST)" onBack={() => navigate('/cognitive')} />
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
        {subTests.map((sub, idx) => (
          <SubTestItem
            key={sub.testId ?? idx}
            index={idx}
            data={sub}
            onPress={() => handleSubTestPress(sub)}
            disabled={starting}
          />
        ))}
      </div>
      {starting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <LoadingSpinner />
        </div>
      )}
      {errorModal && <Modal title="오류" message={errorModal} onConfirm={() => setErrorModal(null)} />}
    </div>
  );
}

// ─── Judge Test ───────────────────────────────────────────────────────────────

const JUDGE_TIMER_MS = 4000;

function JudgeTest({ testId, onDone }: { testId: string; onDone: () => void }) {
  const questions = useRef(getShuffledJudgeData());
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'focus' | 'question' | 'done'>('focus');
  const [remainMs, setRemainMs] = useState(JUDGE_TIMER_MS);
  const [answered, setAnswered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const results = useRef<Array<{ question: string; userAnswer: string | null; isCorrect: boolean; responseTime: number }>>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(0);

  const total = questions.current.length;

  const submitAll = useCallback(async () => {
    setSubmitting(true);
    try {
      await cognitiveApi.submitResult(testId, { testResultList: results.current });
      onDone();
    } catch {
      setErrorModal('결과 제출 오류');
      setSubmitting(false);
    }
  }, [testId, onDone]);

  const goNext = useCallback(() => {
    indexRef.current += 1;
    if (indexRef.current >= questions.current.length) {
      submitAll();
    } else {
      setIndex(indexRef.current);
      setAnswered(false);
      setRemainMs(JUDGE_TIMER_MS);
      setPhase('focus');
    }
  }, [questions, submitAll]);

  const handleTimeout = useCallback(() => {
    if (answered) return;
    const q = questions.current[indexRef.current];
    results.current.push({ question: q.imageName, userAnswer: null, isCorrect: false, responseTime: JUDGE_TIMER_MS / 1000 });
    goNext();
  }, [answered, questions, goNext]);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setRemainMs(JUDGE_TIMER_MS);
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remain = JUDGE_TIMER_MS - elapsed;
      if (remain <= 0) {
        clearInterval(timerRef.current!);
        setRemainMs(0);
        handleTimeout();
      } else {
        setRemainMs(remain);
      }
    }, 50);
  }, [handleTimeout]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleAnswer = (isLiving: boolean) => {
    if (answered) return;
    clearInterval(timerRef.current!);
    setAnswered(true);
    const rt = parseFloat(((Date.now() - startTimeRef.current) / 1000).toFixed(3));
    const q = questions.current[indexRef.current];
    const selectedText = isLiving ? '생물' : '무생물';
    results.current.push({ question: q.imageName, userAnswer: selectedText, isCorrect: isLiving === q.isLiving, responseTime: rt });
    setTimeout(goNext, 150);
  };

  const q: JudgeItem = questions.current[Math.min(index, questions.current.length - 1)];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <PageHeader title="범주 지각 및 판단" onBack={() => {}} />
      <TimerBar totalMs={JUDGE_TIMER_MS} remainMs={remainMs} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Image area */}
        <div style={{
          flex: '1 1 auto', minHeight: 0, margin: '20px 5% 12px', borderRadius: 12,
          border: '1px solid #E5E8EB', background: '#F9FAFB',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
          {phase === 'question' && (
            <img
              src={mstImageUrl(q.imageName)} alt=""
              style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
            />
          )}
        </div>

        {/* Buttons */}
        <div style={{ flexShrink: 0, padding: '0 5% 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ textAlign: 'center', fontSize: 'var(--fs-sm)', fontWeight: 700, color: '#4E5968' }}>
            이미지를 보고 생물인지 무생물인지 선택하세요
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => handleAnswer(true)}
            disabled={answered || phase !== 'question'}
            style={{
              flex: 1, height: 56, borderRadius: 12,
              background: answered ? '#E5E8EB' : '#2C74DB',
              color: answered ? '#B0B8C1' : '#fff',
              fontSize: 'var(--fs-md)', fontWeight: 700, border: 'none',
              cursor: answered || phase !== 'question' ? 'default' : 'pointer',
            }}
          >생물</button>
          <button
            onClick={() => handleAnswer(false)}
            disabled={answered || phase !== 'question'}
            style={{
              flex: 1, height: 56, borderRadius: 12,
              background: answered ? '#E5E8EB' : '#2C74DB',
              color: answered ? '#B0B8C1' : '#fff',
              fontSize: 'var(--fs-md)', fontWeight: 700, border: 'none',
              cursor: answered || phase !== 'question' ? 'default' : 'pointer',
            }}
          >무생물</button>
          </div>
        </div>

        <div style={{ textAlign: 'center', paddingBottom: 12, fontSize: 'var(--fs-sm)', color: '#8B95A1' }}>
          {index + 1} / {total}
        </div>
      </div>

      {phase === 'focus' && <FocusOverlay onDone={() => { setPhase('question'); startTimer(); }} />}
      {submitting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <LoadingSpinner />
        </div>
      )}
      {errorModal && <Modal title="오류" message={errorModal} onConfirm={() => setErrorModal(null)} />}
    </div>
  );
}

// ─── Practice Test ────────────────────────────────────────────────────────────

type PracticePhase = 'fake_focus' | 'fake_q' | 'real_focus' | 'real_q' | 'answer_show';

function PracticeTest({ testId, onDone }: { testId: string; onDone: () => void }) {
  const fakeQuestions = useRef(PRACTICE_FAKE_DATA);
  const realQuestions = useRef(PRACTICE_REAL_DATA);
  const fakeIndexRef = useRef(0);
  const realIndexRef = useRef(0);
  const [fakeIndex, setFakeIndex] = useState(0);
  const [realIndex, setRealIndex] = useState(0);
  const [phase, setPhase] = useState<PracticePhase>('fake_focus');
  const [remainMs, setRemainMs] = useState(JUDGE_TIMER_MS);
  const [feedbackCorrect, setFeedbackCorrect] = useState<boolean | null>(null);
  const [answered, setAnswered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const results = useRef<Array<{ question: string; userAnswer: string | null; isCorrect: boolean; responseTime: number }>>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(0);

  const submitAll = useCallback(async () => {
    setSubmitting(true);
    try {
      await cognitiveApi.submitResult(testId, { testResultList: results.current });
      onDone();
    } catch {
      setErrorModal('결과 제출 오류');
      setSubmitting(false);
    }
  }, [testId, onDone]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startTimer = useCallback((onExpire: () => void) => {
    startTimeRef.current = Date.now();
    setRemainMs(JUDGE_TIMER_MS);
    timerRef.current = setInterval(() => {
      const remain = JUDGE_TIMER_MS - (Date.now() - startTimeRef.current);
      if (remain <= 0) {
        clearInterval(timerRef.current!);
        setRemainMs(0);
        onExpire();
      } else {
        setRemainMs(remain);
      }
    }, 50);
  }, []);

  const goNextFake = useCallback(() => {
    fakeIndexRef.current += 1;
    if (fakeIndexRef.current >= fakeQuestions.current.length) {
      realIndexRef.current = 0;
      setRealIndex(0);
      setAnswered(false);
      setPhase('real_focus');
    } else {
      setFakeIndex(fakeIndexRef.current);
      setAnswered(false);
      setPhase('fake_focus');
    }
  }, []);

  const goNextReal = useCallback(() => {
    realIndexRef.current += 1;
    if (realIndexRef.current >= realQuestions.current.length) {
      submitAll();
    } else {
      setRealIndex(realIndexRef.current);
      setAnswered(false);
      setFeedbackCorrect(null);
      setPhase('real_focus');
    }
  }, [submitAll]);

  const handleFakeAnswer = (answer: string) => {
    if (answered) return;
    clearInterval(timerRef.current!);
    setAnswered(true);
    const q = fakeQuestions.current[fakeIndexRef.current];
    const rt = parseFloat(((Date.now() - startTimeRef.current) / 1000).toFixed(3));
    const isCorrect = answer === q.answer;
    results.current.push({ question: q.imageName, userAnswer: answer, isCorrect, responseTime: rt });
    setTimeout(goNextFake, 200);
  };

  const handleRealAnswer = (answer: string) => {
    if (answered) return;
    clearInterval(timerRef.current!);
    setAnswered(true);
    const q = realQuestions.current[realIndexRef.current];
    const rt = parseFloat(((Date.now() - startTimeRef.current) / 1000).toFixed(3));
    const isCorrect = answer === q.answer;
    results.current.push({ question: q.imageName, userAnswer: answer, isCorrect, responseTime: rt });
    setFeedbackCorrect(isCorrect);
    setPhase('answer_show');
  };

  const isFake = phase === 'fake_focus' || phase === 'fake_q';
  const currentImage = isFake
    ? fakeQuestions.current[Math.min(fakeIndex, fakeQuestions.current.length - 1)].imageName
    : realQuestions.current[Math.min(realIndex, realQuestions.current.length - 1)].imageName;
  const correctImageForReal = PRACTICE_REAL_CORRECT_IMAGES[realQuestions.current[Math.min(realIndex, realQuestions.current.length - 1)].imageName];

  const isQuestion = phase === 'fake_q' || phase === 'real_q';
  const isFocus = phase === 'fake_focus' || phase === 'real_focus';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <PageHeader title="연습시행" onBack={() => {}} />
      <TimerBar totalMs={JUDGE_TIMER_MS} remainMs={remainMs} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {phase === 'answer_show' ? (
          /* Correct answer display */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 5%' }}>
            <div style={{ fontSize: 'var(--fs-title)', fontWeight: 700, color: feedbackCorrect ? '#03B26C' : '#FC3A4A' }}>
              {feedbackCorrect ? '정답입니다!' : '오답입니다'}
            </div>
            <div style={{ fontSize: 'var(--fs-label)', color: '#6B7684' }}>정답 이미지</div>
            <div style={{
              width: '70%', aspectRatio: '1', border: '1px solid #E5E8EB',
              borderRadius: 12, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img src={mstImageUrl(correctImageForReal)} alt="" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
            </div>
            <button
              onClick={goNextReal}
              style={{
                marginTop: 16, width: '100%', height: 56, borderRadius: 12,
                background: '#2C74DB', color: '#fff', fontSize: 'var(--fs-md)', fontWeight: 700, border: 'none',
              }}
            >다음</button>
          </div>
        ) : (
          <>
            <div style={{
              flex: 1, margin: '20px 5%', borderRadius: 12,
              border: '1px solid #E5E8EB', background: '#F9FAFB',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              {isQuestion && (
                <img src={mstImageUrl(currentImage)} alt="" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
              )}
            </div>

            {isFake ? (
              <div style={{ padding: '0 5% 20px', display: 'flex', gap: 10 }}>
                {['생물', '무생물'].map(label => (
                  <button key={label} onClick={() => handleFakeAnswer(label)} disabled={answered || !isQuestion}
                    style={{ flex: 1, height: 56, borderRadius: 12, background: answered ? '#E5E8EB' : '#2C74DB', color: answered ? '#B0B8C1' : '#fff', fontSize: 'var(--fs-md)', fontWeight: 700, border: 'none', cursor: answered ? 'default' : 'pointer' }}>
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ padding: '0 5% 20px', display: 'flex', gap: 8 }}>
                {['똑같음', '비슷함', '처음 봄'].map(label => (
                  <button key={label} onClick={() => handleRealAnswer(label)} disabled={answered || !isQuestion}
                    style={{ flex: 1, height: 56, borderRadius: 10, background: answered ? '#E5E8EB' : '#2C74DB', color: answered ? '#B0B8C1' : '#fff', fontSize: 'var(--fs-base)', fontWeight: 700, border: 'none', cursor: answered ? 'default' : 'pointer' }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {isFocus && (
        <FocusOverlay onDone={() => {
          if (phase === 'fake_focus') {
            setPhase('fake_q');
            startTimer(() => {
              const q = fakeQuestions.current[fakeIndexRef.current];
              results.current.push({ question: q.imageName, userAnswer: null, isCorrect: false, responseTime: JUDGE_TIMER_MS / 1000 });
              goNextFake();
            });
          } else {
            setPhase('real_q');
            startTimer(() => {
              const q = realQuestions.current[realIndexRef.current];
              results.current.push({ question: q.imageName, userAnswer: null, isCorrect: false, responseTime: JUDGE_TIMER_MS / 1000 });
              goNextReal();
            });
          }
        }} />
      )}
      {submitting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <LoadingSpinner />
        </div>
      )}
      {errorModal && <Modal title="오류" message={errorModal} onConfirm={() => setErrorModal(null)} />}
    </div>
  );
}

// ─── Distinction Test ─────────────────────────────────────────────────────────

function DistinctionTest({ testId, onDone }: { testId: string; onDone: () => void }) {
  const questions = useRef(getShuffledDistinctionData());
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'focus' | 'question'>('focus');
  const [remainMs, setRemainMs] = useState(JUDGE_TIMER_MS);
  const [answered, setAnswered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const results = useRef<Array<{ question: string; userAnswer: string | null; isCorrect: boolean; responseTime: number }>>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef(0);

  const total = questions.current.length;

  const submitAll = useCallback(async () => {
    setSubmitting(true);
    try {
      await cognitiveApi.submitResult(testId, { testResultList: results.current });
      onDone();
    } catch {
      setErrorModal('결과 제출 오류');
      setSubmitting(false);
    }
  }, [testId, onDone]);

  const goNext = useCallback(() => {
    indexRef.current += 1;
    if (indexRef.current >= questions.current.length) {
      submitAll();
    } else {
      setIndex(indexRef.current);
      setAnswered(false);
      setRemainMs(JUDGE_TIMER_MS);
      setPhase('focus');
    }
  }, [questions, submitAll]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setRemainMs(JUDGE_TIMER_MS);
    timerRef.current = setInterval(() => {
      const remain = JUDGE_TIMER_MS - (Date.now() - startTimeRef.current);
      if (remain <= 0) {
        clearInterval(timerRef.current!);
        setRemainMs(0);
        const q = questions.current[indexRef.current];
        results.current.push({ question: q.imageName, userAnswer: null, isCorrect: false, responseTime: JUDGE_TIMER_MS / 1000 });
        goNext();
      } else {
        setRemainMs(remain);
      }
    }, 50);
  }, [questions, goNext]);

  const handleAnswer = (answer: string) => {
    if (answered) return;
    clearInterval(timerRef.current!);
    setAnswered(true);
    const rt = parseFloat(((Date.now() - startTimeRef.current) / 1000).toFixed(3));
    const q = questions.current[indexRef.current];
    results.current.push({ question: q.imageName, userAnswer: answer, isCorrect: answer === q.answer, responseTime: rt });
    setTimeout(goNext, 150);
  };

  const q: DistinctionItem = questions.current[Math.min(index, questions.current.length - 1)];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <PageHeader title="변별시행" onBack={() => {}} />
      <TimerBar totalMs={JUDGE_TIMER_MS} remainMs={remainMs} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{
          flex: 1, margin: '20px 5%', borderRadius: 12,
          border: '1px solid #E5E8EB', background: '#F9FAFB',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
          {phase === 'question' && (
            <img src={mstImageUrl(q.imageName)} alt="" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
          )}
        </div>

        <div style={{ padding: '0 5% 20px', display: 'flex', gap: 8 }}>
          {(['똑같음', '비슷함', '처음 봄'] as const).map(label => (
            <button
              key={label}
              onClick={() => handleAnswer(label)}
              disabled={answered || phase !== 'question'}
              style={{
                flex: 1, height: 56, borderRadius: 10,
                background: answered ? '#E5E8EB' : '#2C74DB',
                color: answered ? '#B0B8C1' : '#fff',
                fontSize: 'var(--fs-base)', fontWeight: 700, border: 'none',
                cursor: answered || phase !== 'question' ? 'default' : 'pointer',
              }}
            >{label}</button>
          ))}
        </div>

        <div style={{ textAlign: 'center', paddingBottom: 12, fontSize: 'var(--fs-sm)', color: '#8B95A1' }}>
          {index + 1} / {total}
        </div>
      </div>

      {phase === 'focus' && <FocusOverlay onDone={() => { setPhase('question'); startTimer(); }} />}
      {submitting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <LoadingSpinner />
        </div>
      )}
      {errorModal && <Modal title="오류" message={errorModal} onConfirm={() => setErrorModal(null)} />}
    </div>
  );
}
