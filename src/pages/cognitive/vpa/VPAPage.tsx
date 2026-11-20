import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cognitiveApi } from '../../../api/cognitive';
import { SubTestInfo, SubSubTestInfo } from '../../../types/cognitive';
import { getJaeinAnswers, getLearningWords, getNumberQuestion, getFigureQuestion, type LearningData } from '../../../utils/vpaData';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import Modal from '../../../components/common/Modal';

type SubView = 'list' | 'learning' | 'immediate' | 'delay' | 'jaein';

// ─── Shared styles ───────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = {
  height: '100vh', display: 'flex', flexDirection: 'column',
  background: '#F2F4F6',
};

const headerStyle: React.CSSProperties = {
  height: 56, flexShrink: 0, background: '#fff',
  display: 'flex', alignItems: 'center',
  borderBottom: '1px solid #E5E8EB',
  position: 'relative',
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
// ─── Sub-test list item ───────────────────────────────────────────────────────

function SubTestItem({
  index, data, onPress, onChildPress, disabled,
}: {
  index: number; data: SubTestInfo; onPress: () => void;
  onChildPress: (child: SubSubTestInfo) => void; disabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const done = data.testProgress === 100;
  const inProgress = (data.testProgress ?? 0) > 0 && !done;
  const hasChildren = data.subTestList != null && data.subTestList.some(s => s.testId !== null);

  return (
    <div className="sub-item" style={{ marginLeft: 'auto', marginRight: 'auto', width: '90%' }}>
      <div
        className="sub-item-card"
        style={{
          width: '90%', marginLeft: 'auto', marginRight: 'auto',
          background: '#fff', borderRadius: 20,
          border: `1px solid ${done ? '#E5E8EB' : '#2C74DB'}`,
          opacity: disabled && !done ? 0.6 : 1,
        }}
      >
        <div className="sub-item-inner" style={{ padding: '0 7%', display: 'flex', flexDirection: 'column' }}>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="sub-num-badge" style={{
              borderRadius: '50%', background: '#333D4B',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, flexShrink: 0,
            }}>{index + 1}</div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
              <span style={{ fontSize: 'var(--fs-sub-name)', fontWeight: 700, color: '#191F28' }}>
                {data.testName}
              </span>
              {data.testDuration && !done && (
                <span style={{ fontSize: 'var(--fs-sub-dur)', fontWeight: 600, color: inProgress ? '#2C74DB' : '#6B7684', flexShrink: 0 }}>
                  {data.testDuration}
                </span>
              )}
            </div>

            <button
              className="sub-start-btn"
              onClick={() => {
                if (done || disabled) return;
                if (hasChildren) setExpanded(e => !e);
                else onPress();
              }}
              disabled={done || disabled}
              style={{
                background: done ? '#E5E8EB' : '#2C74DB',
                color: done ? '#B0B8C1' : '#fff',
                fontSize: 'var(--fs-sub-btn)', fontWeight: 700,
                border: 'none', flexShrink: 0,
                cursor: done || disabled ? 'default' : 'pointer',
              }}
            >
              {done ? '완료' : '시작하기'}
            </button>
          </div>

          {!done && data.testDescription && (
            <div style={{
              background: '#F9FAFB', borderRadius: 6, padding: 6,
              fontSize: 'var(--fs-sub-desc)', color: '#4E5968', lineHeight: 1.5,
            }}>
              {data.testDescription}
            </div>
          )}

          {/* Nested child tests — shown after expanding */}
          {hasChildren && expanded && data.subTestList!.filter(s => s.testId !== null).map((child, i) => {
            const childDone = child.testProgress === 100;
            return (
              <div key={child.testId ?? i} className="sub-child" style={{
                background: '#F9FAFB', borderRadius: 12,
                border: `1px solid ${childDone ? '#E5E8EB' : '#D1E4FB'}`,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ flex: 1, fontSize: 'var(--fs-sub-child)', fontWeight: 600, color: '#191F28' }}>
                  {child.testName}
                </span>
                <button
                  className="sub-child-btn"
                  onClick={!childDone ? () => onChildPress(child) : undefined}
                  disabled={childDone}
                  style={{
                    background: childDone ? '#E5E8EB' : '#2C74DB',
                    color: childDone ? '#B0B8C1' : '#fff',
                    fontSize: 'var(--fs-sub-cbtn)', fontWeight: 700,
                    border: 'none', flexShrink: 0,
                    cursor: childDone ? 'default' : 'pointer',
                  }}
                >
                  {childDone ? '완료' : '시작'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
// ─── Main VPA Page ────────────────────────────────────────────────────────────

export default function VPAPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { testId: string } };
  const testId = state?.testId;

  const [subView, setSubView] = useState<SubView>('list');
  const [subTests, setSubTests] = useState<SubTestInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [currentSubTestId, setCurrentSubTestId] = useState<string | null>(null);
  const [currentSubTestName, setCurrentSubTestName] = useState<string>('즉각회상');
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const breakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopBreakTimer = useCallback(() => {
    if (breakTimerRef.current) { clearTimeout(breakTimerRef.current); breakTimerRef.current = null; }
  }, []);

  useEffect(() => () => stopBreakTimer(), [stopBreakTimer]);
  // Keep one learned set for the whole VPA session. Recall/recognition must
  // use the same pairs that were shown during learning.
  const wordPairsRef = useRef<LearningData[]>(getLearningWords());

  const loadSubTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cognitiveApi.getSubTestList(testId);
      setSubTests(res.rows);
      if (res.rows.every(r => r.testProgress === 100)) navigate('/cognitive');
    } catch {
      setErrorModal('세부검사 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [testId, navigate]);

  useEffect(() => { loadSubTests(); }, [loadSubTests]);

  const handlePress = async (sub: SubTestInfo) => {
    if (!sub.testId) return;
    stopBreakTimer();
    setStarting(true);
    try {
      const res = await cognitiveApi.startTest(sub.testId);
      if (res.code === '200') {
        setCurrentSubTestId(sub.testId);
        const name = sub.testName ?? '';
        if (name.includes('즉각')) setCurrentSubTestName(name);
        if (name.includes('학습')) setSubView('learning');
        else if (name.includes('즉각')) setSubView('immediate');
        else if (name.includes('지연')) setSubView('delay');
        else setSubView('jaein');
      } else {
        setErrorModal('세부검사를 시작할 수 없습니다.');
      }
    } catch {
      setErrorModal('오류가 발생했습니다.');
    } finally {
      setStarting(false);
    }
  };

  const handleChildPress = async (child: SubSubTestInfo) => {
    if (!child.testId) return;
    stopBreakTimer();
    setStarting(true);
    try {
      const res = await cognitiveApi.startTest(child.testId);
      if (res.code === '200') {
        setCurrentSubTestId(child.testId);
        if (child.testName) setCurrentSubTestName(child.testName);
        setSubView('immediate');
      } else {
        setErrorModal('세부검사를 시작할 수 없습니다.');
      }
    } catch {
      setErrorModal('오류가 발생했습니다.');
    } finally {
      setStarting(false);
    }
  };

  const onDone = () => { setSubView('list'); loadSubTests(); };
  const onLearningComplete = () => {
    setSubView('list');
    loadSubTests();
    setShowBreakModal(true);
    stopBreakTimer();
    breakTimerRef.current = setTimeout(() => {
      setShowBreakModal(false);
      setShowTimeoutModal(true);
    }, 300000);
  };

  if (loading) return <div style={{ height: '100vh', background: '#fff' }}><LoadingSpinner /></div>;

  if (showIntro) {
    return (
      <div style={{ height: '100vh', background: '#F2F4F6' }}>
        <Modal
          title="안내사항"
          message={"단어 연합 기억 검사는\n총 4개의 세부 검사로 구성되어 있으며,\n모든 검사를 완료해야 검사 결과를\n확인하실 수 있습니다.\n\n각 세부 검사는 쉬지 않고\n바로 실시하는 것을 권고드립니다.\n부득이하게 쉬는 시간이 필요할 경우,\n5분 내에 세부 검사를 시작해야 합니다."}
          onConfirm={() => setShowIntro(false)}
        />
      </div>
    );
  }

  if (subView !== 'list' && currentSubTestId) {
    if (subView === 'learning') return <LearningView testId={currentSubTestId} wordPairs={wordPairsRef.current} onDone={onDone} onComplete={onLearningComplete} />;
    if (subView === 'immediate') return <ImmediateView testId={currentSubTestId} label={currentSubTestName} onDone={onDone} />;
    if (subView === 'delay') return <DelayView testId={currentSubTestId} onDone={onDone} />;
    if (subView === 'jaein') return <JaeinView testId={currentSubTestId} wordPairs={wordPairsRef.current} onDone={onDone} />;
  }

  return (
    <div style={pageStyle}>
      <PageHeader title="단어 연합 기억 검사" onBack={() => navigate('/cognitive')} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {subTests.map((sub, idx) => (
          <SubTestItem
            key={sub.testId ?? idx}
            index={idx}
            data={sub}
            onPress={() => handlePress(sub)}
            onChildPress={handleChildPress}
            disabled={starting}
          />
        ))}
        <div style={{ height: 24 }} />
      </div>
      {starting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <LoadingSpinner />
        </div>
      )}
      {errorModal && <Modal title="오류" message={errorModal} onConfirm={() => setErrorModal(null)} />}
      {showBreakModal && (
        <Modal
          title="쉬는 시간 안내"
          message={"쉬는 시간은 5분 입니다. 각 세부 검사는 쉬지 않고 바로 실시하는 것을 권고드립니다.\n\n쉬는 시간이 필요하신 경우, 꼭 5분 이내로 다음 세부 검사를 시작해 주세요."}
          onConfirm={() => setShowBreakModal(false)}
        />
      )}
      {showTimeoutModal && (
        <Modal
          title="검사가 중단되었습니다."
          message="쉬는 시간 5분 내에 다음 세부 검사를 시작하지 않아 검사를 처음부터 다시 시작합니다."
          icon={
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <circle cx="28" cy="28" r="28" fill="#FC3A4A"/>
              <rect x="26" y="13" width="4" height="20" rx="2" fill="#fff"/>
              <circle cx="28" cy="41" r="3" fill="#fff"/>
            </svg>
          }
          onConfirm={() => { setShowTimeoutModal(false); loadSubTests(); }}
        />
      )}
    </div>
  );
}

// ─── Learning Sub-Test ────────────────────────────────────────────────────────
// Word pair displayed large, centered. Timer progress bar at top. Auto-advance each 3s.

function LearningView({ testId, wordPairs, onDone, onComplete }: { testId: string; wordPairs: LearningData[]; onDone: () => void; onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'explain' | 'test' | 'complete'>('explain');
  const [remaining, setRemaining] = useState(5000);
  const [announcing, setAnnouncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const announcingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const results = useRef<Array<{ question: string; userAnswer: null; isCorrect: null; responseTime: number }>>([]);

  const startWordTimer = useCallback((currentIndex: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (announcingTimerRef.current) clearTimeout(announcingTimerRef.current);
    setAnnouncing(true);
    announcingTimerRef.current = setTimeout(() => {
      setAnnouncing(false);
      setRemaining(5000);
      const end = performance.now() + 5000;
      timerRef.current = setInterval(() => {
        const left = Math.max(0, end - performance.now());
        setRemaining(left);
        if (left <= 0) {
          clearInterval(timerRef.current!);
          results.current.push({ question: wordPairs[currentIndex].first, userAnswer: null, isCorrect: null, responseTime: 5.0 });
          const next = currentIndex + 1;
          if (next < wordPairs.length) {
            setIndex(next);
            startWordTimer(next);
          } else {
            setPhase('complete');
          }
        }
      }, 16);
    }, 2000);
  }, [wordPairs]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (announcingTimerRef.current) clearTimeout(announcingTimerRef.current);
  }, []);

  const submitResults = async () => {
    setSubmitting(true);
    try {
      await cognitiveApi.submitResult(testId, { testResultList: results.current });
      onComplete();
    } catch {
      setErrorModal('결과 제출 오류');
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === 'explain') {
    const tips = [
      '모든 단어 쌍은\n5초간 연속하여 제시됩니다.',
      '제한된 시간 내에\n빠르고 정확하게 외워주세요.',
    ];
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <PageHeader title="학습" onBack={onDone} />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', padding: '32px 5%' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 'var(--fs-body)', color: '#6B7684', fontWeight: 500 }}>학습 전 확인하세요!</span>
                <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: '#191F28', textAlign: 'center', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {'온전히 검사에만 집중할 수 있는\n조용한 공간이신가요?'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {tips.map((tip, i) => (
                  <div key={i} style={{ background: '#F2F4F6', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 18 }}>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="11" cy="11" r="11" fill="#2C74DB"/>
                      <path d="M7 11L10 14L15 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: 'var(--fs-label)', color: '#333D4B', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, paddingTop: 32 }}>
              <button
                onClick={onDone}
                style={{ flex: 1, padding: '16px 0', borderRadius: 12, background: '#F2F4F6', color: '#6B7684', fontSize: 'var(--fs-body)', fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >이전</button>
              <button
                onClick={() => { setPhase('test'); startWordTimer(0); }}
                style={{ flex: 1, padding: '16px 0', borderRadius: 12, background: '#2C74DB', color: '#fff', fontSize: 'var(--fs-body)', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >학습 시작</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <PageHeader title="학습" onBack={onDone} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '0 24px' }}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="36" fill="#03B26C"/>
            <path d="M22 36L31 46L50 26" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: '#191F28', textAlign: 'center', marginTop: 4 }}>
            모든 단어 쌍 학습을 완료하였습니다
          </span>
          <span style={{ fontSize: 'var(--fs-base)', color: '#6B7684', textAlign: 'center', lineHeight: 1.6 }}>
            바로 다음 검사를 시작하면 더 정확한{'\n'}검사 결과를 얻을 수 있어요
          </span>
        </div>
        <div style={{ padding: '0 24px 40px' }}>
          <button
            onClick={submitResults}
            disabled={submitting}
            style={{ width: '100%', padding: '16px 0', borderRadius: 12, background: '#2C74DB', color: '#fff', fontSize: 'var(--fs-body)', fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            {submitting ? '저장 중...' : '다음'}
          </button>
        </div>
        {errorModal && <Modal title="오류" message={errorModal} onConfirm={() => setErrorModal(null)} />}
      </div>
    );
  }

  const pair = wordPairs[index];
  const pct = (remaining / 5000) * 100;
  const secs = Math.floor(remaining / 1000);
  const ms = Math.floor((remaining % 1000) / 10);
  const timeStr = `${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}초`;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <PageHeader title="학습" onBack={onDone} />

      {/* Page count + Timer bar */}
      <div style={{ padding: '10px 5%' }}>
        <div style={{ textAlign: 'right', marginBottom: 6, fontSize: 'var(--fs-label)', fontWeight: 600, color: '#4E5968' }}>
          {index + 1}/{wordPairs.length}
        </div>
        <div style={{ height: 6, background: '#E5E8EB', borderRadius: 999 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#DF8F58', borderRadius: 999, transition: 'width 0.016s linear' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 'var(--fs-xs)', color: '#8B95A1' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="#8B95A1" strokeWidth="1.4"/>
            <path d="M8 4.5V8L10.2 10.2" stroke="#8B95A1" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>제시 시간</span>
          <span style={{ fontWeight: 700, color: '#4E5968' }}>{timeStr}</span>
        </div>
      </div>

      {/* Word pair — centered, large */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 'var(--fs-4xl)', fontWeight: 800, color: '#191F28', letterSpacing: '-0.03em' }}>
          {pair.first}–{pair.second}
        </span>
      </div>

      {/* GapPopup: dim + centered black rounded box (matches fragment_gap_popup.xml) */}
      {announcing && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            width: '80%',
            background: 'rgba(0,0,0,0.9)',
            borderRadius: 20,
            padding: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 'var(--fs-xl)', fontWeight: 600, color: '#fff', textAlign: 'center', lineHeight: 1.4 }}>
              {index === wordPairs.length - 1 ? '마지막' : `${index + 1}번째`} 단어 쌍이 제시됩니다.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Immediate Recall ────────────────────────────────────────────────────────

function ImmediateView({ testId, label, onDone }: { testId: string; label: string; onDone: () => void }) {
  const wordPairs = useRef(getLearningWords()).current;
  const [phase, setPhase] = useState<'explain1' | 'explain2' | 'quiz'>('explain1');
  const [index, setIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [quizPhase, setQuizPhase] = useState<'announcing' | 'input' | 'result'>('announcing');
  const [resultCorrect, setResultCorrect] = useState(false);
  const [remaining, setRemaining] = useState(45000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const announcingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef(45000);
  const inputValRef = useRef('');
  const startTimeRef = useRef(0);
  const results = useRef<Array<{ question: string; userAnswer: string | null; isCorrect: boolean; responseTime: number }>>([]);

  useEffect(() => { inputValRef.current = inputVal; }, [inputVal]);
  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (announcingRef.current) clearTimeout(announcingRef.current);
  }, []);

  const stopTimers = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (announcingRef.current) { clearTimeout(announcingRef.current); announcingRef.current = null; }
  };

  const doSubmitAll = async () => {
    setSubmitting(true);
    try {
      await cognitiveApi.submitResult(testId, { testResultList: results.current });
      onDone();
    } catch { setErrorModal('결과 제출 오류'); setSubmitting(false); }
  };

  const startQuestion = (idx: number) => {
    stopTimers();
    setIndex(idx);
    setInputVal('');
    setQuizPhase('announcing');
    announcingRef.current = setTimeout(() => {
      setQuizPhase('input');
      startTimeRef.current = performance.now();
      setRemaining(45000);
      maxRef.current = 45000;
      setTimeout(() => inputRef.current?.focus(), 50);
      const end = performance.now() + 45000;
      timerRef.current = setInterval(() => {
        const left = Math.max(0, end - performance.now());
        setRemaining(left);
        if (left <= 0) {
          clearInterval(timerRef.current!); timerRef.current = null;
          onAnswerSubmit(idx, inputValRef.current);
        }
      }, 16);
    }, 2000);
  };

  const onAnswerSubmit = (idx: number, answer: string) => {
    stopTimers();
    const rt = parseFloat(((performance.now() - startTimeRef.current) / 1000).toFixed(3));
    const isCorrect = answer.trim() === wordPairs[idx].second;
    results.current.push({ question: wordPairs[idx].first, userAnswer: answer.trim() || null, isCorrect, responseTime: rt });
    setResultCorrect(isCorrect);
    setQuizPhase('result');
    setRemaining(3000);
    maxRef.current = 3000;
    const end = performance.now() + 3000;
    timerRef.current = setInterval(() => {
      const left = Math.max(0, end - performance.now());
      setRemaining(left);
      if (left <= 0) {
        clearInterval(timerRef.current!); timerRef.current = null;
        const next = idx + 1;
        if (next < wordPairs.length) startQuestion(next);
        else doSubmitAll();
      }
    }, 16);
  };

  if (phase === 'explain1') {
    const tips = [
      '정답을 맞추는 것도 중요하지만,\n실제로 회원님이 어떤 단어를\n떠올렸는지가 더 중요해요.',
      '모른다고 그냥 넘어가지 마시고\n생각나는 대로 입력해 주세요.',
    ];
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <PageHeader title={label} onBack={onDone} />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', padding: '32px 5%' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 'var(--fs-body)', color: '#6B7684', fontWeight: 500 }}>학습 전 확인하세요!</span>
                <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: '#191F28', textAlign: 'center', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {'온전히 검사에만 집중할 수 있는\n조용한 공간이신가요?'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {tips.map((tip, i) => (
                  <div key={i} style={{ background: '#F2F4F6', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 18 }}>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="11" cy="11" r="11" fill="#2C74DB"/>
                      <path d="M7 11L10 14L15 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: 'var(--fs-label)', color: '#333D4B', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, paddingTop: 32 }}>
              <button
                onClick={onDone}
                style={{ flex: 1, padding: '16px 0', borderRadius: 12, background: '#F2F4F6', color: '#6B7684', fontSize: 'var(--fs-body)', fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >이전</button>
              <button
                onClick={() => setPhase('explain2')}
                style={{ flex: 1, padding: '16px 0', borderRadius: 12, background: '#2C74DB', color: '#fff', fontSize: 'var(--fs-body)', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >다음</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'explain2') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <PageHeader title={label} onBack={() => setPhase('explain1')} />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', padding: '32px 5%' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 'var(--fs-body)', color: '#6B7684', fontWeight: 500 }}>학습 전 확인하세요!</span>
                <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: '#191F28', textAlign: 'center', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {'45초 내에 정답을 입력하고\n완료 버튼을 눌러주세요'}
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 'var(--fs-sm)', color: '#191F28', lineHeight: 1.7 }}>
                  아래 예시와 같이 앞에서 학습한 단어 쌍의 앞 단어가 제시되면, 그에 대응하는 뒷 단어를 떠올려 입력하는 문제입니다.
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
              <svg viewBox="0 0 342 162" style={{ width: '100%', maxWidth: 342 }} fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20,0.5L322,0.5A19.5,19.5 0,0 1,341.5 20L341.5,142A19.5,19.5 0,0 1,322 161.5L20,161.5A19.5,19.5 0,0 1,0.5 142L0.5,20A19.5,19.5 0,0 1,20 0.5z" stroke="#E5E8EB"/>
                <path d="M83.09,56.43V105.92H77.08V79.13H67.02V93.95H43.5V60.26H49.63V72.56H61.05V60.26H67.02V74.15H77.08V56.43H83.09ZM49.63,89.08H61.05V77.32H49.63V89.08ZM130.04,56.43V90.45H123.97V70.7H114.12V65.73H123.97V56.43H130.04ZM88.42,80.16C96.43,77.46 100.45,70.92 100.45,63.81V58.89H106.58V64.25C106.55,70.59 110.51,76.66 118.06,79.23L114.89,83.94C109.56,82.05 105.73,78.36 103.57,73.74C101.41,78.88 97.39,82.93 91.7,84.98L88.42,80.16ZM94.33,100.94C104.09,99.5 110.49,93.95 110.51,88.48V87.27H116.8V88.48C116.75,94.22 122.9,99.5 132.94,100.94L130.64,105.59C122.65,104.44 116.58,100.84 113.6,95.86C110.57,100.78 104.47,104.44 96.57,105.59L94.33,100.94ZM167.21,81.64V87.38H149.39V81.64H167.21Z" fill="#191F28"/>
                <path d="M190,41L292,41A9,9 0,0 1,301 50L301,112A9,9 0,0 1,292 121L190,121A9,9 0,0 1,181 112L181,50A9,9 0,0 1,190 41z" fill="#F9FAFB"/>
                <path d="M190,41L292,41A9,9 0,0 1,301 50L301,112A9,9 0,0 1,292 121L190,121A9,9 0,0 1,181 112L181,50A9,9 0,0 1,190 41z" stroke="#D0583C" strokeWidth="2"/>
                <path d="M236.7,59.8V82.53H231.45V59.8H236.7ZM202.16,71.61C202.16,65.73 207.03,61.65 213.59,61.67C220.13,61.65 225.01,65.73 224.98,71.61C225.01,77.4 220.13,81.48 213.59,81.45C207.03,81.48 202.16,77.4 202.16,71.61ZM207.27,71.61C207.24,75.01 209.89,77.16 213.59,77.19C217.23,77.16 219.88,75.01 219.88,71.61C219.88,68.21 217.23,66.01 213.59,66.03C209.89,66.01 207.24,68.21 207.27,71.61ZM208.67,101.66V84.5H213.83V88.86H231.5V84.5H236.7V101.66H208.67ZM213.83,97.44H231.5V92.94H213.83V97.44ZM261.94,62.33V75.08H248.58V80.28C255.4,80.28 259.27,80.09 263.77,79.25L264.28,83.47C259.22,84.34 254.84,84.45 246.52,84.45H243.43V71.19H256.74V66.45H243.33V62.33H261.94ZM248.21,92.09V87.92H277.17V102.17H271.97V92.09H248.21ZM264.47,78.92V74.75H271.97V70.02H264.47V65.84H271.97V59.84H277.17V85.91H271.97V78.92H264.47Z" fill="#D1D6DB"/>
              </svg>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              <button
                onClick={() => setPhase('explain1')}
                style={{ flex: 1, padding: '16px 0', borderRadius: 12, background: '#F2F4F6', color: '#6B7684', fontSize: 'var(--fs-body)', fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >이전</button>
              <button
                onClick={() => { setPhase('quiz'); startQuestion(0); }}
                style={{ flex: 1, padding: '16px 0', borderRadius: 12, background: '#191F28', color: '#fff', fontSize: 'var(--fs-body)', fontWeight: 700, border: 'none', cursor: 'pointer' }}
              >시작</button>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  const pair = wordPairs[index];
  const pct = (remaining / maxRef.current) * 100;
  const secs = Math.floor(remaining / 1000);
  const ms = Math.floor((remaining % 1000) / 10);
  const timeStr = `${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}초`;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <PageHeader title={label} onBack={onDone} />

      {/* Timer bar */}
      <div style={{ padding: '10px 5%' }}>
        <div style={{ textAlign: 'right', marginBottom: 6, fontSize: 'var(--fs-label)', fontWeight: 600, color: '#4E5968' }}>
          {index + 1}/{wordPairs.length}
        </div>
        <div style={{ height: 6, background: '#E5E8EB', borderRadius: 999 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: '#DF8F58', borderRadius: 999, transition: 'width 0.016s linear' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 'var(--fs-xs)', color: '#8B95A1' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="#8B95A1" strokeWidth="1.4"/>
            <path d="M8 4.5V8L10.2 10.2" stroke="#8B95A1" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>제시 시간</span>
          <span style={{ fontWeight: 700, color: '#4E5968' }}>{timeStr}</span>
        </div>
      </div>

      {/* Result: correct */}
      {quizPhase === 'result' && resultCorrect && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="36" fill="#03B26C"/>
            <path d="M22 36L31 46L50 26" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: '#191F28' }}>정답입니다!</span>
          <span style={{ fontSize: 'var(--fs-base)', color: '#6B7684' }}>다음 문제로 넘어갑니다.</span>
        </div>
      )}

      {/* Result: incorrect */}
      {quizPhase === 'result' && !resultCorrect && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '0 5%' }}>
          <span style={{ fontSize: 'var(--fs-base)', color: '#6B7684', fontWeight: 600 }}>정답은?</span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 'var(--fs-4xl)', fontWeight: 800, color: '#191F28', letterSpacing: '-0.03em' }}>{pair.first}</span>
            <span style={{ fontSize: 'var(--fs-4xl)', fontWeight: 800, color: '#8B95A1' }}>–</span>
            <span style={{ fontSize: 'var(--fs-4xl)', fontWeight: 800, color: '#2C74DB', letterSpacing: '-0.03em' }}>{pair.second}</span>
          </div>
          <span style={{ fontSize: 'var(--fs-sm)', color: '#8B95A1', textAlign: 'center' }}>3초 후 자동으로 다음 문제로 넘어갑니다.</span>
        </div>
      )}

      {/* Quiz input */}
      {quizPhase === 'input' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 56, padding: '0 5%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 'var(--fs-4xl)', fontWeight: 800, color: '#191F28', letterSpacing: '-0.03em' }}>{pair.first}</span>
            <span style={{ fontSize: 'var(--fs-4xl)', fontWeight: 800, color: '#8B95A1' }}>–</span>
            <input
              ref={inputRef}
              type="text" value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { onAnswerSubmit(index, inputValRef.current); } }}
              placeholder="입력"
              style={{
                width: 160, padding: '12px 16px', fontSize: 'var(--fs-4xl)', fontWeight: 800,
                border: '2px solid #2C74DB', borderRadius: 12, outline: 'none',
                textAlign: 'center', color: '#191F28', letterSpacing: '-0.03em',
              }}
            />
          </div>
          <button
            onClick={() => onAnswerSubmit(index, inputValRef.current)}
            style={{ width: '90%', padding: '16px 0', borderRadius: 12, background: '#191F28', color: '#fff', fontSize: 'var(--fs-body)', fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >완료</button>
        </div>
      )}

      {/* GapPopup overlay */}
      {quizPhase === 'announcing' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ width: '80%', background: 'rgba(0,0,0,0.9)', borderRadius: 20, padding: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 'var(--fs-xl)', fontWeight: 600, color: '#fff', textAlign: 'center', lineHeight: 1.4 }}>
              빈칸에 들어갈 알맞은 단어를 입력하세요
            </span>
          </div>
        </div>
      )}

      {errorModal && <Modal title="오류" message={errorModal} onConfirm={() => setErrorModal(null)} />}
      {submitting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
}

// ─── Delayed Recall: number order + figure selection ─────────────────────────

function DelayView({ testId, onDone }: { testId: string; onDone: () => void }) {
  const numberQuestion = useRef(getNumberQuestion()).current;
  const figureQuestion = useRef(getFigureQuestion()).current;
  const [phase, setPhase] = useState<'explain' | 'number' | 'figure' | 'complete'>('explain');
  const [numberAnswer, setNumberAnswer] = useState<number[]>([]);
  const [figureAnswer, setFigureAnswer] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const numberStartedAt = useRef(0);
  const figureStartedAt = useRef(0);

  const start = () => { numberStartedAt.current = performance.now(); setPhase('number'); };
  const submit = async () => {
    setSubmitting(true);
    const numberCorrect = numberAnswer.length > 0 && numberAnswer.every((n, i) => n === [...numberQuestion.numbers].sort(numberQuestion.questionName.startsWith('가장 큰') ? (a, b) => b - a : (a, b) => a - b)[i]);
    const target = figureQuestion.questionName.includes('분홍') ? '#EF5DA8'
      : figureQuestion.questionName.includes('노란') ? '#F2C94C'
      : figureQuestion.questionName.includes('초록') ? '#5AC77D'
      : figureQuestion.questionName.includes('파란') ? '#2F80ED'
      : figureQuestion.questionName.includes('빨간') ? '#EB5757'
      : figureQuestion.questionName.includes('별') ? 'star'
      : figureQuestion.questionName.includes('원') ? 'circle'
      : figureQuestion.questionName.includes('삼각') ? 'triangle'
      : figureQuestion.questionName.includes('사각') ? 'rectangle'
      : figureQuestion.questionName.includes('오각') ? 'pentagon' : 'heart';
    const correctIds = figureQuestion.options.filter(o => o.color === target || o.shape === target).map(o => o.id);
    const figureCorrect = figureAnswer.length === correctIds.length && correctIds.every(id => figureAnswer.includes(id));
    const numberResponseTime = Number(((figureStartedAt.current - numberStartedAt.current) / 1000).toFixed(3));
    const figureResponseTime = Number(((performance.now() - figureStartedAt.current) / 1000).toFixed(3));
    try {
      await cognitiveApi.submitResult(testId, { testResultList: [
        { question: numberQuestion.questionName, userAnswer: numberAnswer.length ? numberAnswer.join(',') : null, isCorrect: numberAnswer.length ? numberCorrect : null, responseTime: numberResponseTime },
        { question: figureQuestion.questionName, userAnswer: figureAnswer.length ? figureAnswer.join(',') : null, isCorrect: figureAnswer.length ? figureCorrect : null, responseTime: figureResponseTime },
      ]});
      setPhase('complete');
    } catch { setErrorModal('결과 제출 오류'); setSubmitting(false); }
  };

  if (phase === 'explain') return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <PageHeader title="지연" onBack={onDone} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20, padding: 24 }}>
        <h2 style={{ textAlign: 'center', fontSize: 'var(--fs-lg)' }}>지연 검사 안내</h2>
        <p style={{ textAlign: 'center', color: '#4E5968', lineHeight: 1.7 }}>숫자와 도형 문제를 순서대로 풀어주세요.</p>
        <button onClick={start} style={{ padding: 16, borderRadius: 12, background: '#2C74DB', color: '#fff', fontWeight: 700 }}>검사 시작</button>
      </div>
    </div>
  );

  if (phase === 'number' || phase === 'figure') return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <PageHeader title="지연" onBack={onDone} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 5%' }}>
        {phase === 'number' ? <>
          <h2 style={{ textAlign: 'center', whiteSpace: 'pre-line', fontSize: 'var(--fs-body)', marginBottom: 24 }}>{numberQuestion.questionName}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {numberQuestion.numbers.map(n => <button key={n} disabled={numberAnswer.includes(n)} onClick={() => setNumberAnswer(a => [...a, n])} style={{ padding: 22, borderRadius: 12, background: numberAnswer.includes(n) ? '#2C74DB' : '#F2F4F6', color: numberAnswer.includes(n) ? '#fff' : '#191F28', fontSize: 'var(--fs-lg)', fontWeight: 700 }}>{n}</button>)}
          </div>
          <button onClick={() => { figureStartedAt.current = performance.now(); setPhase('figure'); }} disabled={numberAnswer.length !== 9} style={{ width: '100%', marginTop: 28, padding: 16, borderRadius: 12, background: '#2C74DB', color: '#fff', fontWeight: 700 }}>다음</button>
        </> : <>
          <h2 style={{ textAlign: 'center', fontSize: 'var(--fs-body)', marginBottom: 24 }}>{figureQuestion.questionName}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {figureQuestion.options.map(o => { const selected = figureAnswer.includes(o.id); return <button key={o.id} onClick={() => setFigureAnswer(a => selected ? a.filter(id => id !== o.id) : [...a, o.id])} style={{ height: 76, padding: 8, borderRadius: 12, border: `3px solid ${selected ? '#2C74DB' : '#E5E8EB'}`, background: selected ? '#ECF2FD' : '#fff' }}><img src={`/assets/vpa/${o.asset}`} alt={o.shape} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></button>; })}
          </div>
          <button onClick={submit} disabled={submitting} style={{ width: '100%', marginTop: 28, padding: 16, borderRadius: 12, background: '#2C74DB', color: '#fff', fontWeight: 700 }}>{submitting ? '저장 중...' : '완료'}</button>
        </>}
      </div>
      {errorModal && <Modal title="오류" message={errorModal} onConfirm={() => setErrorModal(null)} />}
    </div>
  );

  if (phase === 'complete') return <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}><PageHeader title="지연" onBack={onDone} /><div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><button onClick={onDone} style={{ padding: 16, borderRadius: 12, background: '#2C74DB', color: '#fff', fontWeight: 700 }}>다음 단계로</button></div></div>;
  return null;
}

// ─── Jaein (Recognition): one pair per page, three choices ───────────────────

function JaeinView({ testId, wordPairs, onDone }: { testId: string; wordPairs: LearningData[]; onDone: () => void }) {
  const questions = useRef([...wordPairs].sort(() => Math.random() - 0.5)).current;
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [remaining, setRemaining] = useState(30000);
  const [results, setResults] = useState<Array<{ question: string; userAnswer: string | null; isCorrect: boolean; responseTime: number }>>([]);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const startedAt = useRef(performance.now());
  const current = questions[index];
  const answers = useMemo(() => getJaeinAnswers(current.second), [current.second]);

  const finishQuestion = useCallback((answer: string | null) => {
    if (feedback) return;
    const isCorrect = answer === current.second;
    const result = { question: current.first, userAnswer: answer, isCorrect, responseTime: Number(((performance.now() - startedAt.current) / 1000).toFixed(3)) };
    setResults(prev => [...prev, result]); setSelected(answer); setFeedback(answer === null ? 'incorrect' : isCorrect ? 'correct' : 'incorrect');
  }, [current, feedback]);

  useEffect(() => {
    if (feedback) return;
    const timer = window.setInterval(() => setRemaining(v => { if (v <= 10) { finishQuestion(null); return 0; } return v - 10; }), 10);
    return () => window.clearInterval(timer);
  }, [index, feedback, finishQuestion]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(async () => {
      if (index + 1 < questions.length) { setIndex(i => i + 1); setSelected(null); setFeedback(null); setRemaining(30000); startedAt.current = performance.now(); }
      else {
        try { await cognitiveApi.submitResult(testId, { testResultList: results }); onDone(); }
        catch { setErrorModal('결과 제출 오류'); }
      }
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [feedback, index, questions.length, results, testId, onDone]);

  return <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
    <PageHeader title="재인" onBack={onDone} />
    <div style={{ padding: '12px 5%', display: 'flex', justifyContent: 'space-between', color: '#6B7684' }}><span>{index + 1}/{questions.length}</span><span>{(remaining / 1000).toFixed(2)}초</span></div>
    <div style={{ margin: '0 5%', height: 6, background: '#E5E8EB', borderRadius: 99 }}><div style={{ height: '100%', width: `${remaining / 300}%`, background: '#2C74DB', borderRadius: 99 }} /></div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28, padding: 24 }}>
      <div style={{ textAlign: 'center', fontSize: 'var(--fs-4xl)', fontWeight: 800 }}>{current.first} - ?</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{answers.map(answer => <button key={answer} disabled={!!feedback} onClick={() => finishQuestion(answer)} style={{ padding: 18, borderRadius: 12, background: selected === answer ? (feedback === 'correct' ? '#03B26C' : '#FC3A4A') : '#F2F4F6', color: selected === answer ? '#fff' : '#191F28', fontSize: 'var(--fs-body)', fontWeight: 700 }}>{answer}</button>)}</div>
      {feedback && <div style={{ textAlign: 'center', color: feedback === 'correct' ? '#03B26C' : '#FC3A4A', fontWeight: 700 }}>{feedback === 'correct' ? '정답입니다' : `정답: ${current.second}`}</div>}
    </div>
    {errorModal && <Modal title="오류" message={errorModal} onConfirm={() => setErrorModal(null)} />}
  </div>;
}

