package com.gsitm.learning.learning;

/** 시청 구간 [start, end) 초 단위 */
public record Interval(double start, double end) {
    public double length() { return end - start; }
}
