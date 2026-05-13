package br.com.gelu.menu.media;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "gelu.storage")
public record StorageProperties(
    String endpoint,
    String accessKey,
    String secretKey,
    String bucket,
    String proxyBasePath,
    long maxImageSizeBytes) {}
