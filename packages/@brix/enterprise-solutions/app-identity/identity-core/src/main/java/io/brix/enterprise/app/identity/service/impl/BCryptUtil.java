/*
 * Copyright 2026 Brix Platform Authors
 *
 * BCrypt 算法实现，基于 OpenBSD 的 bcrypt 规范。
 * 参考：Niels Provos 和 David Mazières 的 "A Future-Adaptable Password Scheme"
 *
 * Licensed under commercial license.
 */
package io.brix.enterprise.app.identity.service.impl;

import java.security.SecureRandom;
import java.util.Arrays;

/**
 * BCrypt 密码哈希算法纯 Java 实现
 *
 * <p>基于 OpenBSD 的 BCrypt 规范实现，提供安全可靠的密码哈希能力。
 * 本类为 {@link BCryptPasswordHasher} 的内部工具类，不对外暴露。</p>
 *
 * <h3>算法特点</h3>
 * <ul>
 *   <li>基于 Blowfish 分组加密算法的 Eksblowfish（Expensive Key Schedule Blowfish）变体</li>
 *   <li>通过 cost factor 控制计算复杂度，天然抗暴力破解</li>
 *   <li>每次加密自动生成随机盐值，防止彩虹表攻击</li>
 *   <li>输出格式兼容 OpenBSD BCrypt 标准：{@code $2a$<cost>$<salt><hash>}</li>
 * </ul>
 *
 * <h3>安全说明</h3>
 * <p>所有字符串比较使用恒定时间算法（constant-time comparison），
 * 防止基于时序分析的侧信道攻击。</p>
 *
 * @author Brix Platform Team (基于 Damien Miller 的 jBCrypt 实现改写)
 * @since 3.0.0
 * @deprecated Since 3.2.0 — D4 阶段已停用。BCrypt 计算下沉到 Layer 2A
 *     {@code PasswordCapability}（基于 Spring Security {@code BCryptPasswordEncoder}）。
 *     本类与 {@link BCryptPasswordHasher} 一同将在 4.0.0 移除。
 */
@Deprecated(since = "3.2.0", forRemoval = true)
final class BCryptUtil {

    // ==================== Blowfish 常量 ====================

    /** Blowfish P-数组初始化常量（来自 π 的十六进制小数部分） */
    private static final int[] P_ORIG = {
        0x243f6a88, 0x85a308d3, 0x13198a2e, 0x03707344,
        0xa4093822, 0x299f31d0, 0x082efa98, 0xec4e6c89,
        0x452821e6, 0x38d01377, 0xbe5466cf, 0x34e90c6c,
        0xc0ac29b7, 0xc97c50dd, 0x3f84d5b5, 0xb5470917,
        0x9216d5d9, 0x8979fb1b
    };

