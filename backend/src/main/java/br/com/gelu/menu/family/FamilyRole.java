package br.com.gelu.menu.family;

public enum FamilyRole {
  ADMIN,
  EDITOR,
  VIEWER,
  MEMBER;

  public static FamilyRole fromString(String role) {
    if (role == null || role.isBlank()) {
      return MEMBER;
    }
    String upper = role.trim().toUpperCase();
    try {
      return FamilyRole.valueOf(upper);
    } catch (IllegalArgumentException e) {
      return MEMBER;
    }
  }
}
