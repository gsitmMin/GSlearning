package com.gsitm.learning.common;

/** PRD §9 공통 응답 포맷 */
public record ApiResponse<T>(boolean success, T data, ErrorBody error) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null);
    }
    public static ApiResponse<Void> fail(ErrorBody error) {
        return new ApiResponse<>(false, null, error);
    }
}