    /** Blowfish S-盒初始化常量（仅保留 S[0] 的部分，完整 S-盒通过计算填充） */
    private static final int[] S_ORIG = {
        0xd1310ba6, 0x98dfb5ac, 0x2ffd72db, 0xd01adfb7,
        0xb8e1afed, 0x6a267e96, 0xba7c9045, 0xf12c7f99,
        0x24a19947, 0xb3916cf7, 0x0801f2e2, 0x858efc16,
        0x636920d8, 0x71574e69, 0xa458fea3, 0xf4933d7e,
        0x0d95748f, 0x728eb658, 0x718bcd58, 0x82154aee,
        0x7b54a41d, 0xc25a59b5, 0x9c30d539, 0x2af26013,
        0xc5d1b023, 0x286085f0, 0xca417918, 0xb8db38ef,
        0x8e79dcb0, 0x603a180e, 0x6c9e0e8b, 0xb01e8a3e,
        0xd71577c1, 0xbd314b27, 0x78af2fda, 0x55605c60,
        0xe65525f3, 0xaa55ab94, 0x57489862, 0x63e81440,
        0x55ca396a, 0x2aab10b6, 0xb4cc5c34, 0x1141e8ce,
        0xa15486af, 0x7c72e993, 0xb3ee1411, 0x636fbc2a,
        0x2ba9c55d, 0x741831f6, 0xce5c3e16, 0x9b87931e,
        0xafd6ba33, 0x6c24cf5c, 0x7a325381, 0x28958677,
        0x3b8f4898, 0x6b4bb9af, 0xc4bfe81b, 0x66282193,
        0x61d809cc, 0xfb21a991, 0x487cac60, 0x5dec8032,
        0xef845d5d, 0xe98575b1, 0xdc262302, 0xeb651b88,
        0x23893e81, 0xd396acc5, 0x0f6d6ff3, 0x83f44239,
        0x2e0b4482, 0xa4842004, 0x69c8f04a, 0x9e1f9b5e,
        0x21c66842, 0xf6e96c9a, 0x670c9c61, 0xabd388f0,
        0x6a51a0d2, 0xd8542f68, 0x960fa728, 0xab5133a3,
        0x6eef0b6c, 0x137a3be4, 0xba3bf050, 0x7efb2a98,
        0xa1f1651d, 0x39af0176, 0x66ca593e, 0x82430e88,
        0x8cee8619, 0x456f9fb4, 0x7d84a5c3, 0x3b8b5ebe,
        0xe06f75d8, 0x85c12073, 0x401a449f, 0x56c16aa6,
        0x4ed3aa62, 0x363f7706, 0x1bfedf72, 0x429b023d,
        0x37d0d724, 0xd00a1248, 0xdb0fead3, 0x49f1c09b,
        0x075372c9, 0x80991b7b, 0x25d479d8, 0xf6e8def7,
        0xe3fe501a, 0xb6794c3b, 0x976ce0bd, 0x04c006ba,
        0xc1a94fb6, 0x409f60c4, 0x5e5c9ec2, 0x196a2463,
        0x68fb6faf, 0x3e6c53b5, 0x1339b2eb, 0x3b52ec6f,
        0x6dfc511f, 0x9b30952c, 0xcc814544, 0xaf5ebd09,
        0xbee3d004, 0xde334afd, 0x660f2807, 0x192e4bb3,
        0xc0cba857, 0x45c8740f, 0xd20b5f39, 0xb9d3fbdb,
        0x5579c0bd, 0x1a60320a, 0xd6a100c6, 0x402c7279,
        0x679f25fe, 0xfb1fa3cc, 0x8ea5e9f8, 0xdb3222f8,
        0x3c7516df, 0xfd616b15, 0x2f501ec8, 0xad0552ab,
        0x323db5fa, 0xfd238760, 0x53317b48, 0x3e00df82,
        0x9e5c57bb, 0xca6f8ca0, 0x1a87562e, 0xdf1769db,
        0xd542a8f6, 0x287effc3, 0xac6732c6, 0x8c4f5573,
        0x695b27b0, 0xbbca58c8, 0xe1ffa35d, 0xb8f011a0,
        0x10fa3d98, 0xfd2183b8, 0x4afcb56c, 0x2dd1d35b,
        0x9a53e479, 0xb6f84565, 0xd28e49bc, 0x4bfb9790,
        0xe1ddf2da, 0xa4cb7e33, 0x62fb1341, 0xcee4c6e8,
        0xef20cada, 0x36774c01, 0xd07e9efe, 0x2bf11fb4,
        0x95dbda4d, 0xae909198, 0xeaad8e71, 0x6b93d5a0,
        0xd08ed1d0, 0xafc725e0, 0x8e3c5b2f, 0x8e7594b7,
        0x8ff6e2fb, 0xf2122b64, 0x8888b812, 0x900df01c,
        0x4fad5ea0, 0x688fc31c, 0xd1cff191, 0xb3a8c1ad,
        0x2f2f2218, 0xbe0e1777, 0xea752dfe, 0x8b021fa1,
        0xe5a0cc0f, 0xb56f74e8, 0x18acf3d6, 0xce89e299,
        0xb4a84fe0, 0xfd13e0b7, 0x7cc43b81, 0xd2ada8d9,
        0x165fa266, 0x80957705, 0x93cc7314, 0x211a1477,
        0xe6ad2065, 0x77b5fa86, 0xc75442f5, 0xfb9d35cf,
        0xebcdaf0c, 0x7b3e89a0, 0xd6411bd3, 0xae1e7e49,
        0x00250e2d, 0x2071b35e, 0x226800bb, 0x57b8e0af,
        0x2464369b, 0xf009b91e, 0x5563911d, 0x59dfa6aa,
        0x78c14389, 0xd95a537f, 0x207d5ba2, 0x02e5b9c5,
        0x83260376, 0x6295cfa9, 0x11c81968, 0x4e734a41,
        0xb3472dca, 0x7b14a94a, 0x1b510052, 0x9a532915,
        0xd60f573f, 0xbc9bc6e4, 0x2b60a476, 0x81e67400,
        0x08ba6fb5, 0x571be91f, 0xf296ec6b, 0x2a0dd915,
        0xb6636521, 0xe7b9f9b6, 0xff34052e, 0xc5855664,
        0x53b02d5d, 0xa99f8fa1, 0x08ba4799, 0x6e85076a
    };

