package com.cetsheet.backend.Services;

import com.cetsheet.backend.Model.ResourceType;
import org.springframework.stereotype.Component;

import java.util.Locale;

@Component
public class ResourceObjectKeyFactory {
    public String create(String subject, int chapterId, ResourceType type, int resourceId, int version) {
        if (resourceId <= 0 || chapterId <= 0 || version <= 0 || type == null) {
            throw new IllegalArgumentException("Resource ID, chapter ID, type, and version must be valid");
        }
        return "resources/%s/chapter-%d/%s/resource-%d/v%d.pdf".formatted(
                slug(subject), chapterId, type.name().toLowerCase(Locale.ROOT), resourceId, version);
    }

    private String slug(String input) {
        String value = input == null ? "unknown" : input.trim().toLowerCase(Locale.ROOT);
        value = value.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-+|-+$)", "");
        return value.isBlank() ? "unknown" : value;
    }
}
