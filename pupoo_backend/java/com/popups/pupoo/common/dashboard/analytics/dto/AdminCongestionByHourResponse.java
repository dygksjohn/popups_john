// file: src/main/java/com/popups/pupoo/admin/analytics/dto/AdminCongestionByHourResponse.java
package com.popups.pupoo.admin.analytics.dto;

public class AdminCongestionByHourResponse {

    private int hour;
    private double avgCongestionLevel;

    public AdminCongestionByHourResponse(int hour, double avgCongestionLevel) {
        this.hour = hour;
        this.avgCongestionLevel = avgCongestionLevel;
    }

    public int getHour() { return hour; }
    public double getAvgCongestionLevel() { return avgCongestionLevel; }
}