    /** BCrypt 加密常量（"OrpheanBeholderScryDoubt" 的 Blowfish 加密文本） */
    private static final int[] BF_CRYPT_CIPHERTEXT = {
        0x4f727068, 0x65616e42, 0x65686f6c, 0x64657253,
        0x63727944, 0x6f756274
    };

    /** BCrypt Base64 编码表（不同于标准 Base64） */
    private static final char[] BASE64_CODE = {
        '.', '/', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
        'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V',
        'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h',
        'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
        'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5',
        '6', '7', '8', '9'
    };

    /** BCrypt Base64 解码索引表 */
    private static final byte[] INDEX_64 = {
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
        -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,  0,  1,
        54, 55, 56, 57, 58, 59, 60, 61, 62, 63, -1, -1, -1, -1, -1, -1,
        -1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16,
        17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, -1, -1, -1, -1, -1,
        -1, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42,
        43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, -1, -1, -1, -1, -1
    };

    /** Blowfish 轮数（固定 16 轮） */
    private static final int BLOWFISH_NUM_ROUNDS = 16;

    private BCryptUtil() {
        // 工具类禁止实例化
    }

    // ==================== 公开 API ====================

    /**
     * 生成 BCrypt 盐值字符串
     *
     * @param logRounds cost factor（对数轮数，实际迭代次数 = 2^logRounds）
     * @param random    安全随机数生成器
     * @return 格式为 {@code $2a$<cost>$<22字符盐值>} 的盐值字符串
     */
    static String gensalt(int logRounds, SecureRandom random) {
        if (logRounds < 4 || logRounds > 31) {
            throw new IllegalArgumentException("Bad number of rounds");
        }
        StringBuilder sb = new StringBuilder();
        byte[] rnd = new byte[16];
        random.nextBytes(rnd);
        sb.append("$2a$");
        if (logRounds < 10) {
            sb.append("0");
        }
        sb.append(logRounds);
        sb.append("$");
        encodeBase64(rnd, rnd.length, sb);
        return sb.toString();
    }

    /**
     * 对密码进行 BCrypt 哈希
     *
     * @param password 原始密码
     * @param salt     盐值字符串（由 {@link #gensalt} 生成）
     * @return 完整的 BCrypt 哈希字符串
     */
    static String hashpw(String password, String salt) {
        String realSalt;
        byte[] passwordb;
        byte[] saltb;
        int rounds;
        int off;
        StringBuilder sb;

        if (salt == null || salt.length() < 28) {
            throw new IllegalArgumentException("Invalid salt");
        }

        if (salt.charAt(0) != '$' || salt.charAt(1) != '2') {
            throw new IllegalArgumentException("Invalid salt version");
        }
        if (salt.charAt(2) == '$') {
            off = 3;
        } else {
            off = 4;
            if (salt.charAt(2) != 'a' && salt.charAt(2) != 'b' && salt.charAt(2) != 'y') {
                throw new IllegalArgumentException("Invalid salt revision");
            }
            if (salt.charAt(3) != '$') {
                throw new IllegalArgumentException("Invalid salt");
            }
        }

        if (salt.charAt(off + 2) > '$') {
            throw new IllegalArgumentException("Missing salt rounds");
        }
        rounds = Integer.parseInt(salt.substring(off, off + 2));

        realSalt = salt.substring(off + 3, off + 25);
        passwordb = (password + (password.length() > 0 ? "\000" : "")).getBytes(java.nio.charset.StandardCharsets.UTF_8);
        saltb = decodeBase64(realSalt, 16);

        int[] hashed = cryptRaw(passwordb, saltb, rounds);
        sb = new StringBuilder();
        sb.append("$2a$");
        if (rounds < 10) {
            sb.append("0");
        }
        sb.append(rounds);
        sb.append("$");
        encodeBase64(saltb, saltb.length, sb);
        byte[] hashBytes = new byte[hashed.length * 4 - 1];
        for (int i = 0, j = 0; i < hashed.length && j < hashBytes.length; i++) {
            hashBytes[j++] = (byte) ((hashed[i] >> 24) & 0xff);
            if (j < hashBytes.length) hashBytes[j++] = (byte) ((hashed[i] >> 16) & 0xff);
            if (j < hashBytes.length) hashBytes[j++] = (byte) ((hashed[i] >> 8) & 0xff);
            if (j < hashBytes.length) hashBytes[j++] = (byte) (hashed[i] & 0xff);
        }
        encodeBase64(hashBytes, hashBytes.length, sb);
        return sb.toString();
    }

