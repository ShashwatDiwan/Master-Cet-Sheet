package com.cetsheet.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.birbal")
public class BirbalCorpusProperties {
    /** Explicitly opt in to the one-shot local JSON importer. */
    private boolean importEnabled;
    /** Directory containing externally generated chapter JSON files. */
    private String importDirectory;
    /** Display name only; no external model or LLM configuration is used. */
    private String name = "BirBal";
}
