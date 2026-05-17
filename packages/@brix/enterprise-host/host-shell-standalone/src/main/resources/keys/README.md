# JWT Keys Directory

This directory should contain the JWT signing keys for the application.

**⚠️ SECURITY WARNING**: Never commit real keys to Git!

## Required Files

| File | Purpose | How to Generate |
|------|---------|-----------------|
| `private.pem` | JWT signing key (RS256) | See below |
| `public.pem` | JWT verification key (RS256) | See below |
| `cert.pem` | SSL certificate (optional) | See below |
| `jwt-keystore.p12` | Java KeyStore for JWT | See below |

## Generate RSA Key Pair

```bash
# Generate private key (2048-bit RSA)
openssl genrsa -out private.pem 2048

# Extract public key
openssl rsa -in private.pem -outform PEM -pubout -out public.pem
```

## Generate Self-Signed Certificate (Development Only)

```bash
# Generate certificate
openssl req -new -x509 -key private.pem -out cert.pem -days 365 \
  -subj "/CN=localhost/O=Development/C=US"
```

## Generate Java KeyStore (PKCS#12)

```bash
# IMPORTANT: Use a strong, unique password — never use default passwords like 'changeit'.
# Store the password in an environment variable:
export JWT_KEYSTORE_PASSWORD=$(openssl rand -base64 32)

# Create PKCS#12 keystore from key pair
openssl pkcs12 -export -in cert.pem -inkey private.pem \
  -out jwt-keystore.p12 -name brix-jwt \
  -password pass:${JWT_KEYSTORE_PASSWORD}

echo "Keystore password: ${JWT_KEYSTORE_PASSWORD}"
echo "Save this password securely — it is required for key export operations."
```

## Configuration

**All sensitive values MUST be provided via environment variables.**
Never use default or fallback passwords in production.

```yaml
# application.yml
identity:
  jwt:
    private-key-path: ${JWT_PRIVATE_KEY_PATH:classpath:keys/private.pem}
    issuer: ${JWT_ISSUER:brix-auth-center}
    audience: ${JWT_AUDIENCE:brix-platform-api}
    expiration: ${JWT_EXPIRATION:3600}
```

## Key Export Utility

To export keys from the PKCS#12 keystore to PEM format, use the dedicated
key-export-tool provided in `brix/packages/@brix/platform-devtools/key-export-tool/`.

```bash
# Set the keystore password environment variable
export JWT_KEYSTORE_PASSWORD=<your-keystore-password>

# Run the key-export-tool (from the brix repository root)
cd packages/@brix/platform-devtools/key-export-tool
mvn exec:java -Dexec.args="jwt-keystore.p12 ."
```

## Production Deployment

In production:
1. Generate keys using a secure key ceremony
2. Store keys in a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
3. Mount keys as environment variables or files at runtime
4. Set required environment variables: `JWT_KEYSTORE_PASSWORD`, `JWT_PRIVATE_KEY_PATH`
5. Never include keys in container images or deployment artifacts
6. Rotate keys periodically according to your security policy
