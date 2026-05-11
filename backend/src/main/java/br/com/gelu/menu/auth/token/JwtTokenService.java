package br.com.gelu.menu.auth.token;

import br.com.gelu.menu.users.User;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtTokenService {

  private static final String HMAC_ALGORITHM = "HmacSHA256";
  private static final String TOKEN_TYPE = "Bearer";
  private static final int REFRESH_TOKEN_BYTES = 32;

  private final ObjectMapper objectMapper;
  private final RefreshTokenRepository refreshTokenRepository;
  private final SecureRandom secureRandom;
  private final byte[] signingSecret;
  private final Duration accessTokenTtl;
  private final Duration refreshTokenTtl;

  public JwtTokenService(
      ObjectMapper objectMapper,
      RefreshTokenRepository refreshTokenRepository,
      @Value("${gelu.auth.jwt.secret}") String signingSecret,
      @Value("${gelu.auth.jwt.access-token-ttl}") Duration accessTokenTtl,
      @Value("${gelu.auth.jwt.refresh-token-ttl}") Duration refreshTokenTtl) {
    this.objectMapper = objectMapper;
    this.refreshTokenRepository = refreshTokenRepository;
    this.secureRandom = new SecureRandom();
    this.signingSecret = signingSecret.getBytes(StandardCharsets.UTF_8);
    this.accessTokenTtl = accessTokenTtl;
    this.refreshTokenTtl = refreshTokenTtl;
  }

  public TokenPair issueTokenPair(User user) {
    String accessToken = createAccessToken(user);
    String refreshToken = createRefreshToken();
    refreshTokenRepository.save(
        new RefreshToken(
            user.getId(),
            hashRefreshToken(refreshToken),
            LocalDateTime.now().plus(refreshTokenTtl)));

    return new TokenPair(accessToken, refreshToken, accessTokenTtl.toSeconds());
  }

  public String getTokenType() {
    return TOKEN_TYPE;
  }

  public UUID validateAccessToken(String token) {
    String[] parts = token.split("\\.");
    if (parts.length != 3) {
      throw new IllegalArgumentException("Invalid access token");
    }

    String signingInput = parts[0] + "." + parts[1];
    if (!MessageDigest.isEqual(
        sign(signingInput).getBytes(StandardCharsets.UTF_8),
        parts[2].getBytes(StandardCharsets.UTF_8))) {
      throw new IllegalArgumentException("Invalid access token");
    }

    Map<String, Object> payload = decodePayload(parts[1]);
    Object expiresAt = payload.get("exp");
    if (!(expiresAt instanceof Number number)
        || Instant.now().getEpochSecond() >= number.longValue()) {
      throw new IllegalArgumentException("Expired access token");
    }

    Object subject = payload.get("sub");
    if (!(subject instanceof String value)) {
      throw new IllegalArgumentException("Invalid access token");
    }

    return UUID.fromString(value);
  }

  public String hashRefreshToken(String refreshToken) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      return HexFormat.of().formatHex(digest.digest(refreshToken.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException("SHA-256 is not available", exception);
    }
  }

  private String createAccessToken(User user) {
    Instant now = Instant.now();
    Instant expiresAt = now.plus(accessTokenTtl);

    String header = encodeJson(Map.of("alg", "HS256", "typ", "JWT"));
    String payload =
        encodeJson(
            Map.of(
                "sub", user.getId().toString(),
                "email", user.getEmail(),
                "name", user.getName(),
                "iat", now.getEpochSecond(),
                "exp", expiresAt.getEpochSecond()));

    String signingInput = header + "." + payload;
    return signingInput + "." + sign(signingInput);
  }

  private String createRefreshToken() {
    byte[] tokenBytes = new byte[REFRESH_TOKEN_BYTES];
    secureRandom.nextBytes(tokenBytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
  }

  private String encodeJson(Map<String, Object> values) {
    try {
      return Base64.getUrlEncoder()
          .withoutPadding()
          .encodeToString(objectMapper.writeValueAsBytes(values));
    } catch (JsonProcessingException exception) {
      throw new IllegalStateException("Unable to create JWT payload", exception);
    }
  }

  private Map<String, Object> decodePayload(String payload) {
    try {
      byte[] decodedPayload = Base64.getUrlDecoder().decode(payload);
      return objectMapper.readValue(decodedPayload, new TypeReference<>() {});
    } catch (IllegalArgumentException | IOException exception) {
      throw new IllegalArgumentException("Invalid access token", exception);
    }
  }

  private String sign(String signingInput) {
    try {
      Mac mac = Mac.getInstance(HMAC_ALGORITHM);
      mac.init(new SecretKeySpec(signingSecret, HMAC_ALGORITHM));
      return Base64.getUrlEncoder()
          .withoutPadding()
          .encodeToString(mac.doFinal(signingInput.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException | InvalidKeyException exception) {
      throw new IllegalStateException("Unable to sign JWT", exception);
    }
  }
}
