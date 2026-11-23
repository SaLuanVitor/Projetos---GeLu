export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details: string[];
  };
};

export type AiAgentDescriptor = {
  key: string;
  name: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  codexFile: string;
};

export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "SUPPORT" | "READ_ONLY";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  isSuperAdmin?: boolean;
  adminRole?: AdminRole;
  createdAt?: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type RegisterResponse = AuthUser;

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthTokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type RefreshTokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ForgotPasswordResponse = {
  accepted: boolean;
  resetToken?: string;
};

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};

export type ResetPasswordResponse = {
  reset: boolean;
};

export type ProfileResponse = {
  id: string;
  name: string;
  email: string;
  birthDate: string | null;
  heightCm: number | null;
  currentWeight: number | null;
  biologicalSex: string | null;
  goal: string | null;
  basalCalories: number | null;
  dailyCalorieGoal: number | null;
  active: boolean;
  createdAt: string;
};

export type UpdateProfileRequest = {
  name: string;
  birthDate: string | null;
  heightCm: number | null;
  biologicalSex: string | null;
  goal: string | null;
  basalCalories: number | null;
  dailyCalorieGoal: number | null;
};

export type WeightHistoryItem = {
  id: string;
  weightKg: number;
  recordedAt: string;
  createdAt: string;
};

export type CreateWeightRecordRequest = {
  weightKg: number;
  recordedAt: string | null;
};

export type RecipeIngredientRequest = {
  name: string;
  quantity: string | null;
  unit: string | null;
};

export type RecipeStepRequest = {
  instruction: string;
};

export type RecipeRequest = {
  name: string;
  description: string | null;
  category: string | null;
  prepTimeMinutes: number | null;
  estimatedCalories: number | null;
  servings: number | null;
  videoUrl: string | null;
  ingredients: RecipeIngredientRequest[];
  steps: RecipeStepRequest[];
};

export type RecipeMainMediaType = "IMAGE" | "VIDEO";

export type RecipeIngredient = {
  id: string;
  position: number;
  name: string;
  quantity: string | null;
  unit: string | null;
};

export type RecipeStep = {
  id: string;
  position: number;
  instruction: string;
};

export type RecipeMedia = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  main: boolean;
  url: string;
  createdAt: string;
};

export type RecipeResponse = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  prepTimeMinutes: number | null;
  estimatedCalories: number | null;
  servings: number | null;
  videoUrl: string | null;
  favorite: boolean;
  mainMediaType: RecipeMainMediaType;
  mainImageUrl: string | null;
  media: RecipeMedia[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  createdAt: string;
  updatedAt: string;
};

export type RecipeSearchFilters = {
  query?: string;
  ingredient?: string;
  category?: string;
  maxPrepTimeMinutes?: string;
  maxCalories?: string;
};


export type FamilyMemberResponse = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  joinedAt: string;
};

export type FamilyResponse = {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  members: FamilyMemberResponse[];
  createdAt: string;
  updatedAt: string;
};

export type CreateFamilyRequest = {
  name: string;
};

export type UpdateFamilyRequest = {
  name: string;
};

export type AddFamilyMemberRequest = {
  userId: string;
  role?: string;
};

export type CoupleNoteResponse = {
  id: string;
  familyId: string;
  authorId: string;
  authorName: string;
  content: string;
  category: string;
  color: string;
  pinned: boolean;
  acknowledgedAt?: string | null;
  acknowledgedByName?: string | null;
  resolved: boolean;
  createdAt: string;
};

export type CreateCoupleNoteRequest = {
  familyId?: string;
  content: string;
  category?: string;
  color?: string;
  pinned?: boolean;
};

export type ScheduleAssigneeResponse = {
  id: string;
  name: string;
  email: string;
};

export type ScheduleActivityResponse = {
  id: string;
  familyId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  title: string;
  category: string;
  notes?: string | null;
  goalTag?: string | null;
  recipeId?: string | null;
  recipeName?: string | null;
  assignedToUserId?: string | null;
  assignedToUserName?: string | null;
  assignees?: ScheduleAssigneeResponse[];
  orderIndex: number;
  completedToday: boolean;
};

export type ScheduleActivityRequest = {
  familyId?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  title: string;
  category?: string;
  notes?: string;
  goalTag?: string;
  recipeId?: string;
  assignedToUserId?: string;
  assigneeUserIds?: string[];
  orderIndex?: number;
};

export type FamilyWeeklyGoalResponse = {
  id: string;
  familyId: string;
  title: string;
  goalTag: string;
  targetCount: number;
  unit: string;
  currentCount: number;
  progressPercent: number;
};

export type FamilyWeeklyGoalRequest = {
  familyId?: string;
  title: string;
  goalTag: string;
  targetCount?: number;
  unit?: string;
};

export type AuditLogResponse = {
  id: string;
  entityType: string;
  entityId: string;
  familyId?: string | null;
  action: string;
  userId: string;
  userName: string;
  details: string;
  createdAt: string;
};

export type DietMealRecipeItemResponse = {
  id: string;
  recipeId: string;
  recipeName: string;
  servings: number;
  caloriesPerServing: number;
  totalCalories: number;
  prepTimeMinutes?: number | null;
  category?: string | null;
};

export type DietMealPersonResponse = {
  userId: string;
  userName: string;
  userEmail: string;
};

export type DietMealResponse = {
  id: string;
  dietId: string;
  weekDay: string;
  mealName: string;
  mealTime?: string | null;
  notes?: string | null;
  orderIndex: number;
  recipes: DietMealRecipeItemResponse[];
  people: DietMealPersonResponse[];
  totalEstimatedCalories: number;
};

