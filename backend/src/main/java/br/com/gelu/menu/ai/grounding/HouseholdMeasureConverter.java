package br.com.gelu.menu.ai.grounding;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Converte medidas caseiras brasileiras comuns (colher de sopa, concha, fatia, xícara etc.)
 * para gramas equivalentes padronizados (IBGE / TACO).
 */
@Component
public class HouseholdMeasureConverter {

    private static final Pattern QUANTITY_PATTERN = Pattern.compile("(?i)(\\d+(?:[.,]\\d+)?)\\s*([a-zA-Z\\s]+)?");

    public record ConversionResult(BigDecimal grams, String identifiedMeasure, double multiplier) {}

    public ConversionResult convertToGrams(String input, String foodContext) {
        if (input == null || input.isBlank()) {
            return new ConversionResult(BigDecimal.valueOf(100), "padrão 100g", 1.0);
        }

        String normalized = normalize(input);
        String normFood = foodContext != null ? normalize(foodContext) : "";

        // Se já estiver em gramas ou ml
        Matcher gramMatcher = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(?:g|gr|gramas|ml)").matcher(normalized);
        if (gramMatcher.find()) {
            double val = parseDouble(gramMatcher.group(1));
            return new ConversionResult(BigDecimal.valueOf(val).setScale(1, RoundingMode.HALF_UP), "gramas", val / 100.0);
        }

        // Se estiver em kg
        Matcher kgMatcher = Pattern.compile("(\\d+(?:[.,]\\d+)?)\\s*(?:kg|quilo|quilos)").matcher(normalized);
        if (kgMatcher.find()) {
            double val = parseDouble(kgMatcher.group(1)) * 1000.0;
            return new ConversionResult(BigDecimal.valueOf(val).setScale(1, RoundingMode.HALF_UP), "quilos", val / 100.0);
        }

        // Extrai quantidade numérica
        double quantity = extractQuantity(normalized);

        // Medidas Caseiras
        if (normalized.contains("colher de sopa") || normalized.contains("colheres de sopa") || normalized.contains("c. sopa") || normalized.contains("cs")) {
            double gramsPerUnit = getColherSopaGrams(normFood);
            double total = quantity * gramsPerUnit;
            return new ConversionResult(BigDecimal.valueOf(total).setScale(1, RoundingMode.HALF_UP), "colher de sopa", total / 100.0);
        }

        if (normalized.contains("colher de sobremesa") || normalized.contains("colheres de sobremesa")) {
            double total = quantity * 10.0;
            return new ConversionResult(BigDecimal.valueOf(total).setScale(1, RoundingMode.HALF_UP), "colher de sobremesa", total / 100.0);
        }

        if (normalized.contains("colher de cha") || normalized.contains("colheres de cha")) {
            double total = quantity * 5.0;
            return new ConversionResult(BigDecimal.valueOf(total).setScale(1, RoundingMode.HALF_UP), "colher de chá", total / 100.0);
        }

        if (normalized.contains("concha") || normalized.contains("conchas")) {
            double total = quantity * 130.0; // Concha média de feijão padrão IBGE
            return new ConversionResult(BigDecimal.valueOf(total).setScale(1, RoundingMode.HALF_UP), "concha média", total / 100.0);
        }

        if (normalized.contains("escumadeira") || normalized.contains("escumadeiras")) {
            double total = quantity * 40.0; // Padrão arroz
            return new ConversionResult(BigDecimal.valueOf(total).setScale(1, RoundingMode.HALF_UP), "escumadeira", total / 100.0);
        }

        if (normalized.contains("xicara") || normalized.contains("xicaras") || normalized.contains("copo") || normalized.contains("copos")) {
            double total = quantity * 160.0; // 1 xícara/copo médio
            return new ConversionResult(BigDecimal.valueOf(total).setScale(1, RoundingMode.HALF_UP), "xícara/copo", total / 100.0);
        }

        if (normalized.contains("fatia") || normalized.contains("fatias")) {
            double gramsPerSlice = getFatiaGrams(normFood);
            double total = quantity * gramsPerSlice;
            return new ConversionResult(BigDecimal.valueOf(total).setScale(1, RoundingMode.HALF_UP), "fatia", total / 100.0);
        }

        if (normalized.contains("file") || normalized.contains("files") || normalized.contains("bife") || normalized.contains("bifes") || normalized.contains("pedaco")) {
            double total = quantity * 120.0; // 1 filé/bife médio grelhado
            return new ConversionResult(BigDecimal.valueOf(total).setScale(1, RoundingMode.HALF_UP), "filé/bife", total / 100.0);
        }

        if (normalized.contains("unidade") || normalized.contains("unidades") || normalized.contains("und") || normalized.contains("un")) {
            double gramsPerUnit = getUnitGrams(normFood);
            double total = quantity * gramsPerUnit;
            return new ConversionResult(BigDecimal.valueOf(total).setScale(1, RoundingMode.HALF_UP), "unidade", total / 100.0);
        }

        // Se for só número sem unidade explicita (ex: "2 ovos", "1 banana")
        if (normFood.contains("ovo")) {
            double total = quantity * 50.0;
            return new ConversionResult(BigDecimal.valueOf(total).setScale(1, RoundingMode.HALF_UP), "unidade (ovo)", total / 100.0);
        }
        if (normFood.contains("banana")) {
            double total = quantity * 80.0;
            return new ConversionResult(BigDecimal.valueOf(total).setScale(1, RoundingMode.HALF_UP), "unidade (banana)", total / 100.0);
        }
        if (normFood.contains("maca") || normFood.contains("pera") || normFood.contains("laranja")) {
            double total = quantity * 130.0;
            return new ConversionResult(BigDecimal.valueOf(total).setScale(1, RoundingMode.HALF_UP), "unidade (fruta)", total / 100.0);
        }

        // Padrão de fallback: assume 100g por quantidade ou 100g padrão
        double total = quantity > 0 ? quantity * 100.0 : 100.0;
        return new ConversionResult(BigDecimal.valueOf(total).setScale(1, RoundingMode.HALF_UP), "estimativa padrão", total / 100.0);
    }

