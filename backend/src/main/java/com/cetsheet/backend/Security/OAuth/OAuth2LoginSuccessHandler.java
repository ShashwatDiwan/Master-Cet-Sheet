package com.cetsheet.backend.Security.OAuth;

import com.cetsheet.backend.Security.Auth.AuthenticationResponse;
import com.cetsheet.backend.Security.Service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;

    @Value("${app.oauth2.authorized-redirect-uri:http://localhost:5173/oauth/callback}")
    private String authorizedRedirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oauth2User = oauthToken.getPrincipal();
        String registrationId = oauthToken.getAuthorizedClientRegistrationId();

        String email = extractEmail(oauth2User, registrationId);
        String displayName = extractDisplayName(oauth2User);

        AuthenticationResponse authResponse = authService.loginOrRegisterOAuthUser(email, displayName);

        String redirectUrl = UriComponentsBuilder
                .fromUriString(authorizedRedirectUri)
                .queryParam("token", authResponse.getToken())
                .build()
                .toUriString();

        response.sendRedirect(redirectUrl);
    }

    private String extractEmail(OAuth2User oauth2User, String registrationId) {
        Object emailAttr = oauth2User.getAttributes().get("email");
        if (emailAttr instanceof String email && !email.isBlank()) {
            return email;
        }

        if ("github".equalsIgnoreCase(registrationId)) {
            Object loginAttr = oauth2User.getAttributes().get("login");
            if (loginAttr instanceof String login && !login.isBlank()) {
                return login + "@users.noreply.github.com";
            }
        }

        throw new IllegalStateException("Email not available from OAuth provider");
    }

    private String extractDisplayName(OAuth2User oauth2User) {
        Object nameAttr = oauth2User.getAttributes().get("name");
        if (nameAttr instanceof String name && !name.isBlank()) {
            return name;
        }

        Object loginAttr = oauth2User.getAttributes().get("login");
        if (loginAttr instanceof String login && !login.isBlank()) {
            return login;
        }

        return "User";
    }
}