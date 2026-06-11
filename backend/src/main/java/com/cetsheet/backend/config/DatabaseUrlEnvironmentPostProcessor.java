package com.cetsheet.backend.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String PROPERTY_SOURCE_NAME = "normalizedDatabaseUrl";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String databaseUrl = firstPresent(
                environment.getProperty("DB_URL"),
                environment.getProperty("DATABASE_URL")
        );

        if (databaseUrl == null || databaseUrl.isBlank()) {
            return;
        }

        Map<String, Object> properties = new HashMap<>();
        if (databaseUrl.startsWith("jdbc:")) {
            properties.put("spring.datasource.url", databaseUrl);
        } else if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
            addPostgresProperties(databaseUrl, environment, properties);
        }

        if (!properties.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, properties));
        }
    }

    private void addPostgresProperties(
            String databaseUrl,
            ConfigurableEnvironment environment,
            Map<String, Object> properties
    ) {
        URI uri = URI.create(databaseUrl);
        StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
                .append(uri.getHost());

        if (uri.getPort() > 0) {
            jdbcUrl.append(':').append(uri.getPort());
        }

        String path = uri.getPath();
        if (path != null && !path.isBlank()) {
            jdbcUrl.append(path);
        }

        String query = uri.getQuery();
        if (query == null || query.isBlank()) {
            jdbcUrl.append("?sslmode=require");
        } else {
            jdbcUrl.append('?').append(query);
            if (!query.toLowerCase().contains("sslmode=")) {
                jdbcUrl.append("&sslmode=require");
            }
        }

        properties.put("spring.datasource.url", jdbcUrl.toString());

        String userInfo = uri.getRawUserInfo();
        if (userInfo == null || userInfo.isBlank()) {
            return;
        }

        String[] credentials = userInfo.split(":", 2);
        if (!hasText(environment.getProperty("DB_USERNAME"))) {
            properties.put("spring.datasource.username", decode(credentials[0]));
        }
        if (credentials.length > 1 && !hasText(environment.getProperty("DB_PASSWORD"))) {
            properties.put("spring.datasource.password", decode(credentials[1]));
        }
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }

    private static String firstPresent(String first, String second) {
        return hasText(first) ? first : second;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
