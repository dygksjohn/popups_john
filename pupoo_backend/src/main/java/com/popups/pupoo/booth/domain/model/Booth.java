package com.popups.pupoo.booth.domain.model;

import com.popups.pupoo.booth.domain.enums.BoothStatus;
import com.popups.pupoo.booth.domain.enums.BoothZone;
import com.popups.pupoo.booth.domain.enums.BoothType;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "booths")
public class Booth {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "booth_id")
    private Long boothId;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "place_name", nullable = false, length = 100)
    private String placeName;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private BoothType type;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "company", length = 100)
    private String company;

    @Enumerated(EnumType.STRING)
    @Column(name = "zone", nullable = false, length = 20)
    private BoothZone zone;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private BoothStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected Booth() {}

    public Long getBoothId() { return boothId; }
    public Long getEventId() { return eventId; }
    public String getPlaceName() { return placeName; }
    public BoothType getType() { return type; }
    public String getDescription() { return description; }
    public String getCompany() { return company; }
    public BoothZone getZone() { return zone; }
    public BoothStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
