package br.com.gelu.menu.admin.dto;

import java.util.Map;

public record UpdateSystemSettingsRequest(Map<String, String> settings) {}
