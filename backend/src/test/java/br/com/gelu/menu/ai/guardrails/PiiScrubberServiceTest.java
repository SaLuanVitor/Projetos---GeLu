package br.com.gelu.menu.ai.guardrails;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PiiScrubberServiceTest {

  private PiiScrubberService scrubber;

  @BeforeEach
  void setUp() {
    scrubber = new PiiScrubberService();
  }

  @Test
  @DisplayName("Deve remover CPF formatado e não-formatado do texto")
  void shouldScrubCpf() {
    String input = "Meu CPF é 123.456.789-00 e meu irmão usa 98765432100 para o plano.";
    String sanitized = scrubber.scrub(input);

    assertThat(sanitized).doesNotContain("123.456.789-00");
    assertThat(sanitized).doesNotContain("98765432100");
    assertThat(sanitized).contains("[CPF_REMOVIDO]");
  }

  @Test
  @DisplayName("Deve remover e-mails do texto")
  void shouldScrubEmail() {
    String input = "Envie a receita para contato@usuario.com.br ou luan.vitor@empresa.org por favor.";
    String sanitized = scrubber.scrub(input);

    assertThat(sanitized).doesNotContain("contato@usuario.com.br");
    assertThat(sanitized).doesNotContain("luan.vitor@empresa.org");
    assertThat(sanitized).contains("[EMAIL_REMOVIDO]");
  }

  @Test
  @DisplayName("Deve remover números de telefone brasileiros")
  void shouldScrubPhone() {
    String input = "Me chame no zap (11) 98765-4321 ou no fixo 11 3456-7890.";
    String sanitized = scrubber.scrub(input);

    assertThat(sanitized).doesNotContain("98765-4321");
    assertThat(sanitized).doesNotContain("3456-7890");
    assertThat(sanitized).contains("[TELEFONE_REMOVIDO]");
  }

  @Test
  @DisplayName("Deve limpar caracteres de controle abusivos mantendo texto culinário intacto")
  void shouldSanitizePromptInput() {
    String input = "Prefiro sem cebola\u0000 e pouco sal.\nCom pimenta.";
    String sanitized = scrubber.sanitizePromptInput(input);

    assertThat(sanitized).doesNotContain("\u0000");
    assertThat(sanitized).contains("Prefiro sem cebola e pouco sal.");
  }
}