    private double getColherSopaGrams(String normFood) {
        if (normFood.contains("azeite") || normFood.contains("oleo")) return 13.0;
        if (normFood.contains("arroz")) return 25.0;
        if (normFood.contains("feijao")) return 20.0;
        if (normFood.contains("aveia") || normFood.contains("farinha")) return 15.0;
        if (normFood.contains("acucar")) return 14.0;
        return 20.0; // Média geral
    }

    private double getFatiaGrams(String normFood) {
        if (normFood.contains("queijo")) return 30.0;
        if (normFood.contains("pao")) return 25.0;
        if (normFood.contains("bolo")) return 60.0;
        if (normFood.contains("melancia") || normFood.contains("melao")) return 150.0;
        return 35.0;
    }

    private double getUnitGrams(String normFood) {
        if (normFood.contains("ovo")) return 50.0;
        if (normFood.contains("pao frances")) return 50.0;
        if (normFood.contains("banana")) return 80.0;
        if (normFood.contains("maca")) return 130.0;
        return 100.0;
    }

    private double extractQuantity(String text) {
        Matcher matcher = Pattern.compile("(\\d+(?:[.,]\\d+)?)").matcher(text);
        if (matcher.find()) {
            return parseDouble(matcher.group(1));
        }
        if (text.contains("meia") || text.contains("meio") || text.contains("1/2")) {
            return 0.5;
        }
        if (text.contains("uma") || text.contains("um")) {
            return 1.0;
        }
        if (text.contains("duas") || text.contains("dois")) {
            return 2.0;
        }
        if (text.contains("tres")) {
            return 3.0;
        }
        return 1.0;
    }

    private double parseDouble(String str) {
        try {
            return Double.parseDouble(str.replace(',', '.').trim());
        } catch (NumberFormatException e) {
            return 1.0;
        }
    }

    private String normalize(String input) {
        return Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .trim();
    }
}