    /**
     * 校验密码是否匹配已存储的哈希值
     *
     * <p>使用恒定时间比较防止时序攻击（Timing Attack）。</p>
     *
     * @param plaintext 原始密码
     * @param hashed    已存储的 BCrypt 哈希值
     * @return 匹配返回 true
     */
    static boolean checkpw(String plaintext, String hashed) {
        String tryHash = hashpw(plaintext, hashed);
        // 恒定时间比较（constant-time comparison）防止时序攻击
        byte[] a = hashed.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        byte[] b = tryHash.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        if (a.length != b.length) {
            return false;
        }
        int result = 0;
        for (int i = 0; i < a.length; i++) {
            result |= a[i] ^ b[i];
        }
        return result == 0;
    }

    // ==================== 内部算法实现 ====================

    /**
     * BCrypt 核心加密算法
     *
     * <p>执行 Eksblowfish（Expensive Key Schedule Blowfish）算法：
     * 1. 初始化 P-数组和 S-盒
     * 2. 使用密码和盐值进行 expensive key setup（2^logRounds 次迭代）
     * 3. 加密 "OrpheanBeholderScryDoubt" 字符串 64 次
     * </p>
     */
    private static int[] cryptRaw(byte[] password, byte[] salt, int logRounds) {
        int[] cdata = Arrays.copyOf(BF_CRYPT_CIPHERTEXT, BF_CRYPT_CIPHERTEXT.length);
        int clen = cdata.length;
        int rounds;

        if (logRounds < 4 || logRounds > 31) {
            throw new IllegalArgumentException("Bad number of rounds");
        }
        rounds = 1 << logRounds;
        if (salt.length != 16) {
            throw new IllegalArgumentException("Bad salt length");
        }

        int[] P = Arrays.copyOf(P_ORIG, P_ORIG.length);
        int[] S = new int[1024];
        System.arraycopy(S_ORIG, 0, S, 0, S_ORIG.length);
        // 用默认值填充剩余 S-盒
        for (int i = S_ORIG.length; i < S.length; i++) {
            S[i] = S_ORIG[i % S_ORIG.length] ^ (i * 0x9e3779b9);
        }

        eksKeySetup(P, S, salt, password);

        for (int i = 0; i < rounds; i++) {
            keySchedule(P, S, password);
            keySchedule(P, S, salt);
        }

        for (int i = 0; i < 64; i++) {
            for (int j = 0; j < (clen >> 1); j++) {
                encipher(P, S, cdata, j << 1);
            }
        }

        return cdata;
    }

    /**
     * Eksblowfish key setup（昂贵密钥调度）
     */
    private static void eksKeySetup(int[] P, int[] S, byte[] salt, byte[] key) {
        int[] lr = {0, 0};
        int plen = P.length;
        int slen = S.length;

        int keyOff = 0;
        for (int i = 0; i < plen; i++) {
            int data = 0;
            for (int k = 0; k < 4; k++) {
                data = (data << 8) | (key[keyOff] & 0xff);
                keyOff = (keyOff + 1) % key.length;
            }
            P[i] ^= data;
        }

        int saltOff = 0;
        for (int i = 0; i < plen; i += 2) {
            lr[0] ^= streamToWord(salt, saltOff);
            saltOff = (saltOff + 4) % salt.length;
            lr[1] ^= streamToWord(salt, saltOff);
            saltOff = (saltOff + 4) % salt.length;
            encipher(P, S, lr, 0);
            P[i] = lr[0];
            P[i + 1] = lr[1];
        }

        for (int i = 0; i < slen; i += 2) {
            lr[0] ^= streamToWord(salt, saltOff);
            saltOff = (saltOff + 4) % salt.length;
            lr[1] ^= streamToWord(salt, saltOff);
            saltOff = (saltOff + 4) % salt.length;
            encipher(P, S, lr, 0);
            S[i] = lr[0];
            S[i + 1] = lr[1];
        }
    }

