package br.com.gelu.menu.ai.learning;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "ai_feedbacks")
public class AiFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "feature_type", nullable = false, length = 50)
    private String featureType;

    @Column(name = "item_title", length = 255)
    private String itemTitle;

    @Column(name = "is_positive", nullable = false)
    private boolean positive;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String metadata = "{}";

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public AiFeedback() {}

    public AiFeedback(
            UUID id,
            UUID userId,
            String featureType,
            String itemTitle,
            boolean positive,
            String comment,
            String metadata,
            LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.featureType = featureType;
        this.itemTitle = itemTitle;
        this.positive = positive;
        this.comment = comment;
        this.metadata = metadata != null ? metadata : "{}";
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private UUID userId;
        private String featureType;
        private String itemTitle;
        private boolean positive;
        private String comment;
        private String metadata = "{}";
        private LocalDateTime createdAt = LocalDateTime.now();

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder userId(UUID userId) { this.userId = userId; return this; }
        public Builder featureType(String featureType) { this.featureType = featureType; return this; }
        public Builder itemTitle(String itemTitle) { this.itemTitle = itemTitle; return this; }
        public Builder positive(boolean positive) { this.positive = positive; return this; }
        public Builder comment(String comment) { this.comment = comment; return this; }
        public Builder metadata(String metadata) { this.metadata = metadata; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public AiFeedback build() {
            return new AiFeedback(id, userId, featureType, itemTitle, positive, comment, metadata, createdAt);
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getFeatureType() { return featureType; }
    public void setFeatureType(String featureType) { this.featureType = featureType; }

    public String getItemTitle() { return itemTitle; }
    public void setItemTitle(String itemTitle) { this.itemTitle = itemTitle; }

    public boolean isPositive() { return positive; }
    public void setPositive(boolean positive) { this.positive = positive; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
