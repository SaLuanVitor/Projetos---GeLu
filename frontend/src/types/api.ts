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

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  active: boolean;
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
