import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cognitiveApi } from '../../api/cognitive';
import { SubTestInfo } from '../../types/cognitive';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import {
  IconVPA, IconMST, IconSPS, IconFER,
  IconComplete, IconInProgress,
} from '../../components/cognitive/CognitiveIcons';

const TEST_ID = 'CA01';

interface TestMeta {
  code: string;
  labelKo: string;
  labelEn: string;
  description: string;
  path: string;
  Icon: React.FC<{ size?: number }>;
}

const TEST_META: TestMeta[] = [
  { code: 'VPA', labelKo: '단어 연합 기억 검사', labelEn: 'VPA', description: '새로운 정보를 학습하고 기억하는 능력', path: '/cognitive/vpa', Icon: IconVPA },
  { code: 'MST', labelKo: '유사성 기억 변별 검사', labelEn: 'MST', description: '기억의 세부사항을 구분하는 능력', path: '/cognitive/mst', Icon: IconMST },
  { code: 'SPS', labelKo: '공간 패턴 변별 검사', labelEn: 'SPS', description: '공간적 정보를 기억하고 사용하는 능력', path: '/cognitive/sps', Icon: IconSPS },
  { code: 'FER', labelKo: '얼굴 표정 인식 검사', labelEn: 'FER', description: '사회적 상호작용에 중요한 결정 인식 능력', path: '/cognitive/fer', Icon: IconFER },
];

export default function CognitivePage() {
  const navigate = useNavigate();
  const [subTests, setSubTests] = useState<Record<string, SubTestInfo>>({});
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const loadSubTests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cognitiveApi.getSubTestList(TEST_ID);
      const map: Record<string, SubTestInfo> = {};
      res.rows.forEach(row => { if (row.testCode) map[row.testCode] = row; });
      setSubTests(map);
    } catch {
      setErrorModal('검사 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSubTests(); }, [loadSubTests]);

  const handlePress = async (meta: TestMeta) => {
    const info = subTests[meta.code];
    if (!info?.testId || info.testProgress === 100) return;
    setStarting(true);
    try {
      const res = await cognitiveApi.startTest(info.testId);
      if (res.code === '200') {
        navigate(meta.path, { state: { testId: info.testId } });
      } else {
        setErrorModal(res.message || '검사를 시작할 수 없습니다.');
      }
    } catch {
      setErrorModal('검사 시작 중 오류가 발생했습니다.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#333D4B' }}>
      {/* Header — dark bg, white back arrow */}
      <div style={{
        height: 56, display: 'flex', alignItems: 'center',
        paddingLeft: 8, flexShrink: 0,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: 10, color: '#fff', fontSize: 'var(--fs-lg)', lineHeight: 1 }}
        >
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none">
            <path d="M9 1L1 9L9 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Title */}
      <div style={{ padding: '0 20px 20px', flexShrink: 0 }}>
        <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: '#fff' }}>인지 기능 검사</div>
      </div>

      {/* Cards area */}
      <div className="cog-card-list" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px', display: 'flex', flexDirection: 'column' }}>
        {loading
          ? <div style={{ flex: 1 }}><LoadingSpinner /></div>
          : TEST_META.map((meta) => {
              const info = subTests[meta.code];
              const progress = info?.testProgress ?? 0;
              const done = progress === 100;
              const inProgress = progress > 0 && progress < 100;
              const { Icon } = meta;

              return (
                <button
                  key={meta.code}
                  className="cog-card"
                  onClick={() => handlePress(meta)}
                  disabled={done || starting}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    background: '#fff',
                    borderRadius: 20,
                    border: `1px solid ${done ? '#E5E8EB' : '#2C74DB'}`,
                    textAlign: 'left',
                    opacity: done ? 0.85 : 1,
                    boxShadow: done ? 'none' : '0 2px 8px rgba(44,116,219,0.12)',
                    cursor: done ? 'default' : 'pointer',
                  }}
                >
                  {/* Title row */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '0 20px',
                  }}>
                    {/* Icon with state overlay */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Icon size={48} />
                      {inProgress && (
                        <div style={{ position: 'absolute', inset: 0 }}><IconInProgress size={48} /></div>
                      )}
                      {done && (
                        <div style={{ position: 'absolute', inset: 0 }}><IconComplete size={48} /></div>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontSize: 'var(--fs-card-title)', fontWeight: 700, color: '#191F28' }}>{meta.labelKo}</span>
                        <span style={{ fontSize: 'var(--fs-card-badge)', fontWeight: 600, color: '#2365CC' }}>{meta.labelEn}</span>
                      </div>
                      <div style={{ fontSize: 'var(--fs-card-desc)', color: '#6B7684', marginTop: 2, lineHeight: 1.4 }}>{meta.description}</div>
                    </div>
                  </div>

                  {/* Progress bar + % — only shown when in progress or done */}
                  {progress > 0 && (
                    <div style={{ padding: '12px 20px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 'var(--fs-progress-lbl)', color: '#8B95A1' }}>진행률</span>
                        <span style={{ fontSize: 'var(--fs-progress-lbl)', fontWeight: 700, color: '#2C74DB' }}>{progress}%</span>
                      </div>
                      <div style={{ height: 4, background: '#E5E8EB', borderRadius: 999 }}>
                        <div style={{
                          height: '100%', width: `${progress}%`,
                          background: done ? '#03B26C' : '#2C74DB',
                          borderRadius: 999, transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  )}
                </button>
              );
            })
        }
      </div>

      {starting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <LoadingSpinner />
        </div>
      )}

      {errorModal && (
        <Modal title="오류" message={errorModal} onConfirm={() => setErrorModal(null)} />
      )}
    </div>
  );
}
