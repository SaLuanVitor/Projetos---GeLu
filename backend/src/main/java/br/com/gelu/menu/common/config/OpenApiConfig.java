package br.com.gelu.menu.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

  @Bean
  public OpenAPI geluMenuOpenApi() {
    return new OpenAPI()
        .info(
            new Info()
                .title("Gelu - Menu API")
                .description("REST API for Gelu - Menu modular monolith.")
                .version("0.1.0")
                .contact(new Contact().name("Gelu - Menu"))
                .license(new License().name("Private")))
        .servers(List.of(new Server().url("/").description("Current environment")));
  }
}
