package br.com.gelu.menu.media;

import br.com.gelu.menu.common.exception.BadRequestException;
import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import jakarta.annotation.PostConstruct;
import java.io.InputStream;
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
}
