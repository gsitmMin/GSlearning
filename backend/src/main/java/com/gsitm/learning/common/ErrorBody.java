package com.gsitm.learning.common;

import java.util.Map;

public record ErrorBody(String code, String message, Map<String, Object> details, String traceId) {}
