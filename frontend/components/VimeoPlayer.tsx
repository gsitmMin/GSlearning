"use client";
/**
 * 실제 Vimeo 플레이어 — MockPlayer와 동일한 이벤트 계약 (PRD §13-10).
 * @vimeo/player의 timeupdate/seeked/play/pause/ended를 진도 추적 훅에 연결한다.
 */
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import Player from "@vimeo/player";
import type { PlayerHandle } from "./MockPlayer";

type Props = {
  videoId: string;
  embedHash?: string | null;
  onTimeUpdate: (sec: number, playing: boolean) => void;
  onSeeked: (fromSec: number, toSec: number) => void;
  onPlayState: (playing: boolean) => void;
  onEnded: () => void;
  onRateChange?: (rate: number) => void;
};

const VimeoPlayer = forwardRef<PlayerHandle, Props>(function VimeoPlayer(
  { videoId, embedHash, onTimeUpdate, onSeeked, onPlayState, onEnded, onRateChange },
  ref
) {
  const boxRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const curRef = useRef(0);
  const cb = useRef({ onTimeUpdate, onSeeked, onPlayState, onEnded, onRateChange });
  cb.current = { onTimeUpdate, onSeeked, onPlayState, onEnded, onRateChange };

  useEffect(() => {
    if (!boxRef.current) return;
    // StrictMode 이중 마운트 대응: @vimeo/player는 엘리먼트당 인스턴스를 캐시하므로
    // 마운트마다 새 호스트 엘리먼트를 만들어 충돌을 피한다.
    const host = document.createElement("div");
    boxRef.current.appendChild(host);
    // embedOptions는 PRD §13-11 — 서버 player API와 동일 값
    const url = embedHash
      ? (`https://player.vimeo.com/video/${videoId}?h=${embedHash}` as `https://player.vimeo.com/video/${string}`)
      : undefined;
    const player = new Player(host, {
      ...(url ? { url } : { id: Number(videoId) }),
      responsive: true,
      title: false,
      byline: false,
      portrait: false,
      autopause: false,
      playsinline: true,
      speed: true,
    });
    playerRef.current = player;

    // timeupdate 이벤트는 환경에 따라 유실될 수 있어 getCurrentTime 폴링으로 대체
    // (MockPlayer의 250ms 틱과 동일한 모델 — PRD §7.2)
    const playingRef = { current: false };
    const tick = setInterval(() => {
      if (!playingRef.current) return;
      void player.getCurrentTime().then((t) => {
        if (t !== curRef.current) {
          curRef.current = t;
          cb.current.onTimeUpdate(t, true);
        }
      }).catch(() => {});
    }, 400);

    player.on("seeked", (d) => {
      const from = curRef.current;
      curRef.current = d.seconds;
      cb.current.onSeeked(from, d.seconds);
    });
    player.on("play", () => {
      playingRef.current = true;
      cb.current.onPlayState(true);
    });
    player.on("pause", () => {
      playingRef.current = false;
      cb.current.onPlayState(false);
    });
    player.on("ended", () => {
      playingRef.current = false;
      cb.current.onEnded();
    });
    player.on("playbackratechange", (d) => cb.current.onRateChange?.(d.playbackRate));

    return () => {
      clearInterval(tick);
      playerRef.current = null;
      host.remove(); // 동기 제거 — destroy 지연 시 좀비 iframe 방지
      void player.destroy().catch(() => {});
    };
  }, [videoId, embedHash]);

  useImperativeHandle(ref, () => ({
    setCurrentTime: (sec: number) => {
      const from = curRef.current;
      void playerRef.current?.setCurrentTime(sec).then((t) => {
        curRef.current = t;
        cb.current.onSeeked(from, t);
      });
    },
    getCurrentTime: () => curRef.current,
    play: () => void playerRef.current?.play().catch(() => {}),
    pause: () => void playerRef.current?.pause(),
  }));

  return (
    <div
      ref={boxRef}
      style={{
        background: "var(--player-bg)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        boxShadow: "var(--shadow)",
      }}
    />
  );
});

export default VimeoPlayer;
