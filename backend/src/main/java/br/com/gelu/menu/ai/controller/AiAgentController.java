package br.com.gelu.menu.ai.controller;

import br.com.gelu.menu.ai.agents.AiAgentCatalog;
import br.com.gelu.menu.ai.agents.AiAgentDescriptor;
import br.com.gelu.menu.common.api.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "AI Agents", description = "AI agent catalog")
@RestController
@RequestMapping("/api/v1/ai/agents")
public class AiAgentController {

  private final AiAgentCatalog catalog;

  public AiAgentController(AiAgentCatalog catalog) {
    this.catalog = catalog;
  }

  @Operation(summary = "List available AI agents")
  @GetMapping
  public ApiResponse<List<AiAgentDescriptor>> listAgents() {
    return ApiResponse.ok(catalog.listAgents(), "AI agent catalog loaded");
  }
}
