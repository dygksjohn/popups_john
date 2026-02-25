// file: src/main/java/com/popups/pupoo/admin/analytics/dto/AdminEventPerformanceResponse.java
package com.popups.pupoo.admin.analytics.dto;

public class AdminEventPerformanceResponse {

    private Long eventId;
    private String eventName;
    private long approvedRegistrationCount;
    private long checkinCount;

    public AdminEventPerformanceResponse(Long eventId, String eventName, long approvedRegistrationCount, long checkinCount) {
        this.eventId = eventId;
        this.eventName = eventName;
        this.approvedRegistrationCount = approvedRegistrationCount;
        this.checkinCount = checkinCount;
    }

    public Long getEventId() { return eventId; }
    public String getEventName() { return eventName; }
    public long getApprovedRegistrationCount() { return approvedRegistrationCount; }
    public long getCheckinCount() { return checkinCount; }
}
