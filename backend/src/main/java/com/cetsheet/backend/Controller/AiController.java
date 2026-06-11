package com.cetsheet.backend.Controller;

import com.cetsheet.backend.Security.Service.AuthenticatedUserService;
import com.cetsheet.backend.Services.PlanMyDayService;
import com.cetsheet.backend.dto.CustomizedPlanRequestDTO;
import com.cetsheet.backend.dto.InstantPlanRequestDTO;
import com.cetsheet.backend.dto.PlanMyDayRequestDTO;
import com.cetsheet.backend.dto.PlanMyDayResponseDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

	private final PlanMyDayService planMyDayService;
	private final AuthenticatedUserService authenticatedUserService;

	@PostMapping("/plan-my-day/instant")
	public ResponseEntity<PlanMyDayResponseDTO> planMyDayInstant(
			@RequestBody(required = false) @Valid InstantPlanRequestDTO request
	) {
		Long userId = authenticatedUserService.currentUserId();
		InstantPlanRequestDTO effectiveRequest = request == null ? new InstantPlanRequestDTO() : request;
		return ResponseEntity.ok(planMyDayService.createInstantPlan(userId, effectiveRequest));
	}

	@PostMapping("/plan-my-day/customized")
	public ResponseEntity<PlanMyDayResponseDTO> planMyDayCustomized(@Valid @RequestBody CustomizedPlanRequestDTO request) {
		Long userId = authenticatedUserService.currentUserId();
		return ResponseEntity.ok(planMyDayService.createCustomizedPlan(userId, request));
	}

	@PostMapping("/plan-my-day")
	@Deprecated
	public ResponseEntity<PlanMyDayResponseDTO> planMyDay(@Valid @RequestBody PlanMyDayRequestDTO request) {
		Long userId = authenticatedUserService.currentUserId();
		return ResponseEntity.ok(planMyDayService.createPlan(userId, request));
	}
}
