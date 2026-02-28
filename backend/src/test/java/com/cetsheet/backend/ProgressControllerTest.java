// package com.cetsheet.backend;

// import com.cetsheet.backend.Security.Auth.AuthenticationRequest;
// import com.cetsheet.backend.Security.Auth.RegisterRequest;
// import com.cetsheet.backend.dto.ProgressUpdateDTO;
// import com.fasterxml.jackson.databind.ObjectMapper;
// import org.junit.jupiter.api.BeforeEach;
// import org.junit.jupiter.api.Test;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
// import org.springframework.boot.test.context.SpringBootTest;
// import org.springframework.http.MediaType;
// import org.springframework.test.web.servlet.MockMvc;
// import org.springframework.test.web.servlet.MvcResult;

// import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
// import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
// import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// @SpringBootTest
// @AutoConfigureMockMvc
// public class ProgressControllerTest {
//     @Autowired
//     private MockMvc mockMvc;
//     @Autowired
//     private ObjectMapper objectMapper;

//     private String token;

//     @BeforeEach
//     public void setup() throws Exception {
//         RegisterRequest reg = new RegisterRequest();
//         reg.setEmail("progress@example.com");
//         reg.setUsername("progress");
//         reg.setPassword("password");
//         mockMvc.perform(post("/api/v1/auth/register")
//                         .contentType(MediaType.APPLICATION_JSON)
//                         .content(objectMapper.writeValueAsString(reg)))
//                 .andExpect(status().isOk());

//         AuthenticationRequest login = new AuthenticationRequest();
//         login.setEmail("progress@example.com");
//         login.setPassword("password");
//         MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
//                         .contentType(MediaType.APPLICATION_JSON)
//                         .content(objectMapper.writeValueAsString(login)))
//                 .andExpect(status().isOk())
//                 .andReturn();
//         String body = result.getResponse().getContentAsString();
//         token = objectMapper.readTree(body).get("token").asText();
//     }

//     @Test
//     public void updateAndRetrieveProgress() throws Exception {
//         ProgressUpdateDTO dto = new ProgressUpdateDTO();
//         dto.setChapterId(1);
//         dto.setProgressPercent(50);
//         dto.setCompleted(false);

//         mockMvc.perform(post("/api/v1/progress")
//                         .header("Authorization", "Bearer " + token)
//                         .contentType(MediaType.APPLICATION_JSON)
//                         .content(objectMapper.writeValueAsString(dto)))
//                 .andExpect(status().isOk());

//         mockMvc.perform(get("/api/v1/progress")
//                         .header("Authorization", "Bearer " + token))
//                 .andExpect(status().isOk());

//         // also make sure sheets endpoint works with token (progress mapping will be empty)
//         mockMvc.perform(get("/api/v1/sheets")
//                         .header("Authorization", "Bearer " + token))
//                 .andExpect(status().isOk());
//     }
// }
