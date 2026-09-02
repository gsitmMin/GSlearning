/** PRD §8 데이터 모델의 프론트엔드 표현 (프로토타입) */

export type Segment = {
  id: string;
  sequenceNo: number;
  startSec: number;
  endSec: number;
  title: string;
  summary?: string;
};

export type Content = {
  id: string;
  sourceType: "INTERNAL_VIMEO";
  title: string;
  description: string;
  durationSec: number;
  difficulty: "입문" | "초급" | "중급" | "고급";
  publishStatus: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  availabilityStatus: "AVAILABLE" | "REMOVED";
  /** 실제 구현에서는 video_asset 테이블 (PRD §8) */
  providerVideoId: string;
  /** 목 썸네일 색상 (프로토타입 전용) */
  tone: number;
  orgScope: string;
  segments: Segment[];
  attachments: { name: string; size: string }[];
};

export type LearningItem = {
  id: string;
  contentId: string;
  required: boolean;
  minProgressPercent: number;
};

export type CourseModule = { id: string; title: string; items: LearningItem[] };

export type Course = {
  id: string;
  title: string;
  description: string;
  mandatory: boolean;
  dueOn?: string; // YYYY-MM-DD
  modules: CourseModule[];
};

export type Interval = { start: number; end: number };

export type VideoProgress = {
  contentId: string;
  intervals: Interval[];
  watchedSec: number;
  percent: number;
  lastPositionSec: number;
  completed: boolean;
  updatedAt: number;
};

/** POST /learning/contents/{id}/progress 요청 본문 (PRD §7.2) */
export type ProgressReport = {
  intervals: Interval[];
  lastPosition: number;
  playbackRate: number;
  clientSentAt: number;
};

export type ProgressResponse = {
  progress: VideoProgress;
  rejected: { interval: Interval; reason: string }[];
};
