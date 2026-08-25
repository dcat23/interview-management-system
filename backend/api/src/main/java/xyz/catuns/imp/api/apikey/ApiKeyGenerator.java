package xyz.catuns.imp.api.apikey;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

/**
 * Generates and hashes raw API keys.
 * <p>
 * Raw key format: {@code aik_} followed by 43 base62 characters, drawn one at a time from
 * {@link SecureRandom} (~256 bits of entropy). Only the SHA-256 hash of the full raw key is ever
 * persisted — the raw key itself is returned to the caller exactly once, at creation time.
 */
public final class ApiKeyGenerator {

    public static final String KEY_PREFIX = "aik_";
    public static final int PREFIX_DISPLAY_LENGTH = 12;

    private static final String ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    private static final int RANDOM_CHARS = 43;
    private static final SecureRandom RANDOM = new SecureRandom();

    private ApiKeyGenerator() {
    }

    public static String generateRawKey() {
        StringBuilder sb = new StringBuilder(KEY_PREFIX.length() + RANDOM_CHARS);
        sb.append(KEY_PREFIX);
        for (int i = 0; i < RANDOM_CHARS; i++) {
            sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }

    public static String prefix(String rawKey) {
        return rawKey.substring(0, PREFIX_DISPLAY_LENGTH);
    }

    public static String hash(String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
