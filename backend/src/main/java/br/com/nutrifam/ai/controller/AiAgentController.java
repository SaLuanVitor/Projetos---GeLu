package br.com.nutrifam.ai.controller;

import br.com.nutrifam.ai.agents.AiAgentCatalog;
import br.com.nutrifam.ai.agents.AiAgentDescriptor;
import br.com.nutrifam.common.api.ApiResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai/agents")
public class AiAgentController {

    private final AiAgentCatalog catalog;

    public AiAgentController(AiAgentCatalog catalog) {
        this.catalog = catalog;
    }

    @GetMapping
    public ApiResponse<List<AiAgentDescriptor>> listAgents() {
        return ApiResponse.ok(catalog.listAgents(), "AI agent catalog loaded");
    }
}
