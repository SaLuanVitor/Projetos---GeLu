package br.com.gelu.menu.ai.agents;

import java.util.List;

public record AiAgentDescriptor(
    String key,
    String name,
    String purpose,
    List<String> inputs,
    List<String> outputs,
    String codexFile) {}
