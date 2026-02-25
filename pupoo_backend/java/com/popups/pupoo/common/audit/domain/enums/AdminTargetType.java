// file: src/main/java/com/popups/pupoo/adminlog/domain/enums/AdminTargetType.java
package com.popups.pupoo.common.audit.domain.enums;

/**
 * 관리자 작업 로그의 대상 유형.
 * DB: admin_logs.target_type ENUM 과 정합성을 유지한다.
 */
public enum AdminTargetType {
    EVENT,
    NOTICE,
    POST,
    REVIEW,
    PAYMENT,
    REFUND,
    QR,
    USER,
    OTHER
}
