package com.cetsheet.backend.Controller;

import com.cetsheet.backend.Security.Service.AuthenticatedUserService;
import com.cetsheet.backend.Services.BirbalMemoryService;
import com.cetsheet.backend.dto.BirbalMemoryDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/birbal-memory")
@RequiredArgsConstructor
public class BirbalMemoryController {
    private final BirbalMemoryService birbalMemoryService;
    private final AuthenticatedUserService authenticatedUserService;

    @GetMapping
    public BirbalMemoryDtos.MemoryResponse memory() {
        return birbalMemoryService.memory(authenticatedUserService.currentUserId());
    }

    @PutMapping("/profile")
    public BirbalMemoryDtos.MemoryResponse updateProfile(@RequestBody BirbalMemoryDtos.ProfileUpdateRequest request) {
        return birbalMemoryService.updateProfile(authenticatedUserService.currentUserId(), request);
    }
}
