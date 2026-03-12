// ProgramScheduleDetail.jsx - 프로그램 상세 페이지 (포스터 상단 표시, UI 개선)
// 기존 /program/schedule/:id 컴포넌트를 이 파일로 교체하세요

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { resolveImageUrl } from "../../../shared/utils/publicAssetUrl";

/**
 * ✅ 개선 포인트:
 * 1. 포스터 이미지가 상단에 잘리지 않고 전체 표시 (object-fit: contain)
 * 2. 히어로 영역: 이미지 위에 제목/배지 오버레이 → 이미지 아래로 이동
 * 3. 카드형 섹션 유지 + 가독성 개선
 * 4. 소속 행사 사이드 패널 유지
 */

const ProgramScheduleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ── 기존 API 호출 방식 유지 (경로는 팀 코드에 맞게 조정) ──
    axios.get(`/api/programs/schedule/${id}`)
      .then(res => setProgram(res.data.data))
      .catch(() => setProgram(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={styles.loading}>불러오는 중...</div>;
  if (!program) return <div style={styles.loading}>프로그램 정보를 찾을 수 없습니다.</div>;

  const {
    title,
    description,
    date,
    startTime,
    endTime,
    location,
    category,
    status,
    imageUrl,       // 포스터 이미지 URL
    speakers = [],  // 연사 목록
    parentEvent,    // 소속 행사
  } = program;

  const statusLabel = {
    ONGOING: '진행 중',
    UPCOMING: '예정',
    ENDED: '종료',
  }[status] || status;

  const statusColor = {
    ONGOING: '#10B981',
    UPCOMING: '#3B82F6',
    ENDED: '#9E9E9E',
  }[status] || '#10B981';

  return (
    <div style={styles.page}>

      {/* ══════════════════════════════════════
          포스터 영역 (잘리지 않게 전체 표시)
      ══════════════════════════════════════ */}
      {imageUrl && (
        <div style={styles.posterSection}>
          <img
            src={resolveImageUrl(imageUrl)}
            alt={`${title} 포스터`}
            style={styles.posterImg}
          />
        </div>
      )}

      {/* ══════════════════════════════════════
          제목 + 배지 (이미지 아래, 잘림 없음)
      ══════════════════════════════════════ */}
      <div style={styles.titleSection}>
        <div style={styles.badgeRow}>
          <span style={{
            ...styles.statusBadge,
            color: statusColor,
            borderColor: statusColor,
            background: `${statusColor}18`,
          }}>
            ● {statusLabel}
          </span>
          {category && (
            <span style={styles.categoryBadge}>{category}</span>
          )}
        </div>
        <h1 style={styles.title}>{title}</h1>
      </div>

      {/* ══════════════════════════════════════
          본문 레이아웃: 메인 + 사이드
      ══════════════════════════════════════ */}
      <div style={styles.layout}>

        {/* ── 메인 컬럼 ── */}
        <div style={styles.main}>

          {/* 프로그램 정보 카드 */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              <span style={styles.cardIcon}>📋</span> 프로그램 정보
            </h2>
            <div style={styles.infoGrid}>
              <InfoItem icon="📅" label="날짜" value={date} color="#3B82F6" />
              <InfoItem icon="🕐" label="시간" value={`${startTime} ~ ${endTime}`} color="#F59E0B" />
              <InfoItem icon="📍" label="장소" value={location || '장소 미정'} color="#10B981" />
              <InfoItem icon="🏷️" label="카테고리" value={category} color="#8B5CF6" />
            </div>
          </div>

          {/* 프로그램 소개 카드 */}
          {description && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>
                <span style={styles.cardIcon}>📖</span> 프로그램 소개
              </h2>
              <p style={styles.descriptionText}>{description}</p>
            </div>
          )}

          {/* 연사 정보 카드 */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              <span style={styles.cardIcon}>🎤</span> 연사 정보
              <span style={styles.countBadge}>{speakers.length}명</span>
            </h2>
            {speakers.length === 0 ? (
              <p style={styles.emptyText}>등록된 연사가 없습니다.</p>
            ) : (
              <div style={styles.speakerList}>
                {speakers.map((s, i) => (
                  <div key={i} style={styles.speakerItem}>
                    {s.imageUrl && (
                      <img src={resolveImageUrl(s.imageUrl)} alt={s.name} style={styles.speakerAvatar} />
                    )}
                    <div>
                      <p style={styles.speakerName}>{s.name}</p>
                      <p style={styles.speakerRole}>{s.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── 사이드 컬럼 ── */}
        <div style={styles.side}>
          <div style={styles.sideCard}>
            <h3 style={styles.sideTitle}>
              <span>🔗</span> 소속 행사
            </h3>
            {parentEvent ? (
              <div
                style={styles.eventItem}
                onClick={() => navigate(`/event/${parentEvent.id}`)}
              >
                {parentEvent.imageUrl && (
                  <img src={resolveImageUrl(parentEvent.imageUrl)} alt={parentEvent.title} style={styles.eventThumb} />
                )}
                <div>
                  <p style={styles.eventName}>{parentEvent.title}</p>
                  <p style={styles.eventSub}>{parentEvent.sub}</p>
                </div>
              </div>
            ) : (
              <p style={styles.emptyText}>소속 행사 없음</p>
            )}

            <button
              style={styles.primaryBtn}
              onClick={() => navigate(`/event/${parentEvent?.id}/programs`)}
            >
              &gt; 전체 프로그램 보기
            </button>
            <button
              style={styles.secondaryBtn}
              onClick={() => navigate(-1)}
            >
              ← 뒤로 가기
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

/* ── 서브 컴포넌트: 정보 아이템 ── */
const InfoItem = ({ icon, label, value, color }) => (
  <div style={infoStyles.wrap}>
    <div style={{ ...infoStyles.iconBox, background: `${color}15` }}>
      <span style={{ fontSize: '18px' }}>{icon}</span>
    </div>
    <div>
      <p style={infoStyles.label}>{label}</p>
      <p style={infoStyles.value}>{value || '-'}</p>
    </div>
  </div>
);

const infoStyles = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
  },
  iconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: {
    fontSize: '11px',
    color: '#94A3B8',
    margin: 0,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  value: {
    fontSize: '15px',
    color: '#1E293B',
    margin: 0,
    fontWeight: '600',
  },
};

/* ── 스타일 ── */
const styles = {
  page: {
    minHeight: '100vh',
    background: '#F8FAFC',
    paddingBottom: '60px',
  },
  loading: {
    padding: '60px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '15px',
  },

  /* 포스터 섹션: 이미지 전체 표시, 잘림 없음 */
  posterSection: {
    width: '100%',
    background: '#0F172A',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  posterImg: {
    width: '100%',
    maxWidth: '900px',
    height: 'auto',          // ← 높이 auto: 이미지 비율 그대로 표시, 잘림 없음
    objectFit: 'contain',    // ← contain: 절대 잘리지 않음
    display: 'block',
  },

  /* 제목 섹션 */
  titleSection: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '28px 24px 0',
  },
  badgeRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
    alignItems: 'center',
  },
  statusBadge: {
    fontSize: '13px',
    fontWeight: '700',
    padding: '4px 14px',
    borderRadius: '20px',
    border: '1.5px solid',
  },
  categoryBadge: {
    fontSize: '13px',
    color: '#6366F1',
    background: '#EEF2FF',
    padding: '4px 14px',
    borderRadius: '20px',
    border: '1px solid #C7D2FE',
    fontWeight: '600',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },

  /* 레이아웃 */
  layout: {
    maxWidth: '1200px',
    margin: '24px auto 0',
    padding: '0 24px',
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '24px',
    alignItems: 'start',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  side: {
    position: 'sticky',
    top: '24px',
  },

  /* 카드 */
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: '1px solid #F1F5F9',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1E293B',
    margin: '0 0 20px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  cardIcon: {
    fontSize: '18px',
  },
  countBadge: {
    marginLeft: '4px',
    fontSize: '12px',
    background: '#F1F5F9',
    color: '#64748B',
    padding: '2px 8px',
    borderRadius: '20px',
    fontWeight: '600',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px 16px',
  },
  descriptionText: {
    fontSize: '15px',
    color: '#475569',
    lineHeight: '1.7',
    margin: 0,
  },
  emptyText: {
    fontSize: '14px',
    color: '#94A3B8',
    margin: 0,
  },
  speakerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  speakerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  speakerAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  speakerName: {
    fontWeight: '600',
    color: '#1E293B',
    margin: 0,
    fontSize: '14px',
  },
  speakerRole: {
    color: '#94A3B8',
    margin: 0,
    fontSize: '12px',
  },

  /* 사이드 카드 */
  sideCard: {
    background: '#fff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: '1px solid #F1F5F9',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sideTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#64748B',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  eventItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '10px',
    transition: 'background 0.15s',
  },
  eventThumb: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    objectFit: 'cover',
  },
  eventName: {
    fontWeight: '600',
    color: '#1E293B',
    margin: 0,
    fontSize: '14px',
  },
  eventSub: {
    color: '#94A3B8',
    margin: 0,
    fontSize: '12px',
  },
  primaryBtn: {
    width: '100%',
    padding: '12px',
    background: '#1D4ED8',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
  },
  secondaryBtn: {
    width: '100%',
    padding: '12px',
    background: '#fff',
    color: '#475569',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
  },
};

export default ProgramScheduleDetail;
