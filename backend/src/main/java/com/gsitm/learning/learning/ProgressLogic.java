package com.gsitm.learning.learning;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * PRD §7 — 시청 구간 누적 로직 (순수 함수).
 * 프로토타입 frontend/lib/intervals.ts 의 Java 포팅이며 동작 규격의 원본은 PRD §7.2/§7.3.
 */
public final class ProgressLogic {
    private ProgressLogic() {}

    public static final double MERGE_GAP_SEC = 1.0;
    public static final int MAX_RATE = 2;
    public static final double SLACK = 1.5;
    public static final double COMPLETE_PERCENT = 90.0;

    /** 겹치거나 맞닿은(gap ≤ 1s) 구간을 합집합으로 병합 */
    public static List<Interval> merge(List<Interval> list) {
        if (list.isEmpty()) return List.of();
        List<Interval> sorted = new ArrayList<>(list);
        sorted.sort(Comparator.comparingDouble(Interval::start));
        List<Interval> out = new ArrayList<>();
        double curStart = sorted.get(0).start();
        double curEnd = sorted.get(0).end();
        for (int i = 1; i < sorted.size(); i++) {
            Interval iv = sorted.get(i);
            if (iv.start() <= curEnd + MERGE_GAP_SEC) {
                curEnd = Math.max(curEnd, iv.end());
            } else {
                out.add(new Interval(curStart, curEnd));
                curStart = iv.start();
                curEnd = iv.end();
            }
        }
        out.add(new Interval(curStart, curEnd));
        return out;
    }

    public static double watchedSec(List<Interval> merged) {
        return merged.stream().mapToDouble(Interval::length).sum();
    }

    /** 진도율(%) 소수 1자리 — FR-L-04 */
    public static double percent(List<Interval> merged, int durationSec) {
        if (durationSec <= 0) return 0;
        return Math.min(100.0, Math.round(watchedSec(merged) / durationSec * 1000) / 10.0);
    }

    public record Validation(List<Interval> accepted, List<Rejected> rejected) {}
    public record Rejected(Interval interval, String reason) {}

    /** 범위 검증 — §7.3: 0 ≤ start < end ≤ duration (+1초 프레임 오차 허용) */
    public static Validation validateRange(List<Interval> incoming, int durationSec) {
        List<Interval> accepted = new ArrayList<>();
        List<Rejected> rejected = new ArrayList<>();
        for (Interval iv : incoming) {
            boolean bad = !Double.isFinite(iv.start()) || !Double.isFinite(iv.end())
                || iv.start() < 0 || iv.end() <= iv.start() || iv.end() > durationSec + 1;
            if (bad) rejected.add(new Rejected(iv, "RANGE"));
            else accepted.add(new Interval(iv.start(), Math.min(iv.end(), durationSec)));
        }
        return new Validation(accepted, rejected);
    }

    /** 최대 증가량 검증 — §7.3: 물리적으로 불가능한 보고 거부 */
    public static boolean violatesMaxGain(double prevWatchedSec, double nextWatchedSec, long elapsedMs) {
        double gain = nextWatchedSec - prevWatchedSec;
        double allowed = (elapsedMs / 1000.0) * MAX_RATE * SLACK + 3;
        return gain > allowed;
    }

    /**
     * 이어보기 지점 — PRD §6.4 동작규칙 1.
     * lastPosition이 시청 구간 안이면 그 구간 끝으로 스냅.
     */
    public static int resumePosition(List<Interval> merged, double lastPositionSec, int durationSec) {
        double pos = lastPositionSec;
        for (Interval iv : merged) {
            if (lastPositionSec >= iv.start() - 1 && lastPositionSec <= iv.end() + 1) {
                pos = iv.end();
                break;
            }
        }
        if (pos < 10 || pos >= durationSec - 5) return 0;
        return (int) Math.round(pos);
    }
}
