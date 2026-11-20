import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cognitiveApi } from '../../../api/cognitive';
import { SubTestInfo } from '../../../types/cognitive';
import { getShuffledFacialData, ferImageUrl, EMOTION_LABELS, FacialItem } from '../../../utils/ferData';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import Modal from '../../../components/common/Modal';

type SubView = 'list' | 'explain1' | 'explain2' | 'explain3' | 'test';

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

// ─── Explain screens ──────────────────────────────────────────────────────────

const EXPLAIN_CONTENT = [
  {
    title: '얼굴 표정 인식 검사',
    body: '화면에 사람의 얼굴 표정이 나타납니다.\n잠시 후 사라지면, 어떤 감정의 표정이었는지\n아래 보기에서 선택해 주세요.',
  },
  {
    title: '제시 시간',
    body: '얼굴 표정은 짧은 시간 동안만 화면에\n나타납니다. 집중해서 표정을 살펴보세요.\n표정이 사라진 후 10초 내에 감정을 선택해야 합니다.',
  },
  {
    title: '7가지 감정',
    body: '아래 7가지 감정 중 하나를 선택해 주세요.',
  },
];

function ExplainScreen({ step, onNext, onPrev }: {
  step: 1 | 2 | 3; onNext: () => void; onPrev: () => void;
}) {
  const content = EXPLAIN_CONTENT[step - 1];
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <PageHeader title={`얼굴 표정 인식 검사 설명 (${step}/3)`} onBack={onPrev} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', gap: 20 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: '#EBF2FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" stroke="#2C74DB" strokeWidth="2"/>
            <circle cx="13" cy="16" r="2.5" fill="#2C74DB"/>
            <circle cx="27" cy="16" r="2.5" fill="#2C74DB"/>
            <path d="M12 25C14 29 26 29 28 25" stroke="#2C74DB" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: '#191F28', textAlign: 'center' }}>{content.title}</div>
        <div style={{ fontSize: 'var(--fs-base)', color: '#6B7684', textAlign: 'center', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
          {content.body}
        </div>
        {step === 2 && (
          <img
            src="/assets/fer/examples/ic_facial_ex_2.png"
            alt="얼굴 표정 제시 예시"
            style={{ width: 'min(760px, 100%)', maxHeight: '34vh', objectFit: 'contain', marginTop: 4 }}
          />
        )}
        {step === 3 && (
          <img
            src="/assets/fer/examples/ic_facial_emotion.png"
            alt="정서 선택지 예시"
            style={{ width: 'min(760px, 100%)', maxHeight: '30vh', objectFit: 'contain', marginTop: 4 }}
          />
        )}
      </div>
      <div style={{ padding: '0 20px 32px' }}>
        <button
          onClick={onNext}
          style={{
            width: '100%', height: 56, borderRadius: 14,
            background: '#2C74DB', color: '#fff', fontSize: 'var(--fs-md)', fontWeight: 700, border: 'none',
          }}
        >{step === 3 ? '검사 시작' : '다음'}</button>
      </div>
    </div>
  );
}

// ─── Main FER Page ────────────────────────────────────────────────────────────

