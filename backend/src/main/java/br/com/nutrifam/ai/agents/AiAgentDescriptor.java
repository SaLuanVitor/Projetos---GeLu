package br.com.nutrifam.ai.agents;

import java.util.List;

public record AiAgentDescriptor(
        String key,
        String name,
        String purpose,
        List<String> inputs,
        List<String> outputs,
        String codexFile
) {
}
