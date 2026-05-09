package br.com.gelu.menu.common.health;

import br.com.gelu.menu.common.api.ApiResponse;
import java.time.OffsetDateTime;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @GetMapping
    public ApiResponse<HealthResponse> health() {
        return ApiResponse.ok(
                new HealthResponse("UP", "gelu-menu-backend", OffsetDateTime.now()),
                "Service is healthy"
        );
    }

    public record HealthResponse(
            String status,
            String service,
            OffsetDateTime timestamp
    ) {
    }
}
