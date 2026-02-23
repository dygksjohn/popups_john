// file: src/main/java/com/popups/pupoo/report/dto/ReportResponse.java
package com.popups.pupoo.report.dto;

import com.popups.pupoo.report.domain.model.ContentReport;

import java.time.LocalDateTime;

public class ReportResponse {

    private Long reportId;
    private Long reporterUserId;
    private String targetType;
    private Long targetId;
    private String reasonCode;
    private String reasonLabel;
    private String reasonDetail;
    private String reason;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private Long resolvedByAdminId;

    // counts
    private long totalReportCount;
    private long pendingReportCount;

    public static ReportResponse from(ContentReport r) {
        return from(r, 0L, 0L);
    }

    public static ReportResponse from(ContentReport r, long totalReportCount, long pendingReportCount) {
        ReportResponse dto = new ReportResponse();
        dto.reportId = r.getReportId();
        dto.reporterUserId = r.getReporterUserId();
        dto.targetType = r.getTargetType().name();
        dto.targetId = r.getTargetId();

        dto.reasonCode = (r.getReasonCode() == null) ? null : r.getReasonCode().name();
        dto.reasonLabel = (r.getReasonCode() == null) ? null : r.getReasonCode().getLabel();
        dto.reasonDetail = r.getReasonDetail();
        dto.reason = r.getReason();
        dto.status = r.getStatus().name();
        dto.createdAt = r.getCreatedAt();
        dto.resolvedAt = r.getResolvedAt();
        dto.resolvedByAdminId = r.getResolvedByAdminId();

        dto.totalReportCount = totalReportCount;
        dto.pendingReportCount = pendingReportCount;
        return dto;
    }

    public Long getReportId() { return reportId; }
    public Long getReporterUserId() { return reporterUserId; }
    public String getTargetType() { return targetType; }
    public Long getTargetId() { return targetId; }
    public String getReasonCode() { return reasonCode; }
    public String getReasonLabel() { return reasonLabel; }
    public String getReasonDetail() { return reasonDetail; }
    public String getReason() { return reason; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public Long getResolvedByAdminId() { return resolvedByAdminId; }
    public long getTotalReportCount() { return totalReportCount; }
    public long getPendingReportCount() { return pendingReportCount; }
}