export type WeeklyDietResponse = {
  id: string;
  familyId?: string | null;
  userId: string;
  title: string;
  weekStart: string;
  weekEnd: string;
  meals: DietMealResponse[];
};

export type CreateDietMealRequest = {
  weekDay: string;
  mealName: string;
  mealTime?: string;
  notes?: string;
  recipeId?: string;
  servings?: number;
  personUserIds?: string[];
  orderIndex?: number;
};

export type UpdateDietMealRequest = {
  weekDay: string;
  mealName: string;
  mealTime?: string;
  notes?: string;
  recipeId?: string;
  servings?: number;
  personUserIds?: string[];
  orderIndex?: number;
};

export type CopyWeeklyDietRequest = {
  targetWeekStart: string;
};

export type CreateFamilyInviteRequest = {
  invitedEmail: string;
  role?: string;
};

export type FamilyInviteResponse = {
  id: string;
  familyId: string;
  familyName: string;
  invitedEmail: string;
  invitedByUserId: string;
  invitedByUserName: string;
  role: string;
  token: string;
  status: string;
  expired: boolean;
  expiresAt: string;
  createdAt: string;
};

export type WorkoutResponse = {
  id: string;
  familyId?: string | null;
  userId: string;
  title: string;
  category: string;
  caloriesPerHour: number;
  defaultDurationMinutes: number;
  notes?: string | null;
  createdAt: string;
};

export type WorkoutRequest = {
  familyId?: string;
  title: string;
  category?: string;
  caloriesPerHour?: number;
  defaultDurationMinutes?: number;
  notes?: string;
};

export type CreateWorkoutLogRequest = {
  familyId?: string;
  workoutId?: string;
  title: string;
  category?: string;
  durationMinutes?: number;
  caloriesBurned?: number;
  performedAt?: string;
  notes?: string;
};

export type WorkoutLogResponse = {
  id: string;
  familyId?: string | null;
  userId: string;
  userName: string;
  workoutId?: string | null;
  title: string;
  category: string;
  durationMinutes: number;
  caloriesBurned: number;
  performedAt: string;
  notes?: string | null;
  completed: boolean;
  createdAt: string;
};

export type DailyWorkoutSummaryResponse = {
  date: string;
  totalCaloriesBurned: number;
  totalDurationMinutes: number;
  workoutCount: number;
  completedToday: boolean;
  logs: WorkoutLogResponse[];
};

// Assistente IA (Sprint 11)
export type GenerateSuggestionRequest = {
  mealType?: string;
  goal?: string;
  targetCalories?: number;
  preferences?: string;
  restrictions?: string;
};

export type MealSuggestionResponse = {
  title: string;
  category: string;
  estimatedCalories: number;
  prepTimeMinutes: number;
  explanation: string;
  ingredients: string[];
  proteinGrams: string;
  carbsGrams: string;
  fatGrams: string;
  chefTip: string;
};

// Painel Administrativo & Suporte (Sprint 13)
export type AdminMetricsResponse = {
  totalUsers: number;
  totalFamilies: number;
  totalRecipes: number;
  totalWeeklyDiets: number;
  totalWorkoutsLogged: number;
  totalAuditLogs: number;
  openSupportTickets: number;
};

export type CreateSupportTicketRequest = {
  subject: string;
  category?: string;
  description: string;
};

export type SupportTicketResponse = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  description: string;
  status: string;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateSupportTicketStatusRequest = {
  status: string;
  adminNotes?: string;
};

// --- SUPORTE E ADMIN AVANÇADO ---
export type PublicSupportSettingsResponse = {
  supportEmail: string;
  supportPhone: string;
  supportWhatsapp: string;
  supportHours: string;
  systemBroadcastBanner: string;
};

export type AdminUserResponse = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  familiesCount: number;
};

export type AdminFamilyMemberResponse = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
};

export type AdminFamilyResponse = {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  membersCount: number;
  createdAt: string;
  members: AdminFamilyMemberResponse[];
};

export type SystemSettingResponse = {
  key: string;
  value: string;
  updatedAt: string;
  updatedBy: string;
};

export type UpdateSystemSettingsRequest = {
  settings: Record<string, string>;
};

export type AiUsageLogResponse = {
  id: string;
  userId?: string | null;
  familyId?: string | null;
  operationType: string;
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  status: string;
  createdAt: string;
};

export type AiUsageSummaryResponse = {
  totalRequests: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCostBrl: string;
  configuredModel: string;
  hasApiKey: boolean;
  recentLogs: AiUsageLogResponse[];
};

export type TestGeminiRequest = {
  apiKey?: string;
  model?: string;
};

export type TestGeminiResponse = {
  success: boolean;
  message: string;
  latencyMs: number;
};

export type SystemAuditLogResponse = {
  id: string;
  actorEmail: string;
  action: string;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
};

export type UserAiUsageResponse = {
  userId: string;
  userName: string;
  userEmail: string;
  familyId?: string | null;
  familyName?: string | null;
  requestCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostBrl: string;
  lastUsedAt?: string | null;
};

export type UserDataExportResponse = {
  userId: string;
  name: string;
  email: string;
  createdAt: string;
  active: boolean;
  families: string[];
  totalRecipesCreated: number;
  totalDietsCreated: number;
  totalWorkoutsLogged: number;
  totalAiRequests: number;
  exportedAt: string;
  lgpdDisclaimer: string;
};

export type AdminTeamMemberResponse = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  createdAt: string;
  isMasterSuperAdmin: boolean;
  isSelf: boolean;
};

export type CreateAdminTeamRequest = {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
};

export type UpdateAdminRoleRequest = {
  role: AdminRole;
};

export type UpdateAdminStatusRequest = {
  active: boolean;
};

export type PiiRevealRequest = {
  targetUserId: string;
  reason: string;
};

