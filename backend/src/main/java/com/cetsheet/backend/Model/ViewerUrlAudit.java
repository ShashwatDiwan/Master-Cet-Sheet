package com.cetsheet.backend.Model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "viewer_url_audit")
@Getter
@Setter
@NoArgsConstructor
public class ViewerUrlAudit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "resource_id", nullable = false)
    private Integer resourceId;

    @Column(name = "requested_at", nullable = false)
    private Instant requestedAt;

    @Column(nullable = false, length = 32)
    private String outcome;

    @Column(name = "denial_reason", length = 255)
    private String denialReason;
}
