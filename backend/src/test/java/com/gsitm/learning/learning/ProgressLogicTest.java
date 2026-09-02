package com.gsitm.learning.learning;

import java.util.List;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

/** PRD §7.4 검증 시나리오 — frontend/lib/intervals.ts 포팅 동등성 확인 */
class ProgressLogicTest {

    @Test
    void 겹치는_구간은_합집합으로_병합된다() {
        var merged = ProgressLogic.merge(List.of(
            new Interval(0, 300), new Interval(295, 360), new Interval(1880, 2530)));
        assertThat(merged).containsExactly(new Interval(0, 360), new Interval(1880, 2530));
        assertThat(ProgressLogic.watchedSec(merged)).isEqualTo(1010);
    }

    @Test
    void 앞부분_반복_시청은_중복_집계되지_않는다() {
        var merged = ProgressLogic.merge(List.of(
            new Interval(0, 600), new Interval(0, 600), new Interval(0, 600)));
        assertThat(ProgressLogic.watchedSec(merged)).isEqualTo(600);
    }

    @Test
    void seek으로_건너뛴_구간은_퍼센트에_없다() {
        // 0초 → 59분 Seek 후 1분 시청 → 약 1.7% (07_poc:98)
        var merged = ProgressLogic.merge(List.of(new Interval(3540, 3600)));
        assertThat(ProgressLogic.percent(merged, 3600)).isEqualTo(1.7);
    }

    @Test
    void 범위를_벗어난_구간은_거부된다() {
        var v = ProgressLogic.validateRange(List.of(
            new Interval(100, 9999), new Interval(50, 40), new Interval(0, 10)), 900);
        assertThat(v.rejected()).hasSize(2);
        assertThat(v.accepted()).containsExactly(new Interval(0, 10));
    }

    @Test
    void 물리적으로_불가능한_증가량은_감지된다() {
        // 1초 만에 3600초 시청 보고
        assertThat(ProgressLogic.violatesMaxGain(0, 3600, 1000)).isTrue();
        // 10초 동안 2배속 시청(20초 증가)은 허용
        assertThat(ProgressLogic.violatesMaxGain(0, 20, 10_000)).isFalse();
    }

    @Test
    void 이어보기는_시청_구간_끝으로_스냅된다() {
        var merged = List.of(new Interval(0, 300), new Interval(1880, 2530));
        assertThat(ProgressLogic.resumePosition(merged, 3, 3600)).isEqualTo(300);   // 구간 안 → 끝으로
        assertThat(ProgressLogic.resumePosition(merged, 2530, 3600)).isEqualTo(2530);
        assertThat(ProgressLogic.resumePosition(merged, 1000, 3600)).isEqualTo(1000); // 구간 밖 → 그대로
        assertThat(ProgressLogic.resumePosition(List.of(), 4, 3600)).isEqualTo(0);   // 10초 미만 → 제안 안 함
        assertThat(ProgressLogic.resumePosition(merged, 3598, 3600)).isEqualTo(0);   // 끝 → 제안 안 함
    }
}
