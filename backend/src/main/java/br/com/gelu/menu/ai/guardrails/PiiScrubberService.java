package br.com.gelu.menu.ai.guardrails;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

/**
 * Guardrail de Entrada (LGPD Art. 11): Sanitização determinística de PII
 * (Personally Identifiable Information) antes de enviar qualquer prompt para LLMs externos.
 */
@Service
public class PiiScrubberService {

  // Regex para CPF (com ou sem pontuação)
  private static final Pattern CPF_PATTERN =
      Pattern.compile("\\b\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}\\b");

  // Regex para E-mail
  private static final Pattern EMAIL_PATTERN =
      Pattern.compile("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b");

  // Regex para Telefones brasileiros (fixo e celular com DDD opcional ou obrigatório)
  private static final Pattern PHONE_PATTERN =
      Pattern.compile(
          "(?:\\+?55\\s?)?(?:\\(?0?[1-9]{2}\\)?\\s?)?(?:9\\d{4}|[2-8]\\d{3})[-.\\s]?\\d{4}\\b");

  // Regex para Cartão de Crédito básico (13 a 19 dígitos)
  private static final Pattern CREDIT_CARD_PATTERN =
      Pattern.compile("\\b(?:\\d[ -]*?){13,19}\\b");

  /**
   * Remove e substitui dados sensíveis por placeholders anônimos seguros.
   *
   * @param input Texto livre informado pelo usuário
   * @return Texto sanitizado sem PII
   */
  public String scrub(String input) {
    if (input == null || input.isBlank()) {
      return input;
    }

    String result = input;

    // 1. Sanitizar CPF
    result = CPF_PATTERN.matcher(result).replaceAll("[CPF_REMOVIDO]");

    // 2. Sanitizar E-mail
    result = EMAIL_PATTERN.matcher(result).replaceAll("[EMAIL_REMOVIDO]");

    // 3. Sanitizar Telefones
    result = PHONE_PATTERN.matcher(result).replaceAll("[TELEFONE_REMOVIDO]");

    return result;
  }

  /**
   * Sanitiza strings prevenindo injeções de prompt indiretas ou caracteres de escape abusivos.
   *
   * @param input Entrada a ser limpa
   * @return Entrada limpa sem caracteres de controle maliciosos
   */
  public String sanitizePromptInput(String input) {
    if (input == null) {
      return "";
    }
    String cleaned = scrub(input);
    // Remove caracteres nulos e de controle que possam quebrar parsers JSON
    cleaned = cleaned.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "");
    return cleaned.trim();
  }
}
