package br.com.gelu.menu.imports;

import br.com.gelu.menu.auth.AuthenticatedUser;
import br.com.gelu.menu.common.api.ApiResponse;
import br.com.gelu.menu.common.exception.BadRequestException;
import br.com.gelu.menu.imports.dto.ImportResultResponse;
import br.com.gelu.menu.imports.service.ExcelImportService;
import br.com.gelu.menu.imports.service.ExcelTemplateService;
import java.io.InputStream;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/imports")
public class ExcelImportController {

  private final ExcelTemplateService templateService;
  private final ExcelImportService importService;

  public ExcelImportController(
      ExcelTemplateService templateService, ExcelImportService importService) {
    this.templateService = templateService;
    this.importService = importService;
  }

  @GetMapping("/template/{module}")
  public ResponseEntity<byte[]> downloadTemplate(@PathVariable String module) {
    byte[] excelBytes = templateService.generateTemplate(module);

    String filename = "modelo_" + module.toLowerCase() + "_gelu.xlsx";
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
        .contentType(
            MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
        .body(excelBytes);
  }

  @PostMapping(value = "/{module}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ApiResponse<ImportResultResponse> importFile(
      @AuthenticationPrincipal AuthenticatedUser user,
      @PathVariable String module,
      @RequestParam("file") MultipartFile file,
      @RequestParam(value = "dryRun", defaultValue = "true") boolean dryRun,
      @RequestParam(value = "familyId", required = false) UUID familyId) {

    if (file == null || file.isEmpty()) {
      throw new BadRequestException("O arquivo de planilha é obrigatório.");
    }

    String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
    if (!filename.endsWith(".xlsx") && !filename.endsWith(".xls") && !filename.endsWith(".csv")) {
      throw new BadRequestException("Formato não suportado. Envie um arquivo Excel (.xlsx, .xls) ou CSV (.csv).");
    }

    // Limite de 5 MB para planilhas
    if (file.getSize() > 5 * 1024 * 1024) {
      throw new BadRequestException("A planilha não pode ultrapassar o limite de 5 MB.");
    }

    try (InputStream is = file.getInputStream()) {
      String mod = module.trim().toUpperCase();
      ImportResultResponse result =
          switch (mod) {
            case "WORKOUTS", "TREINOS" -> importService.importWorkouts(user.id(), familyId, is, dryRun);
            case "MEALS", "REFEICOES" -> importService.importMeals(user.id(), familyId, is, dryRun);
            case "RECIPES", "RECEITAS" -> importService.importRecipes(user.id(), familyId, is, dryRun);
            case "WEEKLY_MENU", "CARDAPIO", "AGENDA" -> importService.importWeeklyMenu(user.id(), familyId, is, dryRun);
            default -> throw new BadRequestException("Módulo desconhecido: " + module);
          };

      return ApiResponse.ok(result, result.summaryMessage());
    } catch (BadRequestException bre) {
      throw bre;
    } catch (Exception e) {
      throw new BadRequestException("Erro ao processar planilha: " + e.getMessage());
    }
  }
}
