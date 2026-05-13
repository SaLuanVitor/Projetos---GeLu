package br.com.gelu.menu.media;

import java.io.InputStream;

public record StoredFile(InputStream content, String contentType, long sizeBytes) {}
