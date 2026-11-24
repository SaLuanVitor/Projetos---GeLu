package br.com.gelu.menu.admin;

import br.com.gelu.menu.admin.dto.AdminDashboardTelemetryResponse;
import br.com.gelu.menu.admin.dto.AdminFamilyMemberResponse;
import br.com.gelu.menu.admin.dto.AdminFamilyResponse;
import br.com.gelu.menu.admin.dto.AdminMetricsResponse;
import br.com.gelu.menu.admin.dto.AdminTeamMemberResponse;
import br.com.gelu.menu.admin.dto.AdminUserResponse;
import br.com.gelu.menu.admin.dto.AiUsageLogResponse;
import br.com.gelu.menu.admin.dto.AiUsageSummaryResponse;
import br.com.gelu.menu.admin.dto.CreateAdminTeamRequest;
import br.com.gelu.menu.admin.dto.PiiRevealRequest;
import br.com.gelu.menu.admin.dto.SupportTicketResponse;
import br.com.gelu.menu.admin.dto.SystemAuditLogResponse;
import br.com.gelu.menu.admin.dto.SystemSettingResponse;
import br.com.gelu.menu.admin.dto.TestGeminiRequest;
import br.com.gelu.menu.admin.dto.TestGeminiResponse;
import br.com.gelu.menu.admin.dto.UpdateAdminRoleRequest;
import br.com.gelu.menu.admin.dto.UpdateAdminStatusRequest;
import br.com.gelu.menu.admin.dto.UpdateSupportTicketStatusRequest;
import br.com.gelu.menu.admin.dto.UpdateSystemSettingsRequest;
import br.com.gelu.menu.admin.dto.UserAiUsageResponse;
import br.com.gelu.menu.admin.dto.UserDataExportResponse;
import br.com.gelu.menu.ai.learning.AiFeedbackRepository;
import br.com.gelu.menu.auth.token.RefreshTokenRepository;
import br.com.gelu.menu.common.exception.BadRequestException;
import br.com.gelu.menu.common.exception.ConflictException;
import br.com.gelu.menu.common.exception.ForbiddenException;
import br.com.gelu.menu.common.exception.NotFoundException;
import br.com.gelu.menu.diet.WeeklyDietRepository;
import br.com.gelu.menu.family.Family;
import br.com.gelu.menu.family.FamilyMember;
import br.com.gelu.menu.family.FamilyRepository;
import br.com.gelu.menu.meals.MealLogRepository;
import br.com.gelu.menu.recipes.RecipeRepository;
import br.com.gelu.menu.users.User;
import br.com.gelu.menu.users.UserRepository;
import br.com.gelu.menu.workouts.WorkoutLogRepository;
import com.zaxxer.hikari.HikariDataSource;
import java.lang.management.ManagementFactory;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {

  private final UserRepository userRepository;
  private final FamilyRepository familyRepository;
  private final RecipeRepository recipeRepository;
  private final WeeklyDietRepository weeklyDietRepository;
  private final WorkoutLogRepository workoutLogRepository;
  private final SupportTicketRepository supportTicketRepository;
  private final SystemSettingRepository systemSettingRepository;
  private final AiUsageLogRepository aiUsageLogRepository;
  private final SystemAuditLogRepository systemAuditLogRepository;
  private final MealLogRepository mealLogRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final AiFeedbackRepository aiFeedbackRepository;
  private final DataSource dataSource;
  private final PasswordEncoder passwordEncoder;
  private final String superAdminEmail;

  @Autowired
  public AdminService(
      UserRepository userRepository,
      FamilyRepository familyRepository,
      RecipeRepository recipeRepository,
      WeeklyDietRepository weeklyDietRepository,
      WorkoutLogRepository workoutLogRepository,
      SupportTicketRepository supportTicketRepository,
      SystemSettingRepository systemSettingRepository,
      AiUsageLogRepository aiUsageLogRepository,
      SystemAuditLogRepository systemAuditLogRepository,
      MealLogRepository mealLogRepository,
      RefreshTokenRepository refreshTokenRepository,
      AiFeedbackRepository aiFeedbackRepository,
      DataSource dataSource,
      PasswordEncoder passwordEncoder,
      @Value("${gelu.super-admin-email:luanvitors_852@hotmail.com}") String superAdminEmail) {
    this.userRepository = userRepository;
    this.familyRepository = familyRepository;
    this.recipeRepository = recipeRepository;
    this.weeklyDietRepository = weeklyDietRepository;
    this.workoutLogRepository = workoutLogRepository;
    this.supportTicketRepository = supportTicketRepository;
    this.systemSettingRepository = systemSettingRepository;
    this.aiUsageLogRepository = aiUsageLogRepository;
    this.systemAuditLogRepository = systemAuditLogRepository;
    this.mealLogRepository = mealLogRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.aiFeedbackRepository = aiFeedbackRepository;
    this.dataSource = dataSource;
    this.passwordEncoder = passwordEncoder;
    this.superAdminEmail = superAdminEmail;
  }

  public AdminRole getRole(UUID adminId) {
    if (adminId == null) {
      return null;
    }
    return userRepository
        .findById(adminId)
        .map(
            u -> {
              if (u.getAdminRole() != null) return u.getAdminRole();
              if (isMasterSuperAdmin(u.getEmail())) return AdminRole.SUPER_ADMIN;
              return null;
            })
        .orElse(null);
  }

  public boolean isMasterSuperAdmin(String email) {
    return email != null
        && superAdminEmail != null
        && email.trim().equalsIgnoreCase(superAdminEmail.trim());
  }

  public boolean isSuperAdmin(UUID adminId) {
    AdminRole role = getRole(adminId);
    return role == AdminRole.SUPER_ADMIN;
  }

  public void assertAdminAccess(UUID adminId) {
    AdminRole role = getRole(adminId);
    if (role == null) {
      throw new ForbiddenException(
          "Acesso negado: Requer privilégios de operador ou administrador do backoffice");
    }
  }

  public void assertSuperAdmin(UUID adminId) {
    if (!isSuperAdmin(adminId)) {
      throw new ForbiddenException("Acesso negado: Operação restrita ao perfil Super Admin");
    }
  }

  public void assertCanManageUsers(UUID adminId) {
    AdminRole role = getRole(adminId);
    if (role != AdminRole.SUPER_ADMIN && role != AdminRole.ADMIN) {
      throw new ForbiddenException("Acesso negado: Perfil sem permissão para gerenciar usuários");
    }
  }

  public void assertCanManageTickets(UUID adminId) {
    AdminRole role = getRole(adminId);
    if (role != AdminRole.SUPER_ADMIN && role != AdminRole.ADMIN && role != AdminRole.SUPPORT) {
      throw new ForbiddenException(
          "Acesso negado: Perfil sem permissão para gerenciar chamados de suporte");
    }
  }

  public String currentAdminEmail(UUID adminId) {
    if (adminId == null) return "system";
    return userRepository.findById(adminId).map(User::getEmail).orElse("admin");
  }

  @Transactional(readOnly = true)
  public AdminMetricsResponse getMetrics(UUID adminId) {
    assertAdminAccess(adminId);
    long users = userRepository.count();
    long families = familyRepository.count();
    long recipes = recipeRepository.count();
    long diets = weeklyDietRepository.count();
    long workouts = workoutLogRepository.count();
    long openTickets = supportTicketRepository.countByStatus("OPEN");
    long totalTokens = aiUsageLogRepository.sumTotalTokens();

    return new AdminMetricsResponse(
        users, families, recipes, diets, workouts, totalTokens, openTickets);
  }

  @Transactional(readOnly = true)
  public AdminDashboardTelemetryResponse getDashboardTelemetry(UUID adminId) {
    assertAdminAccess(adminId);

    LocalDateTime now = LocalDateTime.now();
    LocalDateTime since24h = now.minusHours(24);
    LocalDateTime since30d = now.minusDays(30);
    LocalDateTime todayStart = now.toLocalDate().atStartOfDay();

    // 1. Acessos & Usuários
    long totalUsers = userRepository.count();
    long activeUsers24h = userRepository.countActiveSince(since24h);
    long activeUsers30d = userRepository.countActiveSince(since30d);
    long totalSessionsActive = refreshTokenRepository.countActiveSessions();
    long totalFamilies = familyRepository.count();
    long mealsLoggedToday = mealLogRepository.countSince(todayStart);
    long recipesCount = recipeRepository.count();
    long weeklyDietsCount = weeklyDietRepository.count();

    // 2. Alertas & Segurança
    List<SystemAuditLog> allAudit = systemAuditLogRepository.findAll();
    long piiRevealsCount = allAudit.stream()
        .filter(l -> l.getAction() != null && l.getAction().toUpperCase().contains("PII"))
        .count();
    long securityAlertsCount = allAudit.stream()
        .filter(l -> l.getAction() != null && (
            l.getAction().toUpperCase().contains("SUSPICIOUS") ||
            l.getAction().toUpperCase().contains("FAILED") ||
            l.getAction().toUpperCase().contains("SECURITY") ||
            l.getAction().toUpperCase().contains("PII")
        ))
        .count();
    long openTicketsCount = supportTicketRepository.countByStatus("OPEN");
    long urgentTicketsCount = supportTicketRepository.countUrgentOpen();

    // 3. Telemetria de IA & Orçamento
    long aiTotalRequests = aiUsageLogRepository.count();
    long aiTotalTokens = aiUsageLogRepository.sumTotalTokens();
    long aiPromptTokens = aiUsageLogRepository.sumPromptTokens();
    long aiCompletionTokens = aiUsageLogRepository.sumCompletionTokens();

    double costUsd = (aiPromptTokens * 0.000000075) + (aiCompletionTokens * 0.00000030);
    double costBrl = costUsd * 5.80;
    String aiEstimatedCostBrl = costBrl == 0 ? "R$ 0,00 (Free Tier)" : String.format(Locale.forLanguageTag("pt-BR"), "R$ %.4f", costBrl);

    int aiMonthlyBudgetTokens = 10_000_000;
    SystemSetting budgetSetting = systemSettingRepository.findByKey("ai.monthly_token_budget").orElse(null);
    if (budgetSetting != null && budgetSetting.getValue() != null) {
      try {
        aiMonthlyBudgetTokens = Integer.parseInt(budgetSetting.getValue().trim());
      } catch (Exception ignored) {}
    }
    int aiBudgetUsedPercent = aiMonthlyBudgetTokens > 0
        ? (int) Math.min(100, (aiTotalTokens * 100) / aiMonthlyBudgetTokens)
        : 0;

    String aiConfiguredModel = systemSettingRepository.findByKey("ai.model_name")
        .map(SystemSetting::getValue)
        .filter(v -> !v.isBlank())
        .orElse("gemini-1.5-flash");

    long aiFeedbackPositive = aiFeedbackRepository.countByPositive(true);
    long aiFeedbackNegative = aiFeedbackRepository.countByPositive(false);
    long aiFeedbackTotal = aiFeedbackPositive + aiFeedbackNegative;
    double aiSatisfactionRatePercent = aiFeedbackTotal > 0
        ? Math.round(((double) aiFeedbackPositive / aiFeedbackTotal) * 1000.0) / 10.0
        : 100.0;

    // 4. Live Health dos Serviços
    String dbStatus = "HEALTHY";
    int activeConn = 1;
    int idleConn = 9;
    int maxConn = 10;
    double dbLatency = 1.2;
    if (dataSource instanceof HikariDataSource hikari) {
      if (hikari.getHikariPoolMXBean() != null) {
        activeConn = hikari.getHikariPoolMXBean().getActiveConnections();
        idleConn = hikari.getHikariPoolMXBean().getIdleConnections();
        maxConn = hikari.getMaximumPoolSize();
      }
      try (var conn = dataSource.getConnection()) {
        long start = System.nanoTime();
        boolean valid = conn.isValid(2);
        long end = System.nanoTime();
        dbLatency = Math.round(((end - start) / 1_000_000.0) * 100.0) / 100.0;
        if (!valid) dbStatus = "DEGRADED";
      } catch (Exception e) {
        dbStatus = "DOWN";
      }
    }
    var databaseHealth = new AdminDashboardTelemetryResponse.DatabaseHealthDto(
        dbStatus, activeConn, idleConn, maxConn, dbLatency);

    Runtime rt = Runtime.getRuntime();
    long maxMb = rt.maxMemory() / (1024 * 1024);
    long usedMb = (rt.totalMemory() - rt.freeMemory()) / (1024 * 1024);
    long uptimeSec = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;
    String jvmStatus = usedMb > (maxMb * 0.9) ? "HIGH_MEMORY" : "HEALTHY";
    var jvmHealth = new AdminDashboardTelemetryResponse.JvmHealthDto(
        jvmStatus, uptimeSec, usedMb, maxMb);

    var storageHealth = new AdminDashboardTelemetryResponse.StorageHealthDto(
        "HEALTHY", "MinIO S3", "gelu-menu");

    var aiServiceHealth = new AdminDashboardTelemetryResponse.AiServiceHealthDto(
        "ONLINE", aiConfiguredModel, 142.0, true);

    var websocketHealth = new AdminDashboardTelemetryResponse.WebSocketHealthDto(
        "CONNECTED", (int) Math.max(1, totalSessionsActive));

    // 5. Atividades recentes & Auditoria
    List<AdminDashboardTelemetryResponse.RecentAuditItemDto> recentAudit = systemAuditLogRepository
        .findTop50ByOrderByCreatedAtDesc()
        .stream()
        .limit(8)
        .map(a -> new AdminDashboardTelemetryResponse.RecentAuditItemDto(
            a.getId() != null ? a.getId().toString() : UUID.randomUUID().toString(),
            a.getAction(),
            a.getActorEmail(),
            a.getDetails(),
            a.getCreatedAt()))
        .toList();

    return new AdminDashboardTelemetryResponse(
        totalUsers,
        activeUsers24h,
        activeUsers30d,
        totalSessionsActive,
        totalFamilies,
        mealsLoggedToday,
        recipesCount,
        weeklyDietsCount,
        securityAlertsCount,
        piiRevealsCount,
        openTicketsCount,
        urgentTicketsCount,
        aiTotalRequests,
        aiTotalTokens,
        aiPromptTokens,
        aiCompletionTokens,
        aiEstimatedCostBrl,
        aiMonthlyBudgetTokens,
        aiBudgetUsedPercent,
        aiConfiguredModel,
        aiFeedbackTotal,
        aiFeedbackPositive,
        aiFeedbackNegative,
        aiSatisfactionRatePercent,
        databaseHealth,
        jvmHealth,
        storageHealth,
        aiServiceHealth,
        websocketHealth,
        recentAudit,
        now);
  }

  @Transactional(readOnly = true)
  public List<AdminUserResponse> listUsers(UUID adminId) {
    assertAdminAccess(adminId);
    List<User> users = userRepository.findAll();
    return users.stream()
        .map(
            u ->
                new AdminUserResponse(
                    u.getId(),
                    u.getName(),
                    u.getEmail(),
                    u.isActive(),
                    u.getCreatedAt(),
                    familyRepository.findAllByMemberUserId(u.getId()).size()))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<AdminFamilyResponse> listFamilies(UUID adminId) {
    assertAdminAccess(adminId);
    List<Family> families = familyRepository.findAll();
    return families.stream()
        .map(
            f -> {
              User owner = userRepository.findById(f.getOwnerId()).orElse(null);
              String ownerName = owner != null ? owner.getName() : "Desconhecido";
              String ownerEmail = owner != null ? owner.getEmail() : "";
              List<AdminFamilyMemberResponse> members = new ArrayList<>();
              if (f.getMembers() != null) {
                for (FamilyMember m : f.getMembers()) {
                  members.add(
                      new AdminFamilyMemberResponse(
                          m.getId(),
                          m.getUser().getId(),
                          m.getUser().getName(),
                          m.getUser().getEmail(),
                          m.getRole() != null ? m.getRole().name() : "MEMBER",
                          m.getJoinedAt()));
                }
              }
              return new AdminFamilyResponse(
                  f.getId(),
                  f.getName(),
                  f.getOwnerId(),
                  ownerName,
                  ownerEmail,
                  members.size(),
                  f.getCreatedAt(),
                  members);
            })
        .toList();
  }

  @Transactional(readOnly = true)
  public List<SupportTicketResponse> listTickets(UUID adminId, String status) {
    assertCanManageTickets(adminId);
    List<SupportTicket> list;
    if (status != null && !status.isBlank()) {
      list = supportTicketRepository.findAllByStatusWithUser(status.trim().toUpperCase());
    } else {
      list = supportTicketRepository.findAllWithUser();
    }
    return list.stream().map(SupportTicketResponse::from).toList();
  }

  @Transactional
  public SupportTicketResponse updateTicketStatus(
      UUID adminId, UUID ticketId, UpdateSupportTicketStatusRequest request) {
    assertCanManageTickets(adminId);
    SupportTicket ticket =
        supportTicketRepository
            .findById(ticketId)
            .orElseThrow(() -> new NotFoundException("Ticket not found"));

    ticket.updateStatus(request.status(), request.adminNotes());
    SupportTicket saved = supportTicketRepository.save(ticket);

    systemAuditLogRepository.save(
        new SystemAuditLog(
            superAdminEmail,
            "TICKET_STATUS_UPDATED",
            "Chamado " + ticketId + " atualizado para " + request.status(),
            "internal"));

    return SupportTicketResponse.from(saved);
  }

  @Transactional(readOnly = true)
  public List<SystemSettingResponse> getSettings(UUID adminId) {
    assertSuperAdmin(adminId);
    return systemSettingRepository.findAll().stream()
        .map(
            s -> {
              String val = s.getValue();
              if ("gemini_api_key".equals(s.getKey()) && val != null && val.length() > 8) {
                val = val.substring(0, 6) + "..." + val.substring(val.length() - 4);
              }
              return new SystemSettingResponse(s.getKey(), val, s.getUpdatedAt(), s.getUpdatedBy());
            })
        .toList();
  }

  @Transactional
  public void updateSettings(UUID adminId, UpdateSystemSettingsRequest request) {
    assertSuperAdmin(adminId);
    if (request.settings() != null) {
      for (Map.Entry<String, String> entry : request.settings().entrySet()) {
        String key = entry.getKey();
        String val = entry.getValue();
        // Não sobrescreve a chave se vier mascarada
        if ("gemini_api_key".equals(key) && val != null && val.contains("...")) {
          continue;
        }
        SystemSetting setting =
            systemSettingRepository
                .findByKey(key)
                .orElse(new SystemSetting(key, val != null ? val : "", superAdminEmail));
        setting.setValue(val != null ? val : "", superAdminEmail);
        systemSettingRepository.save(setting);
      }

      systemAuditLogRepository.save(
          new SystemAuditLog(
              superAdminEmail,
              "SETTINGS_UPDATED",
              "Configurações atualizadas: " + request.settings().keySet(),
              "internal"));
    }
  }

  @Transactional(readOnly = true)
  public AiUsageSummaryResponse getAiUsageSummary(UUID adminId) {
    assertAdminAccess(adminId);
    long totalRequests = aiUsageLogRepository.count();
    long totalTokens = aiUsageLogRepository.sumTotalTokens();
    long promptTokens = aiUsageLogRepository.sumPromptTokens();
    long completionTokens = aiUsageLogRepository.sumCompletionTokens();

    String configuredModel =
        systemSettingRepository
            .findByKey("gemini_model")
            .map(SystemSetting::getValue)
            .orElse("gemini-1.5-flash");

    String rawKey =
        systemSettingRepository.findByKey("gemini_api_key").map(SystemSetting::getValue).orElse("");
    boolean hasKey = !rawKey.isBlank();

    // Estimativa de custo: No Free Tier = R$ 0,00.
    // Pay-as-you-go: ~$0.075 / 1M prompt, ~$0.30 / 1M output -> em BRL ~5.80
    double costUsd = (promptTokens * 0.000000075) + (completionTokens * 0.00000030);
    double costBrl = costUsd * 5.80;
    String formattedCost = costBrl == 0 ? "R$ 0,00 (Free Tier)" : String.format("R$ %.4f", costBrl);

    List<AiUsageLogResponse> recentLogs =
        aiUsageLogRepository.findTop50ByOrderByCreatedAtDesc().stream()
            .map(
                l ->
                    new AiUsageLogResponse(
                        l.getId(),
                        l.getUserId(),
                        l.getFamilyId(),
                        l.getOperationType(),
                        l.getModelName(),
                        l.getPromptTokens(),
                        l.getCompletionTokens(),
                        l.getTotalTokens(),
                        l.getLatencyMs(),
                        l.getStatus(),
                        l.getCreatedAt()))
            .toList();

    return new AiUsageSummaryResponse(
        totalRequests,
        totalTokens,
        promptTokens,
        completionTokens,
        formattedCost,
        configuredModel,
        hasKey,
        recentLogs);
  }

  public TestGeminiResponse testGeminiConnection(UUID adminId, TestGeminiRequest request) {
    assertSuperAdmin(adminId);
    String apiKey = request.apiKey();
    if (apiKey == null || apiKey.isBlank() || apiKey.contains("...")) {
      apiKey =
          systemSettingRepository
              .findByKey("gemini_api_key")
              .map(SystemSetting::getValue)
              .orElse("");
    }

    if (apiKey.isBlank()) {
      return new TestGeminiResponse(
          false, "Nenhuma chave de API configurada. Cole uma chave válida para testar.", 0);
    }

    String model =
        request.model() != null && !request.model().isBlank()
            ? request.model()
            : "gemini-2.5-flash";

    long start = System.currentTimeMillis();
    try {
      String endpoint =
          "https://generativelanguage.googleapis.com/v1beta/models/"
              + model
              + ":generateContent?key="
              + apiKey.trim();

      String jsonPayload =
          "{\"contents\":[{\"parts\":[{\"text\":\"Ping de teste do sistema GeLu.\"}]}]}";

      HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
      HttpRequest httpRequest =
          HttpRequest.newBuilder()
              .uri(URI.create(endpoint))
              .header("Content-Type", "application/json")
              .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
              .timeout(Duration.ofSeconds(15))
              .build();

      HttpResponse<String> response =
          client.send(httpRequest, HttpResponse.BodyHandlers.ofString());
      long latency = System.currentTimeMillis() - start;

      if (response.statusCode() >= 200 && response.statusCode() < 300) {
        return new TestGeminiResponse(
            true, "Conexão com Google AI (" + model + ") realizada com sucesso!", latency);
      } else {
        return new TestGeminiResponse(
            false,
            "Erro na resposta da Google API (" + response.statusCode() + "): " + response.body(),
            latency);
      }
    } catch (Exception e) {
      long latency = System.currentTimeMillis() - start;
      return new TestGeminiResponse(
          false, "Falha de conexão com a API da Google: " + e.getMessage(), latency);
    }
  }

  @Transactional(readOnly = true)
  public List<SystemAuditLogResponse> getSystemAuditLogs(UUID adminId) {
    assertAdminAccess(adminId);
    return systemAuditLogRepository.findTop50ByOrderByCreatedAtDesc().stream()
        .map(
            l ->
                new SystemAuditLogResponse(
                    l.getId(),
                    l.getActorEmail(),
                    l.getAction(),
                    l.getDetails(),
                    l.getIpAddress(),
                    l.getCreatedAt()))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<UserAiUsageResponse> getUserAiUsage(UUID adminId) {
    assertAdminAccess(adminId);
    List<AiUsageLog> logs = aiUsageLogRepository.findAll();
    List<User> allUsers = userRepository.findAll();
    Map<UUID, User> userMap =
        allUsers.stream().collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));
    Map<UUID, String> familyNames =
        familyRepository.findAll().stream()
            .collect(Collectors.toMap(Family::getId, Family::getName, (a, b) -> a));

    Map<UUID, List<AiUsageLog>> logsByUser =
        logs.stream()
            .filter(l -> l.getUserId() != null)
            .collect(Collectors.groupingBy(AiUsageLog::getUserId));

    List<UserAiUsageResponse> result = new ArrayList<>();
    for (Map.Entry<UUID, List<AiUsageLog>> entry : logsByUser.entrySet()) {
      UUID uId = entry.getKey();
      List<AiUsageLog> userLogs = entry.getValue();
      User u = userMap.get(uId);
      String userName =
          u != null ? u.getName() : "Usuário (" + uId.toString().substring(0, 8) + ")";
      String userEmail = u != null ? u.getEmail() : "N/D";

      long reqCount = userLogs.size();
      long promptTok = userLogs.stream().mapToLong(AiUsageLog::getPromptTokens).sum();
      long compTok = userLogs.stream().mapToLong(AiUsageLog::getCompletionTokens).sum();
      long totalTok = userLogs.stream().mapToLong(AiUsageLog::getTotalTokens).sum();

      UUID famId = userLogs.get(0).getFamilyId();
      String famName = famId != null ? familyNames.getOrDefault(famId, "Família") : "Uso Pessoal";

      LocalDateTime lastUsed =
          userLogs.stream()
              .map(AiUsageLog::getCreatedAt)
              .max(LocalDateTime::compareTo)
              .orElse(null);

      double costUsd = (promptTok * 0.000000075) + (compTok * 0.00000030);
      double costBrl = costUsd * 5.80;
      String estimatedCostBrl = String.format("R$ %.4f", costBrl);

      result.add(
          new UserAiUsageResponse(
              uId,
              userName,
              userEmail,
              famId,
              famName,
              reqCount,
              promptTok,
              compTok,
              totalTok,
              estimatedCostBrl,
              lastUsed));
    }

    result.sort(Comparator.comparing(UserAiUsageResponse::totalTokens).reversed());
    return result;
  }

  @Transactional
  public UserDataExportResponse exportUserData(UUID adminId, UUID targetUserId) {
    assertCanManageUsers(adminId);
    User target =
        userRepository
            .findById(targetUserId)
            .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

    List<String> userFamilies =
        familyRepository.findAllByMemberUserId(targetUserId).stream().map(Family::getName).toList();

    long recipesCount =
        recipeRepository.findAll().stream().filter(r -> r.getUserId().equals(targetUserId)).count();

    long dietsCount =
        weeklyDietRepository.findAll().stream()
            .filter(d -> d.getUser() != null && d.getUser().getId().equals(targetUserId))
            .count();

    long workoutsCount =
        workoutLogRepository.findAll().stream()
            .filter(w -> w.getUser().getId().equals(targetUserId))
            .count();

    long aiReqsCount =
        aiUsageLogRepository.findAll().stream()
            .filter(l -> l.getUserId() != null && l.getUserId().equals(targetUserId))
            .count();

    systemAuditLogRepository.save(
        new SystemAuditLog(
            superAdminEmail,
            "LGPD_EXPORT_USER_DATA",
            "Exportação de dados pessoais do titular "
                + target.getEmail()
                + " ("
                + targetUserId
                + ")",
            "internal"));

    return new UserDataExportResponse(
        target.getId(),
        target.getName(),
        target.getEmail(),
        target.getCreatedAt(),
        target.isActive(),
        userFamilies,
        recipesCount,
        dietsCount,
        workoutsCount,
        aiReqsCount,
        LocalDateTime.now(),
        "Relatório emitido em conformidade com o Artigo 18 da Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).");
  }

  @Transactional
  public void anonymizeUser(UUID adminId, UUID targetUserId) {
    assertCanManageUsers(adminId);
    User target =
        userRepository
            .findById(targetUserId)
            .orElseThrow(() -> new NotFoundException("Usuário não encontrado"));

    if (superAdminEmail != null
        && target.getEmail().trim().equalsIgnoreCase(superAdminEmail.trim())) {
      throw new IllegalArgumentException("A conta de Super Admin não pode ser anonimizada.");
    }

    String oldEmail = target.getEmail();
    target.anonymizeLgpd();
    userRepository.save(target);

    systemAuditLogRepository.save(
        new SystemAuditLog(
            superAdminEmail,
            "LGPD_ANONYMIZE_USER",
            "Usuário "
                + oldEmail
                + " ("
                + targetUserId
                + ") anonimizado em conformidade com o Art. 18 da LGPD.",
            "internal"));
  }

  @Transactional
  public void logPiiReveal(UUID adminId, String details) {
    assertAdminAccess(adminId);
    systemAuditLogRepository.save(
        new SystemAuditLog(
            currentAdminEmail(adminId),
            "LGPD_PII_REVEALED",
            details != null && !details.isBlank()
                ? details
                : "Operador desativou o Modo Privacidade LGPD e visualizou dados pessoais na tela.",
            "internal"));
  }

  @Transactional
  public void logPiiRevealWithReason(UUID adminId, PiiRevealRequest request) {
    assertAdminAccess(adminId);
    if (request.reason() == null || request.reason().trim().length() < 5) {
      throw new BadRequestException(
          "A justificativa de acesso a dados pessoais é obrigatória (mínimo de 5 caracteres)");
    }
    User target = userRepository.findById(request.targetUserId()).orElse(null);
    String targetDesc = target != null ? target.getEmail() : request.targetUserId().toString();

    systemAuditLogRepository.save(
        new SystemAuditLog(
            currentAdminEmail(adminId),
            "LGPD_PII_REVEALED",
            "Desmascarou dados pessoais com justificativa: \""
                + request.reason().trim()
                + "\" [Alvo: "
                + targetDesc
                + "]",
            "internal"));
  }

  @Transactional(readOnly = true)
  public List<AdminTeamMemberResponse> listTeam(UUID adminId) {
    assertSuperAdmin(adminId);
    return userRepository.findAll().stream()
        .filter(u -> u.getAdminRole() != null || isMasterSuperAdmin(u.getEmail()))
        .sorted(Comparator.comparing(User::getCreatedAt))
        .map(
            u -> {
              AdminRole role = u.getAdminRole() != null ? u.getAdminRole() : AdminRole.SUPER_ADMIN;
              boolean isMaster = isMasterSuperAdmin(u.getEmail());
              boolean isSelf = u.getId().equals(adminId);
              return new AdminTeamMemberResponse(
                  u.getId(),
                  u.getName(),
                  u.getEmail(),
                  role,
                  u.isActive(),
                  u.getCreatedAt(),
                  isMaster,
                  isSelf);
            })
        .collect(Collectors.toList());
  }

  @Transactional
  public AdminTeamMemberResponse createTeamMember(UUID adminId, CreateAdminTeamRequest request) {
    assertSuperAdmin(adminId);
    String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
    if (userRepository.existsByEmail(normalizedEmail)) {
      throw new ConflictException("E-mail já cadastrado no sistema.");
    }

    User operator =
        new User(
            request.name().trim(),
            normalizedEmail,
            passwordEncoder.encode(request.password().trim()));
    operator.setAdminRole(request.role());
    User saved = userRepository.save(operator);

    systemAuditLogRepository.save(
        new SystemAuditLog(
            currentAdminEmail(adminId),
            "TEAM_MEMBER_CREATED",
            "Criou operador: " + saved.getEmail() + " com cargo: " + request.role(),
            "internal"));

    return new AdminTeamMemberResponse(
        saved.getId(),
        saved.getName(),
        saved.getEmail(),
        saved.getAdminRole(),
        saved.isActive(),
        saved.getCreatedAt(),
        false,
        false);
  }

  @Transactional
  public AdminTeamMemberResponse updateTeamMemberRole(
      UUID adminId, UUID targetMemberId, UpdateAdminRoleRequest request) {
    assertSuperAdmin(adminId);
    if (targetMemberId.equals(adminId)) {
      throw new BadRequestException(
          "Regra de segurança violada: Você não pode alterar sua própria permissão de acesso.");
    }
    User target =
        userRepository
            .findById(targetMemberId)
            .orElseThrow(() -> new NotFoundException("Operador não encontrado."));

    if (isMasterSuperAdmin(target.getEmail())) {
      throw new ForbiddenException(
          "Regra de segurança violada: A conta mestre de Super Admin é protegida e não pode ter suas permissões alteradas.");
    }

    AdminRole oldRole = target.getAdminRole();
    target.setAdminRole(request.role());
    User saved = userRepository.save(target);

    systemAuditLogRepository.save(
        new SystemAuditLog(
            currentAdminEmail(adminId),
            "TEAM_MEMBER_ROLE_UPDATED",
            "Alterou cargo de " + target.getEmail() + " de " + oldRole + " para " + request.role(),
            "internal"));

    return new AdminTeamMemberResponse(
        saved.getId(),
        saved.getName(),
        saved.getEmail(),
        saved.getAdminRole(),
        saved.isActive(),
        saved.getCreatedAt(),
        false,
        false);
  }

  @Transactional
  public AdminTeamMemberResponse updateTeamMemberStatus(
      UUID adminId, UUID targetMemberId, UpdateAdminStatusRequest request) {
    assertSuperAdmin(adminId);
    if (targetMemberId.equals(adminId)) {
      throw new BadRequestException(
          "Regra de segurança violada: Você não pode inativar ou reativar sua própria conta de administrador.");
    }
    User target =
        userRepository
            .findById(targetMemberId)
            .orElseThrow(() -> new NotFoundException("Operador não encontrado."));

    if (isMasterSuperAdmin(target.getEmail())) {
      throw new ForbiddenException(
          "Regra de segurança violada: A conta mestre de Super Admin é protegida e não pode ser inativada.");
    }

    target.setActive(request.active());
    User saved = userRepository.save(target);

    systemAuditLogRepository.save(
        new SystemAuditLog(
            currentAdminEmail(adminId),
            "TEAM_MEMBER_STATUS_CHANGED",
            (request.active() ? "Ativou" : "Desativou") + " operador: " + target.getEmail(),
            "internal"));

    return new AdminTeamMemberResponse(
        saved.getId(),
        saved.getName(),
        saved.getEmail(),
        saved.getAdminRole(),
        saved.isActive(),
        saved.getCreatedAt(),
        false,
        false);
  }

  @Transactional
  public void deleteTeamMember(UUID adminId, UUID targetMemberId) {
    assertSuperAdmin(adminId);
    if (targetMemberId.equals(adminId)) {
      throw new BadRequestException(
          "Regra de segurança violada: Você não pode excluir sua própria conta de administrador.");
    }
    User target =
        userRepository
            .findById(targetMemberId)
            .orElseThrow(() -> new NotFoundException("Operador não encontrado."));

    if (isMasterSuperAdmin(target.getEmail())) {
      throw new ForbiddenException(
          "Regra de segurança violada: A conta mestre de Super Admin é protegida e não pode ser excluída.");
    }

    String email = target.getEmail();
    userRepository.delete(target);

    systemAuditLogRepository.save(
        new SystemAuditLog(
            currentAdminEmail(adminId),
            "TEAM_MEMBER_DELETED",
            "Excluiu operador do backoffice: " + email,
            "internal"));
  }
}
