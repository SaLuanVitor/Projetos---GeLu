package br.com.gelu.menu.imports.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

@Service
public class ExcelTemplateService {

  public byte[] generateTemplate(String module) {
    try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
      CellStyle headerStyle = createHeaderStyle(workbook);
      CellStyle sampleStyle = createSampleStyle(workbook);

      String normalizedModule = module.trim().toUpperCase();
      switch (normalizedModule) {
        case "WORKOUTS", "TREINOS" -> buildWorkoutsTemplate(workbook, headerStyle, sampleStyle);
        case "MEALS", "REFEICOES" -> buildMealsTemplate(workbook, headerStyle, sampleStyle);
        case "RECIPES", "RECEITAS" -> buildRecipesTemplate(workbook, headerStyle, sampleStyle);
        case "WEEKLY_MENU", "CARDAPIO", "AGENDA" -> buildWeeklyMenuTemplate(workbook, headerStyle, sampleStyle);
        default -> throw new IllegalArgumentException("Módulo de template desconhecido: " + module);
      }

      workbook.write(out);
      return out.toByteArray();
    } catch (IOException e) {
      throw new IllegalStateException("Erro ao gerar template Excel", e);
    }
  }

  private void buildWorkoutsTemplate(Workbook workbook, CellStyle headerStyle, CellStyle sampleStyle) {
    // Aba 1: Fichas de Treino
    Sheet sheet1 = workbook.createSheet("Fichas de Treino");
    String[] headers1 = {
        "Título do Treino*", "Categoria*", "Intensidade*", "Duração (min)*",
        "Calorias/Hora*", "Dias da Semana (ex: SEG,QUA)", "Observações"
    };
    createHeaderRow(sheet1, headers1, headerStyle);

    String[][] samples1 = {
        {"Treino A - Peito e Tríceps", "MUSCULACAO", "INTENSO", "60", "480", "SEG,QUI", "Foco em progressão de carga"},
        {"Treino B - Costas e Bíceps", "MUSCULACAO", "MODERADO", "55", "450", "TER,SEX", "Aquecer manguito antes"},
        {"Corrida Matinal no Parque", "CORRIDA", "INTENSO", "45", "620", "QUA,SAB", "Ritmo de 5'30\" por km"}
    };
    fillSampleRows(sheet1, samples1, sampleStyle);
    autoSizeColumns(sheet1, headers1.length);

    // Aba 2: Exercícios
    Sheet sheet2 = workbook.createSheet("Exercícios");
    String[] headers2 = {
        "Título do Treino*", "Nome do Exercício*", "Séries", "Repetições",
        "Carga (kg)", "Calorias Estimadas", "Observação"
    };
    createHeaderRow(sheet2, headers2, headerStyle);

    String[][] samples2 = {
        {"Treino A - Peito e Tríceps", "Supino Reto com Barra", "4", "10", "60", "45", "Descanso 90s"},
        {"Treino A - Peito e Tríceps", "Supino Inclinado Halteres", "3", "12", "22", "35", "Amplitude máxima"},
        {"Treino A - Peito e Tríceps", "Tríceps Corda Polia", "4", "12", "25", "30", "Pico de contração 1s"},
        {"Treino B - Costas e Bíceps", "Puxada Frontal Aberta", "4", "10", "55", "40", "Costas retas"},
        {"Treino B - Costas e Bíceps", "Rosca Direta com Barra W", "3", "10", "28", "25", "Sem balanço"}
    };
    fillSampleRows(sheet2, samples2, sampleStyle);
    autoSizeColumns(sheet2, headers2.length);
  }

  private void buildMealsTemplate(Workbook workbook, CellStyle headerStyle, CellStyle sampleStyle) {
    Sheet sheet = workbook.createSheet("Refeições");
    String[] headers = {
        "Data (AAAA-MM-DD)*", "Tipo de Refeição*", "Nome do Alimento*", "Quantidade",
        "Unidade", "Calorias (kcal)*", "Proteínas (g)", "Carboidratos (g)", "Gorduras (g)"
    };
    createHeaderRow(sheet, headers, headerStyle);

    String[][] samples = {
        {"2026-11-25", "CAFE_MANHA", "Ovos Mexidos Cremosos", "3", "unidades", "210", "18", "2", "14"},
        {"2026-11-25", "CAFE_MANHA", "Pão Integral Tostado", "2", "fatias", "130", "5", "24", "1.5"},
        {"2026-11-25", "ALMOCO", "Peito de Frango Grelhado", "180", "gramas", "290", "56", "0", "5"},
        {"2026-11-25", "ALMOCO", "Arroz Integral Cozido", "120", "gramas", "150", "3", "32", "1.2"},
        {"2026-11-25", "JANTAR", "Omelete com Queijo Minas", "1", "porção", "240", "20", "3", "16"}
    };
    fillSampleRows(sheet, samples, sampleStyle);
    autoSizeColumns(sheet, headers.length);
  }

  private void buildRecipesTemplate(Workbook workbook, CellStyle headerStyle, CellStyle sampleStyle) {
    Sheet sheet = workbook.createSheet("Receitas");
    String[] headers = {
        "Nome da Receita*", "Categoria*", "Tempo Preparo Minutos*", "Porções*",
        "Calorias/Porção*", "Ingredientes (separados por ;)*", "Modo de Preparo*"
    };
    createHeaderRow(sheet, headers, headerStyle);

    String[][] samples = {
        {"Frango Grelhado com Brócolis", "ALMOCO", "25", "4", "120", "500g peito de frango; 1 maço de brócolis; 2 dentes de alho; azeite de oliva; sal", "Grelhe os filés de frango até dourar. Cozinhe o brócolis no vapor com alho e azeite."},
        {"Omelete Nutritivo com Queijo Branco", "JANTAR", "12", "1", "240", "3 ovos caipiras; 50g queijo branco; orégano; pitada de sal", "Bata os ovos com temperos, despeje na frigideira pré-aquecida e adicione o queijo em cubos."},
        {"Panqueca de Banana Fit", "CAFE", "15", "2", "180", "2 bananas maduras; 2 ovos; 4 colheres de aveia em flocos; canela a gosto", "Amasse as bananas, misture com os ovos e a aveia. Doure dos dois lados na frigideira antiaderente."}
    };
    fillSampleRows(sheet, samples, sampleStyle);
    autoSizeColumns(sheet, headers.length);
  }

  private void buildWeeklyMenuTemplate(Workbook workbook, CellStyle headerStyle, CellStyle sampleStyle) {
    Sheet sheet = workbook.createSheet("Cardápio Semanal");
    String[] headers = {
        "Dia da Semana*", "Tipo de Refeição*", "Horário Sugerido (HH:MM)",
        "Prato ou Preparação*", "Observações da Família"
    };
    createHeaderRow(sheet, headers, headerStyle);

    String[][] samples = {
        {"SEGUNDA", "CAFE_MANHA", "07:30", "Ovos mexidos com torradas integrais e café com leite", "Sem açúcar"},
        {"SEGUNDA", "ALMOCO", "12:30", "Frango grelhado com arroz integral e salada verde", "Deixar frango marinado no domingo"},
        {"SEGUNDA", "JANTAR", "19:30", "Sopa leve de legumes com frango desfiado", "Porção congelada"},
        {"TERCA", "ALMOCO", "12:30", "Filé de peixe assado com batatas e legumes", "Comprar peixe fresco pela manhã"}
    };
    fillSampleRows(sheet, samples, sampleStyle);
    autoSizeColumns(sheet, headers.length);
  }

  private CellStyle createHeaderStyle(Workbook workbook) {
    CellStyle style = workbook.createCellStyle();
    Font font = workbook.createFont();
    font.setBold(true);
    font.setColor(IndexedColors.WHITE.getIndex());
    font.setFontHeightInPoints((short) 11);
    style.setFont(font);
    style.setFillForegroundColor(IndexedColors.DARK_TEAL.getIndex()); // Tom elegante verde-petróleo/âmbar
    style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
    style.setAlignment(HorizontalAlignment.CENTER);
    style.setBorderBottom(BorderStyle.THIN);
    style.setBorderTop(BorderStyle.THIN);
    style.setBorderLeft(BorderStyle.THIN);
    style.setBorderRight(BorderStyle.THIN);
    return style;
  }

  private CellStyle createSampleStyle(Workbook workbook) {
    CellStyle style = workbook.createCellStyle();
    style.setBorderBottom(BorderStyle.THIN);
    style.setBorderTop(BorderStyle.THIN);
    style.setBorderLeft(BorderStyle.THIN);
    style.setBorderRight(BorderStyle.THIN);
    return style;
  }

  private void createHeaderRow(Sheet sheet, String[] headers, CellStyle headerStyle) {
    Row row = sheet.createRow(0);
    row.setHeightInPoints(24);
    for (int i = 0; i < headers.length; i++) {
      Cell cell = row.createCell(i);
      cell.setCellValue(headers[i]);
      cell.setCellStyle(headerStyle);
    }
  }

  private void fillSampleRows(Sheet sheet, String[][] samples, CellStyle sampleStyle) {
    for (int r = 0; r < samples.length; r++) {
      Row row = sheet.createRow(r + 1);
      row.setHeightInPoints(20);
      for (int c = 0; c < samples[r].length; c++) {
        Cell cell = row.createCell(c);
        cell.setCellValue(samples[r][c]);
        cell.setCellStyle(sampleStyle);
      }
    }
  }

  private void autoSizeColumns(Sheet sheet, int colCount) {
    for (int c = 0; c < colCount; c++) {
      sheet.autoSizeColumn(c);
      int currentWidth = sheet.getColumnWidth(c);
      sheet.setColumnWidth(c, Math.max(currentWidth + 1200, 3500));
    }
  }
}
