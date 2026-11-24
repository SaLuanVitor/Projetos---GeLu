package br.com.gelu.menu.ai.learning;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_dietary_habits")
public class UserDietaryHabit {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "habit_profile", columnDefinition = "jsonb", nullable = false)
    private String habitProfile = "{}";

    @Column(nullable = false)
    private Integer version = 1;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public UserDietaryHabit() {}

    public UserDietaryHabit(UUID userId, String habitProfile, Integer version, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.userId = userId;
        this.habitProfile = habitProfile != null ? habitProfile : "{}";
        this.version = version != null ? version : 1;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.updatedAt = updatedAt != null ? updatedAt : LocalDateTime.now();
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID userId;
        private String habitProfile = "{}";
        private Integer version = 1;
        private LocalDateTime createdAt = LocalDateTime.now();
        private LocalDateTime updatedAt = LocalDateTime.now();

        public Builder userId(UUID userId) { this.userId = userId; return this; }
        public Builder habitProfile(String habitProfile) { this.habitProfile = habitProfile; return this; }
        public Builder version(Integer version) { this.version = version; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public UserDietaryHabit build() {
            return new UserDietaryHabit(userId, habitProfile, version, createdAt, updatedAt);
        }
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getHabitProfile() { return habitProfile; }
    public void setHabitProfile(String habitProfile) { this.habitProfile = habitProfile; }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
