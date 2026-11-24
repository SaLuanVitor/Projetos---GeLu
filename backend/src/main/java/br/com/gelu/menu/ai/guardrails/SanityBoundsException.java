package br.com.gelu.menu.ai.guardrails;

public class SanityBoundsException extends RuntimeException {
  public SanityBoundsException(String message) {
    super(message);
  }
}