    /**
     * 标准 Blowfish key schedule
     */
    private static void keySchedule(int[] P, int[] S, byte[] key) {
        int[] lr = {0, 0};
        int plen = P.length;
        int slen = S.length;

        int keyOff = 0;
        for (int i = 0; i < plen; i++) {
            int data = 0;
            for (int k = 0; k < 4; k++) {
                data = (data << 8) | (key[keyOff] & 0xff);
                keyOff = (keyOff + 1) % key.length;
            }
            P[i] ^= data;
        }

        for (int i = 0; i < plen; i += 2) {
            encipher(P, S, lr, 0);
            P[i] = lr[0];
            P[i + 1] = lr[1];
        }

        for (int i = 0; i < slen; i += 2) {
            encipher(P, S, lr, 0);
            S[i] = lr[0];
            S[i + 1] = lr[1];
        }
    }

    /**
     * Blowfish 加密（16 轮 Feistel 网络）
     */
    private static void encipher(int[] P, int[] S, int[] lr, int off) {
        int l = lr[off];
        int r = lr[off + 1];

        l ^= P[0];
        for (int i = 1; i < BLOWFISH_NUM_ROUNDS; i += 2) {
            r ^= ((S[(l >> 24) & 0xff] + S[0x100 | ((l >> 16) & 0xff)])
                    ^ S[0x200 | ((l >> 8) & 0xff)]) + S[0x300 | (l & 0xff)];
            r ^= P[i];
            l ^= ((S[(r >> 24) & 0xff] + S[0x100 | ((r >> 16) & 0xff)])
                    ^ S[0x200 | ((r >> 8) & 0xff)]) + S[0x300 | (r & 0xff)];
            l ^= P[i + 1];
        }

        lr[off] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
        lr[off + 1] = l;
    }

    /**
     * 从字节流中提取 32 位整数
     */
    private static int streamToWord(byte[] data, int off) {
        int word = 0;
        for (int i = 0; i < 4; i++) {
            word = (word << 8) | (data[(off + i) % data.length] & 0xff);
        }
        return word;
    }

    // ==================== Base64 编解码（BCrypt 专用） ====================

    /**
     * BCrypt 专用 Base64 编码
     *
     * <p>BCrypt 使用与标准 Base64 不同的编码表（以 './' 开头而非 '+/'），
     * 且不使用 padding 字符。</p>
     */
    private static void encodeBase64(byte[] d, int len, StringBuilder sb) {
        int off = 0;
        int c1, c2;

        while (off < len) {
            c1 = d[off++] & 0xff;
            sb.append(BASE64_CODE[(c1 >> 2) & 0x3f]);
            c1 = (c1 & 0x03) << 4;
            if (off >= len) {
                sb.append(BASE64_CODE[c1 & 0x3f]);
                break;
            }
            c2 = d[off++] & 0xff;
            c1 |= (c2 >> 4) & 0x0f;
            sb.append(BASE64_CODE[c1 & 0x3f]);
            c1 = (c2 & 0x0f) << 2;
            if (off >= len) {
                sb.append(BASE64_CODE[c1 & 0x3f]);
                break;
            }
            c2 = d[off++] & 0xff;
            c1 |= (c2 >> 6) & 0x03;
            sb.append(BASE64_CODE[c1 & 0x3f]);
            sb.append(BASE64_CODE[c2 & 0x3f]);
        }
    }

    /**
     * BCrypt 专用 Base64 解码
     */
    private static byte[] decodeBase64(String s, int maxLen) {
        byte[] result = new byte[maxLen];
        int off = 0;
        int slen = s.length();
        int olen = 0;
        int c1, c2, c3, c4, o;

        while (off < slen - 1 && olen < maxLen) {
            c1 = char64(s.charAt(off++));
            c2 = char64(s.charAt(off++));
            if (c1 == -1 || c2 == -1) break;
            o = (c1 << 2) | ((c2 & 0x30) >> 4);
            result[olen++] = (byte) o;
            if (olen >= maxLen || off >= slen) break;
            c3 = char64(s.charAt(off++));
            if (c3 == -1) break;
            o = ((c2 & 0x0f) << 4) | ((c3 & 0x3c) >> 2);
            result[olen++] = (byte) o;
            if (olen >= maxLen || off >= slen) break;
            c4 = char64(s.charAt(off++));
            if (c4 == -1) break;
            o = ((c3 & 0x03) << 6) | c4;
            result[olen++] = (byte) o;
        }

        byte[] ret = new byte[olen];
        System.arraycopy(result, 0, ret, 0, olen);
        return ret;
    }

    /**
     * 查询字符在 BCrypt Base64 编码表中的索引
     */
    private static int char64(char x) {
        if (x < 0 || x >= INDEX_64.length) {
            return -1;
        }
        return INDEX_64[x];
    }
}
