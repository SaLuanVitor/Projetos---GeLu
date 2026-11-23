package br.com.gelu.menu.admin;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "system_settings")
public class SystemSetting {

  @Id
  @Column(length = 100)
  private String key;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String value;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @Column(name = "updated_by")
  private String updatedBy;

  public SystemSetting() {}

  public SystemSetting(String key, String value, String updatedBy) {
    this.key = key;
    this.value = value;
    this.updatedAt = LocalDateTime.now();
    this.updatedBy = updatedBy;
  }

  public String getKey() {
    return key;
  }

  public String getValue() {
    return value;
  }

  public void setValue(String value, String updatedBy) {
    this.value = value;
    this.updatedAt = LocalDateTime.now();
    this.updatedBy = updatedBy;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public String getUpdatedBy() {
    return updatedBy;
  }
}