export default function FERPage() {
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
        setSubView('explain1');
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
          message={"얼굴 표정 인식 검사는\n총 2개의 세부 검사로 구성되어 있으며,\n모든 검사를 완료해야 검사 결과를\n확인하실 수 있습니다.\n\n각 세부 검사는 쉬지 않고\n바로 실시하는 것을 권고드립니다.\n부득이하게 쉬는 시간이 필요할 경우,\n5분 내에 세부 검사를 시작해야 합니다."}
          confirmLabel="확인"
          onConfirm={() => setShowIntro(false)}
        />
      </div>
    );
  }

  if (subView === 'explain1') {
    return <ExplainScreen step={1} onNext={() => setSubView('explain2')} onPrev={() => { setSubView('list'); loadSubTests(); }} />;
  }
  if (subView === 'explain2') {
    return <ExplainScreen step={2} onNext={() => setSubView('explain3')} onPrev={() => setSubView('explain1')} />;
  }
  if (subView === 'explain3') {
    return <ExplainScreen step={3} onNext={() => setSubView('test')} onPrev={() => setSubView('explain2')} />;
  }
  if (subView === 'test' && currentSubTestId) {
    return <EmotionTest testId={currentSubTestId} onDone={onSubTestDone} />;
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#F2F4F6' }}>
      <PageHeader title="얼굴 표정 인식 검사 (FER)" onBack={() => navigate('/cognitive')} />
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

// ─── Emotion Test ─────────────────────────────────────────────────────────────

const ANSWER_TIMER_MS = 10000;
const BLUR_TIMER_MS = 500;

type TestPhase = 'focus' | 'question' | 'blur' | 'answer';

function EmotionTest({ testId, onDone }: { testId: string; onDone: () => void }) {
  const questions = useRef<FacialItem[]>(getShuffledFacialData().slice(0, 28));
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<TestPhase>('focus');
  const [remainMs, setRemainMs] = useState(0);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
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
      setSelectedEmotion(null);
      setPhase('focus');
    }
  }, [questions, submitAll]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCountdown = useCallback((durationMs: number, onExpire: () => void) => {
    if (timerRef.current) clearInterval(timerRef.current);
    startTimeRef.current = Date.now();
    setRemainMs(durationMs);
    timerRef.current = setInterval(() => {
      const remain = durationMs - (Date.now() - startTimeRef.current);
      if (remain <= 0) {
        clearInterval(timerRef.current!);
        setRemainMs(0);
        onExpire();
      } else {
        setRemainMs(remain);
      }
    }, 50);
  }, []);

  const beginAnswerPhase = useCallback(() => {
    setPhase('answer');
    startTimeRef.current = Date.now();
    startCountdown(ANSWER_TIMER_MS, () => {
      const q = questions.current[indexRef.current];
      results.current.push({ question: q.imageName, userAnswer: null, isCorrect: false, responseTime: ANSWER_TIMER_MS / 1000 });
      goNext();
    });
  }, [startCountdown, questions, goNext]);

  const beginBlurPhase = useCallback(() => {
    setPhase('blur');
    startCountdown(BLUR_TIMER_MS, beginAnswerPhase);
  }, [startCountdown, beginAnswerPhase]);

  const beginQuestionPhase = useCallback(() => {
    const q = questions.current[indexRef.current];
    setPhase('question');
    startCountdown(q.durationMs, beginBlurPhase);
  }, [startCountdown, questions, beginBlurPhase]);

  const handleAnswer = (emotion: string) => {
    if (phase !== 'answer' || selectedEmotion) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedEmotion(emotion);
    const rt = parseFloat(((Date.now() - startTimeRef.current) / 1000).toFixed(3));
    const q = questions.current[indexRef.current];
    results.current.push({ question: q.imageName, userAnswer: emotion, isCorrect: emotion === q.emotionName, responseTime: rt });
    setTimeout(goNext, 200);
  };

  const q: FacialItem = questions.current[Math.min(index, questions.current.length - 1)];
  const totalTimerMs = phase === 'question' ? q.durationMs : phase === 'blur' ? BLUR_TIMER_MS : ANSWER_TIMER_MS;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ padding: '12px 5% 0' }}>
        <div style={{ height: 6, background: '#E5E8EB', borderRadius: 999 }}>
          <div style={{
            height: '100%',
            width: `${(remainMs / totalTimerMs) * 100}%`,
            background: '#2C74DB', borderRadius: 999, transition: 'width 0.05s linear',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#868E96" strokeWidth="2"/>
              <path d="M12 7v5l3 3" stroke="#868E96" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 'var(--fs-xs)', color: '#868E96' }}>제시 시간</span>
          </div>
          <span style={{ fontSize: 'var(--fs-xs)', color: '#868E96' }}>
            {String(Math.floor(remainMs / 1000)).padStart(2, '0')}.{String(Math.floor((remainMs % 1000) / 10)).padStart(2, '0')}초
          </span>
        </div>
      </div>

      {/* Face image / blur / answer phase */}
      {(phase === 'question' || phase === 'blur') && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{
            flex: 1, margin: '16px 5%', borderRadius: 12,
            background: phase === 'blur' ? '#333D4B' : '#F9FAFB',
            border: '1px solid #E5E8EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            {phase === 'question' && (
              <img src={ferImageUrl(q.imageName)} alt="" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
            )}
          </div>
          <div style={{ textAlign: 'center', paddingBottom: 20, fontSize: 'var(--fs-sm)', color: '#8B95A1' }}>
            {index + 1} / {total}
          </div>
        </div>
      )}

      {phase === 'answer' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '12px 5% 20px' }}>
          <div style={{ fontSize: 'var(--fs-body)', fontWeight: 700, color: '#191F28', marginBottom: 16, textAlign: 'center' }}>
            {q.sex === '남자' ? '남자' : '여자'}의 감정을 선택해 주세요
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, width: 'min(760px, 100%)', alignSelf: 'center' }}>
            {EMOTION_LABELS.map(emotion => (
              <button
                key={emotion}
                onClick={() => handleAnswer(emotion)}
                disabled={!!selectedEmotion}
                style={{
                  padding: '14px 4px', borderRadius: 12,
                  background: selectedEmotion === emotion ? '#2C74DB' : '#F2F4F6',
                  border: `1px solid ${selectedEmotion === emotion ? '#2C74DB' : '#E5E8EB'}`,
                  color: selectedEmotion === emotion ? '#fff' : '#333D4B',
                  fontSize: 'var(--fs-base)', fontWeight: 600,
                  cursor: selectedEmotion ? 'default' : 'pointer',
                }}
              >{emotion}</button>
            ))}
          </div>
          <div style={{ textAlign: 'center', paddingTop: 16, fontSize: 'var(--fs-sm)', color: '#8B95A1' }}>
            {index + 1} / {total}
          </div>
        </div>
      )}

      {phase === 'focus' && (
        <FocusOverlay onDone={beginQuestionPhase} />
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
