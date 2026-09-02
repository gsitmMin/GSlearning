"use client";
/**
 * Vimeo 플레이어 시뮬레이터.
 *
 * 이벤트 계약을 @vimeo/player와 동일하게 유지합니다
 * (timeupdate / seeked / play / pause / ended / playbackratechange — PRD §13-10).
 * 실제 연동 시 이 컴포넌트만 <iframe> + Player SDK 구현으로 교체하면
 * 시청 페이지와 진도 추적 훅은 변경 없이 동작합니다.
 */
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { Segment } from "@/lib/types";
import type { Interval } from "@/lib/types";
import { fmtClock } from "@/lib/format";

export type PlayerHandle = {
  setCurrentTime: (sec: number) => void;
  getCurrentTime: () => number;
  play: () => void;
  pause: () => void;
};

type Props = {
  durationSec: number;
  segments: Segment[];
  watchedIntervals: Interval[];
  onTimeUpdate: (sec: number, playing: boolean) => void;
  onSeeked: (fromSec: number, toSec: number) => void;
  onPlayState: (playing: boolean) => void;
  onEnded: () => void;
};

const RATES = [1, 1.25, 1.5, 2];
const TICK_MS = 250;

const MockPlayer = forwardRef<PlayerHandle, Props>(function MockPlayer(
  { durationSec, segments, watchedIntervals, onTimeUpdate, onSeeked, onPlayState, onEnded },
  ref
) {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const curRef = useRef(0);
  const playRef = useRef(false);
  const rateRef = useRef(1);

  const setTime = (sec: number) => {
    const t = Math.min(Math.max(0, sec), durationSec);
    curRef.current = t;
    setCurrent(t);
  };

  const setPlay = (p: boolean) => {
    playRef.current = p;
    setPlaying(p);
    onPlayState(p);
  };

  useImperativeHandle(ref, () => ({
    setCurrentTime: (sec: number) => {
      const from = curRef.current;
      setTime(sec);
      onSeeked(from, curRef.current);
    },
    getCurrentTime: () => curRef.current,
    play: () => setPlay(true),
    pause: () => setPlay(false),
  }));

  // 재생 틱 — 실제 플레이어의 timeupdate에 해당
  useEffect(() => {
    const t = setInterval(() => {
      if (!playRef.current) return;
      const next = curRef.current + (TICK_MS / 1000) * rateRef.current;
      if (next >= durationSec) {
        curRef.current = durationSec;
        setCurrent(durationSec);
        setPlay(false);
        onEnded();
        return;
      }
      curRef.current = next;
      setCurrent(next);
      onTimeUpdate(next, true);
    }, TICK_MS);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationSec]);

  const seekTo = (sec: number) => {
    const from = curRef.current;
    setTime(sec);
    onSeeked(from, curRef.current);
  };

  const onTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seekTo(ratio * durationSec);
  };

  const cycleRate = () => {
    const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
    rateRef.current = next;
    setRate(next);
  };

  const segIdx = segments.findIndex((s) => current >= s.startSec && current < s.endSec);
  const seg = segIdx >= 0 ? segments[segIdx] : undefined;
  const hue = 205 + segIdx * 14;

  return (
    <div
      style={{
        background: "var(--player-bg)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        color: "#e8edf2",
        boxShadow: "var(--shadow)",
      }}
    >
      {/* 화면 영역 */}
      <button
        onClick={() => setPlay(!playing)}
        aria-label={playing ? "일시정지" : "재생"}
        style={{
          width: "100%",
          aspectRatio: "16/9",
          border: 0,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "34px 16px 16px",
          background: `radial-gradient(120% 120% at 20% 10%, hsl(${hue} 35% 22%), hsl(${hue} 40% 9%) 70%)`,
          transition: "background 0.6s ease",
        }}
      >
        <span
          style={{
            position: "absolute", top: 14, left: 16,
            fontSize: 11, letterSpacing: "0.1em", opacity: 0.5, whiteSpace: "nowrap",
          }}
        >
          VIMEO PLAYER 시뮬레이터
        </span>

        {!playing && (
          <span
            aria-hidden
            style={{
              width: 58, height: 58, borderRadius: "50%", flexShrink: 0,
              background: "rgb(232 237 242 / 0.14)", border: "1px solid rgb(232 237 242 / 0.4)",
              display: "grid", placeItems: "center", fontSize: 21, paddingLeft: 4,
            }}
          >
            ▶
          </span>
        )}
        <span
          className="mono"
          style={{
            fontSize: "clamp(26px, 7vw, 42px)", fontWeight: 600,
            letterSpacing: "-0.02em", lineHeight: 1, whiteSpace: "nowrap",
          }}
        >
          {fmtClock(current)}
        </span>
        {seg && (
          <span
            style={{
              fontSize: 13.5, opacity: 0.75, textAlign: "center", maxWidth: "90%",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {seg.sequenceNo}. {seg.title}
          </span>
        )}
      </button>

      {/* 타임라인 — 시청 구간(브라스) + 챕터 눈금 + 재생 위치 */}
      <div
        role="slider"
        aria-label="재생 위치"
        aria-valuemin={0}
        aria-valuemax={durationSec}
        aria-valuenow={Math.round(current)}
        tabIndex={0}
        onClick={onTrackClick}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") seekTo(current + 10);
          if (e.key === "ArrowLeft") seekTo(current - 10);
        }}
        style={{ position: "relative", height: 22, cursor: "pointer", background: "rgb(255 255 255 / 0.06)" }}
      >
        {watchedIntervals.map((iv, i) => (
          <span
            key={i}
            style={{
              position: "absolute", top: 8, bottom: 8,
              left: `${(iv.start / durationSec) * 100}%`,
              width: `${((iv.end - iv.start) / durationSec) * 100}%`,
              background: "var(--progress)", opacity: 0.85, borderRadius: 2,
            }}
          />
        ))}
        {segments.map((s) => (
          <span
            key={s.id}
            style={{
              position: "absolute", top: 4, bottom: 4, width: 1,
              left: `${(s.startSec / durationSec) * 100}%`,
              background: "rgb(232 237 242 / 0.35)",
            }}
          />
        ))}
        <span
          style={{
            position: "absolute", top: 0, bottom: 0, width: 2,
            left: `calc(${(current / durationSec) * 100}% - 1px)`,
            background: "#fff",
          }}
        />
      </div>

      {/* 컨트롤 바 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", fontSize: 13, flexWrap: "nowrap" }}>
        <button onClick={() => setPlay(!playing)} style={ctrl} aria-label={playing ? "일시정지" : "재생"}>
          {playing ? "❚❚" : "▶"}
        </button>
        <button onClick={() => seekTo(current - 10)} style={ctrl} aria-label="10초 뒤로">-10초</button>
        <button onClick={() => seekTo(current + 10)} style={ctrl} aria-label="10초 앞으로">+10초</button>
        <span className="mono" style={{ marginLeft: 4, fontSize: 12, opacity: 0.85, whiteSpace: "nowrap" }}>
          {fmtClock(current)} / {fmtClock(durationSec)}
        </span>
        <span style={{ flex: 1 }} />
        <button onClick={cycleRate} style={ctrl} aria-label="재생 속도">
          {rate.toFixed(2).replace(/\.?0+$/, "")}×
        </button>
        <button style={{ ...ctrl, opacity: 0.6 }} title="프로토타입에서는 동작하지 않습니다">CC</button>
      </div>
    </div>
  );
});

const ctrl: React.CSSProperties = {
  border: "1px solid rgb(232 237 242 / 0.25)",
  background: "transparent",
  color: "inherit",
  borderRadius: 6,
  padding: "4px 9px",
  fontSize: 12.5,
  whiteSpace: "nowrap",
  flexShrink: 0,
};

export default MockPlayer;
