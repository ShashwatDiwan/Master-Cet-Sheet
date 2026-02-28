package com.cetsheet.backend.Security.Auth;

import lombok.Data;

@Data
public class AuthenticationRequest {
    private String email;
    private String password;
}
