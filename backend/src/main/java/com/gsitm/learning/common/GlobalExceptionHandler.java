package com.gsitm.learning.common;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Void>> handleApi(ApiException e) {
        return ResponseEntity.status(e.code.status)
            .body(ApiResponse.fail(new ErrorBody(e.code.name(), e.getMessage(), null, traceId())));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException e) {
        Map<String, Object> details = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors()
            .forEach(f -> details.put(f.getField(), f.getDefaultMessage()));
        return ResponseEntity.status(ErrorCode.VALIDATION.status)
            .body(ApiResponse.fail(new ErrorBody(
                ErrorCode.VALIDATION.name(), ErrorCode.VALIDATION.defaultMessage, details, traceId())));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnknown(Exception e) {
        String traceId = traceId();
        log.error("unhandled [{}]", traceId, e);
        return ResponseEntity.status(ErrorCode.INTERNAL.status)
            .body(ApiResponse.fail(new ErrorBody(
                ErrorCode.INTERNAL.name(), ErrorCode.INTERNAL.defaultMessage, null, traceId)));
    }

    private String traceId() {
        return UUID.randomUUID().toString().substring(0, 8);
    }
}
