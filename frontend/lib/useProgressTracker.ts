"use client";
/**
 * PRD §7.2 클라이언트 측 — 시청 구간 수집·배치 전송 훅.
 *
 * - timeupdate 간격이 연속 재생 임계값 이내면 열린 구간을 연장, 아니면 분리 (Seek 간주)
 * - 10초 주기 + pause / ended / 페이지 이탈 시 전송 (FR-L-06)
 * - 페이지 로드 이후의 전체 구간 리스트를 매번 전송 — 서버 병합이 멱등이므로 안전 (FR-L-07)
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Interval, ProgressResponse, VideoProgress } from "./types";
import { mergeIntervals } from "./intervals";

export type DevLog = {
  at: string;
  note: string;
  ok: boolean;
};

const FLUSH_MS = 10_000;
const CONTINUOUS_GAP = 1.5; // 초 — 이보다 크면 Seek으로 간주

export function useProgressTracker(contentId: string, initial: VideoProgress | null) {
  const [server, setServer] = useState<VideoProgress | null>(initial);
  const [log, setLog] = useState<DevLog[]>([]);
  const localRef = useRef<Interval[]>([]);
  const openRef = useRef<Interval | null>(null);
  const rateRef = useRef(1);
  const lastPosRef = useRef(initial?.lastPositionSec ?? 0);
  const inflightRef = useRef(false);

  useEffect(() => {
    if (initial) setServer(initial);
  }, [initial]);

  const pushLog = useCallback((note: string, ok: boolean) => {
    const at = new Date().toLocaleTimeString("ko-KR", { hour12: false });
    setLog((l) => [{ at, note, ok }, ...l].slice(0, 30));
  }, []);

  const closeOpen = useCallback(() => {
    const open = openRef.current;
    if (open && open.end - open.start >= 0.5) {
      localRef.current = mergeIntervals([...localRef.current, open]);
    }
    openRef.current = null;
  }, []);

  const flush = useCallback(
    async (reason: string) => {
      if (inflightRef.current) return;
      const open = openRef.current;
      const snapshot = mergeIntervals([
        ...localRef.current,
        ...(open && open.end - open.start >= 0.5 ? [open] : []),
      ]);
      if (snapshot.length === 0) return;
      inflightRef.current = true;
      try {
        const res = await fetch(`/api/learning/contents/${contentId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intervals: snapshot,
            lastPosition: lastPosRef.current,
            playbackRate: rateRef.current,
            clientSentAt: Date.now(),
          }),
          keepalive: true,
        });
        const json = (await res.json()) as { success: boolean; data: ProgressResponse };
        if (json.success) {
          setServer(json.data.progress);
          const rej = json.data.rejected;
          pushLog(
            `${reason} — 구간 ${snapshot.length}개 전송 → ${json.data.progress.percent}%` +
              (rej.length ? ` (거부 ${rej.length}: ${rej[0].reason})` : ""),
            rej.length === 0
          );
        }
      } catch {
        pushLog(`${reason} — 전송 실패 (재시도 예정)`, false);
      } finally {
        inflightRef.current = false;
      }
    },
    [contentId, pushLog]
  );

  /** MockPlayer(실제로는 @vimeo/player)의 timeupdate 핸들러 */
  const onTimeUpdate = useCallback((sec: number) => {
    lastPosRef.current = sec;
    const open = openRef.current;
    if (!open) {
      openRef.current = { start: sec, end: sec };
      return;
    }
    if (sec >= open.end && sec - open.end <= CONTINUOUS_GAP * rateRef.current) {
      open.end = sec; // 연속 재생 — 구간 연장
    } else {
      // 불연속 — 구간 분리
      openRef.current = null;
      if (open.end - open.start >= 0.5) {
        localRef.current = mergeIntervals([...localRef.current, open]);
      }
      openRef.current = { start: sec, end: sec };
    }
  }, []);

  /** seeked — 건너뛴 구간은 시청으로 집계하지 않음 (FR-L-05) */
  const onSeeked = useCallback(
    (_from: number, to: number) => {
      closeOpen();
      openRef.current = { start: to, end: to };
      lastPosRef.current = to;
    },
    [closeOpen]
  );

  const onPlayState = useCallback(
    (playing: boolean) => {
      if (!playing) {
        closeOpen();
        void flush("일시정지");
      }
    },
    [closeOpen, flush]
  );

  const onEnded = useCallback(() => {
    closeOpen();
    void flush("재생 종료");
  }, [closeOpen, flush]);

  // 10초 주기 + 페이지 이탈 시 전송
  useEffect(() => {
    const t = setInterval(() => void flush("주기 전송"), FLUSH_MS);
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush("페이지 이탈");
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onHide);
      void flush("페이지 종료");
    };
  }, [flush]);

  /** 개발자 패널 — §7.4 마지막 시나리오 재현: 조작된 전체 구간 전송 */
  const sendForged = useCallback(
    async (durationSec: number) => {
      const res = await fetch(`/api/learning/contents/${contentId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intervals: [{ start: 0, end: durationSec }],
          lastPosition: durationSec,
          playbackRate: 1,
          clientSentAt: Date.now(),
        }),
      });
      const json = (await res.json()) as { success: boolean; data: ProgressResponse };
      const rejected = json.data.rejected.length > 0;
      setServer(json.data.progress);
      pushLog(
        rejected
          ? `조작 요청 테스트 — 서버가 거부 (${json.data.rejected[0].reason}), 진도 ${json.data.progress.percent}% 유지`
          : `조작 요청 테스트 — 통과됨 (검증 실패!)`,
        rejected
      );
    },
    [contentId, pushLog]
  );

  const localMerged = useCallback((): Interval[] => {
    const open = openRef.current;
    return mergeIntervals([...localRef.current, ...(open ? [open] : [])]);
  }, []);

  return {
    server,
    log,
    onTimeUpdate,
    onSeeked,
    onPlayState,
    onEnded,
    setRate: (r: number) => (rateRef.current = r),
    sendForged,
    localMerged,
  };
}
