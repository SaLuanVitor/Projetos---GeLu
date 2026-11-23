package br.com.gelu.menu.common.util;

import java.text.Normalizer;
import java.util.UUID;

public final class SlugUtils {

  private SlugUtils() {}

  public static String slugify(String input) {
    if (input == null || input.isBlank()) {
      return "item-" + UUID.randomUUID().toString().substring(0, 8);
    }
    String normalized = Normalizer.normalize(input.trim(), Normalizer.Form.NFD);
    String slug = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
    slug = slug.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
    if (slug.isBlank()) {
      return "item-" + UUID.randomUUID().toString().substring(0, 8);
    }
    return slug;
  }
}
