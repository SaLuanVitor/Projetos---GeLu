package br.com.gelu.menu.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.gelu.menu.auth.controller.AuthController;
import br.com.gelu.menu.auth.service.AuthService;
import br.com.gelu.menu.common.api.GlobalExceptionHandler;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@WebMvcTest(AuthController.class)
@Import({AuthService.class, GlobalExceptionHandler.class, TestPasswordConfig.class})
class AuthControllerTest {

  @Autowired private MockMvc mockMvc;

  @MockBean private UserRepository userRepository;

  @Test
  void shouldRegisterUserWithoutReturningPassword() throws Exception {
    when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

    MvcResult result =
        mockMvc
            .perform(
                post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {
                          "name": "Luan",
                          "email": "LUAN@EXAMPLE.COM",
                          "password": "strong-password"
                        }
                        """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.name").value("Luan"))
            .andExpect(jsonPath("$.data.email").value("luan@example.com"))
            .andExpect(jsonPath("$.data.active").value(true))
            .andExpect(jsonPath("$.data.password").doesNotExist())
            .andExpect(jsonPath("$.data.passwordHash").doesNotExist())
            .andReturn();

    assertThat(result.getResponse().getContentAsString()).doesNotContain("strong-password");
  }

  @Test
  void shouldRejectDuplicatedEmail() throws Exception {
    when(userRepository.existsByEmail("luan@example.com")).thenReturn(true);

    mockMvc
        .perform(
            post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "name": "Luan",
                      "email": "luan@example.com",
                      "password": "strong-password"
                    }
                    """))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error.code").value("CONFLICT"))
        .andExpect(jsonPath("$.error.message").value("Email already registered"));
  }

  @Test
  void shouldRejectInvalidPayload() throws Exception {
    mockMvc
        .perform(
            post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "name": "",
                      "email": "invalid",
                      "password": "short"
                    }
                    """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
  }
}
