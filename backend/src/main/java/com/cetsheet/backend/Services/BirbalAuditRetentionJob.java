package com.cetsheet.backend.Services;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Keeps the query audit at the selected retention period without retaining student searches indefinitely. */
@Component
@RequiredArgsConstructor
public class BirbalAuditRetentionJob {
    private final NamedParameterJdbcTemplate jdbc;

    @Value("${app.birbal.audit-retention-days:30}")
    private int retentionDays;

    @Scheduled(cron = "${app.birbal.audit-retention-cron:0 17 3 * * *}")
    public void removeExpiredAudits() {
        jdbc.getJdbcTemplate().update("DELETE FROM birbal_query_audit WHERE requested_at < CURRENT_TIMESTAMP - (? * INTERVAL '1 day')", retentionDays);
    }
}
