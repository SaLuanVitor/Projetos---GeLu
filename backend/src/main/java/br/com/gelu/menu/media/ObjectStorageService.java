package br.com.gelu.menu.media;

import br.com.gelu.menu.admin.dto.OrphanItemResponse;
import br.com.gelu.menu.admin.dto.StorageStatsResponse;
import br.com.gelu.menu.common.exception.BadRequestException;
import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.ListObjectsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.Result;
import io.minio.messages.Item;
import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class ObjectStorageService {

  private final MinioClient minioClient;
  private final StorageProperties properties;

  public ObjectStorageService(MinioClient minioClient, StorageProperties properties) {
    this.minioClient = minioClient;
    this.properties = properties;
  }

  @PostConstruct
  void ensureBucket() {
    try {
      boolean exists =
          minioClient.bucketExists(BucketExistsArgs.builder().bucket(properties.bucket()).build());
      if (!exists) {
        minioClient.makeBucket(MakeBucketArgs.builder().bucket(properties.bucket()).build());
      }
    } catch (Exception exception) {
      throw new IllegalStateException("Could not initialize media storage", exception);
    }
  }

  public void put(String objectKey, InputStream content, long sizeBytes, String contentType) {
    try {
      minioClient.putObject(
          PutObjectArgs.builder().bucket(properties.bucket()).object(objectKey).stream(
                  content, sizeBytes, -1L)
              .contentType(contentType)
              .build());
    } catch (Exception exception) {
      throw new BadRequestException("Could not upload image");
    }
  }

  public StoredFile get(String objectKey, String contentType, long sizeBytes) {
    try {
      return new StoredFile(
          minioClient.getObject(
              GetObjectArgs.builder().bucket(properties.bucket()).object(objectKey).build()),
          contentType,
          sizeBytes);
    } catch (Exception exception) {
      throw new BadRequestException("Could not load image");
    }
  }

  public void remove(String objectKey) {
    try {
      minioClient.removeObject(
          RemoveObjectArgs.builder().bucket(properties.bucket()).object(objectKey).build());
    } catch (Exception exception) {
      throw new BadRequestException("Could not remove image");
    }
  }

  public StorageStatsResponse getStorageStats(List<String> knownUrls) {
    Set<String> knownKeys = new HashSet<>();
    if (knownUrls != null) {
      for (String url : knownUrls) {
        if (url != null && !url.isBlank()) {
          // URLs podem ser "/api/v1/meals/photo/xyz.jpg" ou "/api/v1/recipes/media/xyz.jpg" ou chave direta
          String cleanKey = url.replace("/api/v1/meals/photo/", "meal-photos/")
              .replace("/api/v1/recipes/media/", "recipe-media/")
              .replace("/api/v1/media/", "");
          if (cleanKey.startsWith("/")) cleanKey = cleanKey.substring(1);
          knownKeys.add(cleanKey);
          knownKeys.add(url);
        }
      }
    }

    long totalBytes = 0;
    int totalCount = 0;
    int mealCount = 0;
    long mealBytes = 0;
    int recipeCount = 0;
    long recipeBytes = 0;
    int otherCount = 0;
    long otherBytes = 0;
    List<OrphanItemResponse> orphans = new ArrayList<>();
    long orphanBytes = 0;

    DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    try {
      Iterable<Result<Item>> results = minioClient.listObjects(
          ListObjectsArgs.builder().bucket(properties.bucket()).recursive(true).build());

      for (Result<Item> result : results) {
        Item item = result.get();
        String name = item.objectName();
        long size = item.size();
        totalBytes += size;
        totalCount++;

        if (name.startsWith("meal-photos/")) {
          mealCount++;
          mealBytes += size;
        } else if (name.startsWith("recipe-media/")) {
          recipeCount++;
          recipeBytes += size;
        } else {
          otherCount++;
          otherBytes += size;
        }

        // Checar se é órfão
        boolean isKnown = false;
        for (String k : knownKeys) {
          if (k.endsWith(name) || name.endsWith(k)) {
            isKnown = true;
            break;
          }
        }

        if (!isKnown) {
          orphanBytes += size;
          String dateStr = item.lastModified() != null ? item.lastModified().format(dtf) : "-";
          orphans.add(new OrphanItemResponse(name, size, formatBytes(size), dateStr));
        }
      }
    } catch (Exception e) {
      // Retornar fallback seguro caso bucket esteja vazio ou inacessível
    }

    return new StorageStatsResponse(
        totalBytes,
        formatBytes(totalBytes),
        totalCount,
        mealCount,
        mealBytes,
        recipeCount,
        recipeBytes,
        otherCount,
        otherBytes,
        orphans.size(),
        orphanBytes,
        formatBytes(orphanBytes),
        orphans
    );
  }

  public int deleteObjects(List<String> objectKeys) {
    if (objectKeys == null || objectKeys.isEmpty()) return 0;
    int deleted = 0;
    for (String key : objectKeys) {
      if (key != null && !key.isBlank()) {
        try {
          minioClient.removeObject(
              RemoveObjectArgs.builder().bucket(properties.bucket()).object(key).build());
          deleted++;
        } catch (Exception ignored) {}
      }
    }
    return deleted;
  }

  private String formatBytes(long bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
    if (bytes < 1024L * 1024 * 1024) return String.format("%.2f MB", bytes / (1024.0 * 1024));
    return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
  }
}
