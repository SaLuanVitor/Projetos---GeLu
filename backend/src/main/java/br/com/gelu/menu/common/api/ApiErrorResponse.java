package br.com.gelu.menu.common.api;

import java.util.List;

public record ApiErrorResponse(boolean success, ErrorBody error) {

  public static ApiErrorResponse of(String code, String message, List<String> details) {
    return new ApiErrorResponse(false, new ErrorBody(code, message, details));
  }

  public record ErrorBody(String code, String message, List<String> details) {}
}
