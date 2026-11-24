package br.com.gelu.menu.imports.service;

import br.com.gelu.menu.common.exception.BadRequestException;
import br.com.gelu.menu.diet.WeeklyDietService;
import br.com.gelu.menu.diet.dto.CreateDietMealRequest;
import br.com.gelu.menu.diet.dto.WeeklyDietResponse;
import br.com.gelu.menu.imports.dto.ImportResultResponse;
import br.com.gelu.menu.imports.dto.ImportValidationError;
import br.com.gelu.menu.meals.MealLogService;
import br.com.gelu.menu.meals.dto.CreateMealLogRequest;
import br.com.gelu.menu.recipes.RecipeService;
import br.com.gelu.menu.recipes.dto.RecipeIngredientRequest;
import br.com.gelu.menu.recipes.dto.RecipeRequest;
import br.com.gelu.menu.recipes.dto.RecipeStepRequest;
import br.com.gelu.menu.workouts.WorkoutService;
import br.com.gelu.menu.workouts.dto.WorkoutRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExcelImportService {

  private static final Set<String> VALID_WORKOUT_CATEGORIES =
      Set.of("MUSCULACAO", "CORRIDA", "CAMINHADA", "FUNCIONAL", "CICLISMO", "YOGA", "OUTRO");

  private static final Set<String> VALID_INTENSITIES =
      Set.of("LEVE", "MODERADO", "INTENSO", "MUITO_INTENSO");

  private static final Set<String> VALID_DAYS =
      Set.of("SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM");

  private static final Set<String> VALID_MEAL_TYPES =
      Set.of("CAFE_MANHA", "ALMOCO", "LANCHE_TARDE", "JANTAR", "CEIA", "LANCHE_LIVRE");

  private final WorkoutService workoutService;
  private final MealLogService mealLogService;
  private final RecipeService recipeService;
  private final WeeklyDietService weeklyDietService;
  private final ObjectMapper objectMapper;

  public ExcelImportService(
      WorkoutService workoutService,
      MealLogService mealLogService,
      RecipeService recipeService,
      WeeklyDietService weeklyDietService,
      ObjectMapper objectMapper) {
    this.workoutService = workoutService;
    this.mealLogService = mealLogService;
    this.recipeService = recipeService;
    this.weeklyDietService = weeklyDietService;
    this.objectMapper = objectMapper;
  }

  // =========================================================================
  // 1. IMPORTAÇÃO DE TREINOS & EXERCÍCIOS
  // =========================================================================
  @Transactional
  public ImportResultResponse importWorkouts(
      UUID userId, UUID familyId, InputStream is, boolean dryRun) {
    List<ImportValidationError> errors = new ArrayList<>();
    List<Map<String, Object>> preview = new ArrayList<>();
    List<WorkoutRequest> parsedWorkouts = new ArrayList<>();

    try (Workbook wb = WorkbookFactory.create(is)) {
      Sheet sheetWorkouts = wb.getNumberOfSheets() > 0 ? wb.getSheetAt(0) : null;
      if (sheetWorkouts == null) {
        return ImportResultResponse.withErrors(0, List.of(
            new ImportValidationError(1, "Geral", "Planilha", "A planilha está vazia", "")),
            "Planilha sem abas válidas.");
      }

      // Validar cabeçalho da aba de Treinos
      Row headerRow = sheetWorkouts.getRow(0);
      if (headerRow == null) {
        return ImportResultResponse.withErrors(0, List.of(
            new ImportValidationError(1, sheetWorkouts.getSheetName(), "Cabeçalho", "Cabeçalho ausente", "")),
            "Cabeçalho não encontrado.");
      }

      // Mapear exercícios se existir segunda aba
      Map<String, List<Map<String, Object>>> exercisesByWorkout = new HashMap<>();
      if (wb.getNumberOfSheets() > 1) {
        Sheet sheetEx = wb.getSheetAt(1);
        parseExercisesSheet(sheetEx, exercisesByWorkout, errors);
      }

      // Ler treinos
      int lastRow = sheetWorkouts.getLastRowNum();
      int rowCount = 0;

      for (int r = 1; r <= lastRow; r++) {
        Row row = sheetWorkouts.getRow(r);
        if (isRowEmpty(row)) continue;
        rowCount++;

        int excelLine = r + 1;
        String title = getCellString(row, 0);
        String category = getCellString(row, 1).toUpperCase().trim();
        String intensity = getCellString(row, 2).toUpperCase().trim();
        Integer duration = getCellInt(row, 3);
        Integer caloriesPerHour = getCellInt(row, 4);
        String days = getCellString(row, 5);
        String notes = getCellString(row, 6);

        // Validações
        if (title.isBlank()) {
          errors.add(new ImportValidationError(excelLine, sheetWorkouts.getSheetName(), "Título do Treino", "Campo obrigatório não preenchido", ""));
        }
        if (!VALID_WORKOUT_CATEGORIES.contains(category)) {
          errors.add(new ImportValidationError(excelLine, sheetWorkouts.getSheetName(), "Categoria", "Categoria inválida. Use: " + VALID_WORKOUT_CATEGORIES, category));
        }
        if (!VALID_INTENSITIES.contains(intensity)) {
          errors.add(new ImportValidationError(excelLine, sheetWorkouts.getSheetName(), "Intensidade", "Intensidade inválida. Use: " + VALID_INTENSITIES, intensity));
        }
        if (duration == null || duration <= 0) {
          errors.add(new ImportValidationError(excelLine, sheetWorkouts.getSheetName(), "Duração (min)", "Deve ser um número inteiro positivo", String.valueOf(duration)));
        }
        if (caloriesPerHour == null || caloriesPerHour <= 0) {
          errors.add(new ImportValidationError(excelLine, sheetWorkouts.getSheetName(), "Calorias/Hora", "Deve ser um número inteiro positivo", String.valueOf(caloriesPerHour)));
        }

        // Validar dias da semana
        if (!days.isBlank()) {
          String[] parts = days.toUpperCase().replace(" ", "").split(",");
          for (String p : parts) {
            if (!VALID_DAYS.contains(p)) {
              errors.add(new ImportValidationError(excelLine, sheetWorkouts.getSheetName(), "Dias da Semana", "Dia inválido '" + p + "'. Use: " + VALID_DAYS, days));
            }
          }
        }

        // Montar exercícios vinculados
        List<Map<String, Object>> exList = exercisesByWorkout.getOrDefault(title.trim().toLowerCase(), List.of());
        String exercisesJson = null;
        if (!exList.isEmpty()) {
          try {
            exercisesJson = objectMapper.writeValueAsString(exList);
          } catch (Exception ignored) {}
        }

        WorkoutRequest req = new WorkoutRequest(
            title.trim(),
            category,
            intensity,
            duration != null ? duration : 60,
            caloriesPerHour != null ? caloriesPerHour : 450,
            notes.isBlank() ? null : notes.trim(),
            days.isBlank() ? null : days.trim().toUpperCase(),
            exercisesJson,
            false
        );
        parsedWorkouts.add(req);

        Map<String, Object> previewItem = new LinkedHashMap<>();
        previewItem.put("linha", excelLine);
        previewItem.put("titulo", title);
        previewItem.put("categoria", category);
        previewItem.put("intensidade", intensity);
        previewItem.put("duracaoMinutos", duration);
        previewItem.put("caloriasHora", caloriesPerHour);
        previewItem.put("diasSemana", days);
        previewItem.put("qtdExercicios", exList.size());
        preview.add(previewItem);
      }

      if (!errors.isEmpty()) {
        return ImportResultResponse.withErrors(rowCount, errors, "A planilha contém " + errors.size() + " inconsistência(s) que precisam ser corrigidas.");
      }

      if (dryRun) {
        return ImportResultResponse.validPreview(rowCount, preview, "Planilha validada com sucesso! " + rowCount + " treino(s) pronto(s) para importação.");
      }

      // Persistir de fato
      int imported = 0;
      for (WorkoutRequest w : parsedWorkouts) {
        workoutService.createWorkout(userId, w);
        imported++;
      }
      return ImportResultResponse.completed(imported, imported + " treino(s) importado(s) com sucesso para o seu caderno!");

    } catch (Exception e) {
      return ImportResultResponse.withErrors(0, List.of(
          new ImportValidationError(1, "Geral", "Arquivo", "Erro ao processar arquivo: " + e.getMessage(), "")),
          "Não foi possível ler a planilha Excel.");
    }
  }

  private void parseExercisesSheet(
      Sheet sheet,
      Map<String, List<Map<String, Object>>> exercisesByWorkout,
      List<ImportValidationError> errors) {
    int lastRow = sheet.getLastRowNum();
    for (int r = 1; r <= lastRow; r++) {
      Row row = sheet.getRow(r);
      if (isRowEmpty(row)) continue;
      int excelLine = r + 1;

      String workoutTitle = getCellString(row, 0);
      String exerciseName = getCellString(row, 1);
      Integer sets = getCellInt(row, 2);
      Integer reps = getCellInt(row, 3);
      String weight = getCellString(row, 4);
      Integer calories = getCellInt(row, 5);
      String notes = getCellString(row, 6);

      if (workoutTitle.isBlank()) {
        errors.add(new ImportValidationError(excelLine, sheet.getSheetName(), "Título do Treino", "O treino vinculado deve ser informado", ""));
        continue;
      }
      if (exerciseName.isBlank()) {
        errors.add(new ImportValidationError(excelLine, sheet.getSheetName(), "Nome do Exercício", "Nome do exercício é obrigatório", ""));
        continue;
      }

      Map<String, Object> ex = new LinkedHashMap<>();
      ex.put("id", UUID.randomUUID().toString());
      ex.put("name", exerciseName.trim());
      ex.put("sets", sets != null ? sets : 3);
      ex.put("reps", reps != null ? reps : 10);
      ex.put("weightKg", weight.isBlank() ? "0" : weight.trim());
      ex.put("estimatedCalories", calories != null ? calories : 30);
      ex.put("notes", notes.isBlank() ? "" : notes.trim());

      exercisesByWorkout.computeIfAbsent(workoutTitle.trim().toLowerCase(), k -> new ArrayList<>()).add(ex);
    }
  }

  // =========================================================================
  // 2. IMPORTAÇÃO DE REFEIÇÕES & DIÁRIO
  // =========================================================================
  @Transactional
  public ImportResultResponse importMeals(
      UUID userId, UUID familyId, InputStream is, boolean dryRun) {
    List<ImportValidationError> errors = new ArrayList<>();
    List<Map<String, Object>> preview = new ArrayList<>();
    List<CreateMealLogRequest> parsedLogs = new ArrayList<>();

    try (Workbook wb = WorkbookFactory.create(is)) {
      Sheet sheet = wb.getNumberOfSheets() > 0 ? wb.getSheetAt(0) : null;
      if (sheet == null) {
        return ImportResultResponse.withErrors(0, List.of(
            new ImportValidationError(1, "Geral", "Planilha", "Planilha vazia", "")),
            "Planilha sem conteúdo.");
      }

      int lastRow = sheet.getLastRowNum();
      int count = 0;

      for (int r = 1; r <= lastRow; r++) {
        Row row = sheet.getRow(r);
        if (isRowEmpty(row)) continue;
        count++;
        int excelLine = r + 1;

        String dateStr = getCellString(row, 0);
        String mealType = getCellString(row, 1).toUpperCase().trim();
        String dishName = getCellString(row, 2);
        String quantityStr = getCellString(row, 3);
        String unit = getCellString(row, 4);
        Integer calories = getCellInt(row, 5);
        BigDecimal proteins = getCellDecimal(row, 6);
        BigDecimal carbs = getCellDecimal(row, 7);
        BigDecimal fats = getCellDecimal(row, 8);

        LocalDate date = parseDate(dateStr);
        if (date == null) {
          errors.add(new ImportValidationError(excelLine, sheet.getSheetName(), "Data", "Data inválida ou fora do formato AAAA-MM-DD", dateStr));
        }
        if (!VALID_MEAL_TYPES.contains(mealType)) {
          errors.add(new ImportValidationError(excelLine, sheet.getSheetName(), "Tipo de Refeição", "Tipo inválido. Use: " + VALID_MEAL_TYPES, mealType));
        }
        if (dishName.isBlank()) {
          errors.add(new ImportValidationError(excelLine, sheet.getSheetName(), "Nome do Alimento", "Campo obrigatório", ""));
        }
        if (calories == null || calories < 0) {
          errors.add(new ImportValidationError(excelLine, sheet.getSheetName(), "Calorias (kcal)", "Calorias devem ser um número >= 0", String.valueOf(calories)));
        }

        LocalDateTime consumedAt = date != null ? date.atTime(12, 0) : LocalDateTime.now();
        CreateMealLogRequest req = new CreateMealLogRequest(
            mealType,
            dishName.trim(),
            BigDecimal.valueOf(calories != null ? calories : 0),
            proteins != null ? proteins : BigDecimal.ZERO,
            carbs != null ? carbs : BigDecimal.ZERO,
            fats != null ? fats : BigDecimal.ZERO,
            consumedAt,
            "Importado via planilha Excel"
        );
        parsedLogs.add(req);

        Map<String, Object> previewItem = new LinkedHashMap<>();
        previewItem.put("linha", excelLine);
        previewItem.put("data", dateStr);
        previewItem.put("refeicao", mealType);
        previewItem.put("alimento", dishName);
        previewItem.put("calorias", calories);
        previewItem.put("proteinas", proteins);
        previewItem.put("carboidratos", carbs);
        previewItem.put("gorduras", fats);
        preview.add(previewItem);
      }

      if (!errors.isEmpty()) {
        return ImportResultResponse.withErrors(count, errors, "A planilha contém " + errors.size() + " inconsistência(s).");
      }

      if (dryRun) {
        return ImportResultResponse.validPreview(count, preview, "Planilha validada com sucesso! " + count + " refeição(ões) pronta(s) para importação.");
      }

      int imported = 0;
      for (CreateMealLogRequest logReq : parsedLogs) {
        mealLogService.saveMealLog(userId, logReq);
        imported++;
      }
      return ImportResultResponse.completed(imported, imported + " refeição(ões) registrada(s) com sucesso no seu diário!");

    } catch (Exception e) {
      return ImportResultResponse.withErrors(0, List.of(
          new ImportValidationError(1, "Geral", "Arquivo", "Erro ao processar: " + e.getMessage(), "")),
          "Erro ao importar planilha de refeições.");
    }
  }

  // =========================================================================
  // 3. IMPORTAÇÃO DE RECEITAS
  // =========================================================================
  @Transactional
  public ImportResultResponse importRecipes(
      UUID userId, UUID familyId, InputStream is, boolean dryRun) {
    List<ImportValidationError> errors = new ArrayList<>();
    List<Map<String, Object>> preview = new ArrayList<>();
    List<RecipeRequest> parsedRecipes = new ArrayList<>();

    try (Workbook wb = WorkbookFactory.create(is)) {
      Sheet sheet = wb.getNumberOfSheets() > 0 ? wb.getSheetAt(0) : null;
      if (sheet == null) {
        return ImportResultResponse.withErrors(0, List.of(
            new ImportValidationError(1, "Geral", "Planilha", "Planilha vazia", "")),
            "Planilha sem conteúdo.");
      }

      int lastRow = sheet.getLastRowNum();
      int count = 0;

      for (int r = 1; r <= lastRow; r++) {
        Row row = sheet.getRow(r);
        if (isRowEmpty(row)) continue;
        count++;
        int excelLine = r + 1;

        String name = getCellString(row, 0);
        String category = getCellString(row, 1).toUpperCase().trim();
        Integer prepTime = getCellInt(row, 2);
        Integer servings = getCellInt(row, 3);
        Integer calories = getCellInt(row, 4);
        String ingredientsRaw = getCellString(row, 5);
        String prepStepsRaw = getCellString(row, 6);

        if (name.isBlank()) {
          errors.add(new ImportValidationError(excelLine, sheet.getSheetName(), "Nome da Receita", "Nome é obrigatório", ""));
        }
        if (category.isBlank()) {
          errors.add(new ImportValidationError(excelLine, sheet.getSheetName(), "Categoria", "Categoria é obrigatória", ""));
        }
        if (prepTime == null || prepTime <= 0) {
          errors.add(new ImportValidationError(excelLine, sheet.getSheetName(), "Tempo Preparo", "Tempo deve ser um número > 0", String.valueOf(prepTime)));
        }
        if (servings == null || servings <= 0) {
          errors.add(new ImportValidationError(excelLine, sheet.getSheetName(), "Porções", "Porções deve ser um número > 0", String.valueOf(servings)));
        }
        if (ingredientsRaw.isBlank()) {
          errors.add(new ImportValidationError(excelLine, sheet.getSheetName(), "Ingredientes", "Ao menos 1 ingrediente deve ser informado (separados por ;)", ""));
        }
        if (prepStepsRaw.isBlank()) {
          errors.add(new ImportValidationError(excelLine, sheet.getSheetName(), "Modo de Preparo", "Passos de preparo são obrigatórios", ""));
        }

        // Ingredientes
        List<RecipeIngredientRequest> ingList = new ArrayList<>();
        String[] ingParts = ingredientsRaw.split(";");
        for (String ing : ingParts) {
          String trimmed = ing.trim();
          if (!trimmed.isBlank()) {
            ingList.add(new RecipeIngredientRequest(trimmed, null, null));
          }
        }

        // Passos
        List<RecipeStepRequest> stepList = new ArrayList<>();
        String[] stepParts = prepStepsRaw.split(";");
        for (String st : stepParts) {
          String trimmed = st.trim();
          if (!trimmed.isBlank()) {
            stepList.add(new RecipeStepRequest(trimmed));
          }
        }

        RecipeRequest req = new RecipeRequest(
            name.trim(),
            "Receita importada via planilha",
            category,
            prepTime != null ? prepTime : 20,
            BigDecimal.valueOf(calories != null ? calories : 200),
            servings != null ? servings : 2,
            null,
            null,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            BigDecimal.ZERO,
            ingList,
            stepList
        );
        parsedRecipes.add(req);

        Map<String, Object> previewItem = new LinkedHashMap<>();
        previewItem.put("linha", excelLine);
        previewItem.put("nome", name);
        previewItem.put("categoria", category);
        previewItem.put("tempoMinutos", prepTime);
        previewItem.put("porcoes", servings);
        previewItem.put("calorias", calories);
        previewItem.put("qtdIngredientes", ingList.size());
        previewItem.put("qtdPassos", stepList.size());
        preview.add(previewItem);
      }

      if (!errors.isEmpty()) {
        return ImportResultResponse.withErrors(count, errors, "A planilha contém " + errors.size() + " inconsistência(s).");
      }

      if (dryRun) {
        return ImportResultResponse.validPreview(count, preview, "Planilha validada com sucesso! " + count + " receita(s) pronta(s) para importação.");
      }

      int imported = 0;
      for (RecipeRequest req : parsedRecipes) {
        recipeService.createRecipe(userId, req);
        imported++;
      }
      return ImportResultResponse.completed(imported, imported + " receita(s) importada(s) para o seu caderno com sucesso!");

    } catch (Exception e) {
      return ImportResultResponse.withErrors(0, List.of(
          new ImportValidationError(1, "Geral", "Arquivo", "Erro ao processar: " + e.getMessage(), "")),
          "Erro ao importar planilha de receitas.");
    }
  }

  // =========================================================================
  // 4. IMPORTAÇÃO DE CARDÁPIO / AGENDA SEMANAL
  // =========================================================================
  @Transactional
  public ImportResultResponse importWeeklyMenu(
      UUID userId, UUID familyId, InputStream is, boolean dryRun) {
    List<ImportValidationError> errors = new ArrayList<>();
    List<Map<String, Object>> preview = new ArrayList<>();
    List<CreateDietMealRequest> parsedDietMeals = new ArrayList<>();

    try (Workbook wb = WorkbookFactory.create(is)) {
      Sheet sheet = wb.getNumberOfSheets() > 0 ? wb.getSheetAt(0) : null;
      if (sheet == null) {
        return ImportResultResponse.withErrors(0, List.of(
            new ImportValidationError(1, "Geral", "Planilha", "Planilha vazia", "")),
            "Planilha sem conteúdo.");
      }

      int lastRow = sheet.getLastRowNum();
      int count = 0;

      for (int r = 1; r <= lastRow; r++) {
        Row row = sheet.getRow(r);
        if (isRowEmpty(row)) continue;
        count++;
        int excelLine = r + 1;

        String dayStr = getCellString(row, 0).toUpperCase().trim();
        String mealType = getCellString(row, 1).toUpperCase().trim();
        String timeStr = getCellString(row, 2).trim();
        String dishName = getCellString(row, 3);
        String notes = getCellString(row, 4);

        if (dayStr.isBlank()) {
          errors.add(new ImportValidationError(excelLine, sheet.getSheetName(), "Dia da Semana", "Dia da semana é obrigatório", ""));
        }
        if (dishName.isBlank()) {
          errors.add(new ImportValidationError(excelLine, sheet.getSheetName(), "Prato ou Preparação", "Nome do prato é obrigatório", ""));
        }

        CreateDietMealRequest req = new CreateDietMealRequest(
            dayStr,
            dishName.trim(),
            timeStr.isBlank() ? "12:00" : timeStr,
            notes.isBlank() ? null : notes.trim(),
            null,
            BigDecimal.ONE,
            List.of(),
            count
        );
        parsedDietMeals.add(req);

        Map<String, Object> previewItem = new LinkedHashMap<>();
        previewItem.put("linha", excelLine);
        previewItem.put("diaSemana", dayStr);
        previewItem.put("tipoRefeicao", mealType.isBlank() ? "REFEICAO" : mealType);
        previewItem.put("horario", timeStr.isBlank() ? "12:00" : timeStr);
        previewItem.put("prato", dishName);
        previewItem.put("observacoes", notes);
        preview.add(previewItem);
      }

      if (!errors.isEmpty()) {
        return ImportResultResponse.withErrors(count, errors, "A planilha contém " + errors.size() + " inconsistência(s).");
      }

      if (dryRun) {
        return ImportResultResponse.validPreview(count, preview, "Planilha validada com sucesso! " + count + " item(ns) de cardápio pronto(s) para importação.");
      }

      // Buscar ou criar dieta da semana atual
      LocalDate now = LocalDate.now();
      LocalDate monday = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
      WeeklyDietResponse diet = weeklyDietService.getOrCreateWeeklyDiet(userId, familyId, monday);
      UUID dietId = UUID.fromString(diet.id());

      int imported = 0;
      for (CreateDietMealRequest req : parsedDietMeals) {
        weeklyDietService.addMeal(userId, dietId, req);
        imported++;
      }
      return ImportResultResponse.completed(imported, imported + " item(ns) adicionado(s) à agenda semanal da família!");

    } catch (Exception e) {
      return ImportResultResponse.withErrors(0, List.of(
          new ImportValidationError(1, "Geral", "Arquivo", "Erro ao processar: " + e.getMessage(), "")),
          "Erro ao importar cardápio semanal.");
    }
  }

  // =========================================================================
  // Utilitários de Célula e Formato
  // =========================================================================
  private boolean isRowEmpty(Row row) {
    if (row == null) return true;
    for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
      Cell cell = row.getCell(c);
      if (cell != null && cell.getCellType() != CellType.BLANK && !getCellString(row, c).isBlank()) {
        return false;
      }
    }
    return true;
  }

  private String getCellString(Row row, int col) {
    Cell cell = row.getCell(col);
    if (cell == null) return "";
    return switch (cell.getCellType()) {
      case STRING -> cell.getStringCellValue().trim();
      case NUMERIC -> {
        if (DateUtil.isCellDateFormatted(cell)) {
          yield cell.getLocalDateTimeCellValue().toLocalDate().toString();
        }
        double val = cell.getNumericCellValue();
        if (val == (long) val) yield String.valueOf((long) val);
        yield String.valueOf(val);
      }
      case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
      case FORMULA -> {
        try {
          yield cell.getStringCellValue().trim();
        } catch (Exception e) {
          yield String.valueOf(cell.getNumericCellValue());
        }
      }
      default -> "";
    };
  }

  private Integer getCellInt(Row row, int col) {
    Cell cell = row.getCell(col);
    if (cell == null) return null;
    if (cell.getCellType() == CellType.NUMERIC) {
      return (int) Math.round(cell.getNumericCellValue());
    }
    String s = getCellString(row, col).replace(",", ".");
    try {
      return (int) Math.round(Double.parseDouble(s));
    } catch (Exception e) {
      return null;
    }
  }

  private BigDecimal getCellDecimal(Row row, int col) {
    Cell cell = row.getCell(col);
    if (cell == null) return BigDecimal.ZERO;
    if (cell.getCellType() == CellType.NUMERIC) {
      return BigDecimal.valueOf(cell.getNumericCellValue());
    }
    String s = getCellString(row, col).replace(",", ".");
    try {
      return new BigDecimal(s);
    } catch (Exception e) {
      return BigDecimal.ZERO;
    }
  }

  private LocalDate parseDate(String str) {
    if (str == null || str.isBlank()) return null;
    try {
      return LocalDate.parse(str.trim());
    } catch (Exception e) {
      try {
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return LocalDate.parse(str.trim(), dtf);
      } catch (Exception ignored) {
        return null;
      }
    }
  }

  private LocalTime parseTime(String str) {
    if (str == null || str.isBlank()) return LocalTime.of(12, 0);
    try {
      return LocalTime.parse(str.trim());
    } catch (Exception e) {
      try {
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("HH:mm");
        return LocalTime.parse(str.trim(), dtf);
      } catch (Exception ignored) {
        return LocalTime.of(12, 0);
      }
    }
  }
}
