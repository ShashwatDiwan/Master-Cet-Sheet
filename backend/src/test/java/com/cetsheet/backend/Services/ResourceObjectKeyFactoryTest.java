package com.cetsheet.backend.Services;

import com.cetsheet.backend.Model.ResourceType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ResourceObjectKeyFactoryTest {
    private final ResourceObjectKeyFactory factory = new ResourceObjectKeyFactory();

    @Test
    void includesResourceIdAndVersionToAvoidPyqCollisions() {
        assertEquals("resources/physics/chapter-12/pyqs/resource-91/v2.pdf",
                factory.create("Physics", 12, ResourceType.PYQS, 91, 2));
    }

    @Test
    void rejectsInvalidIdentifiers() {
        assertThrows(IllegalArgumentException.class,
                () -> factory.create("Physics", 0, ResourceType.NOTES, 1, 1));
    }
}
