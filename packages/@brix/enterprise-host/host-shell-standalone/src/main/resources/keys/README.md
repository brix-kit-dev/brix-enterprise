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
# Create PKCS#12 keystore from key pair
openssl pkcs12 -export -in cert.pem -inkey private.pem \
  -out jwt-keystore.p12 -name jwt-key \
  -password pass:changeit
```

## Configuration

Set the following environment variables or application properties:

```yaml
# application.yml
brix:
  jwt:
    keystore-path: classpath:keys/jwt-keystore.p12
    keystore-password: ${JWT_KEYSTORE_PASSWORD:changeit}
    key-alias: jwt-key
```

## Production Deployment

In production:
1. Generate keys using a secure key ceremony
2. Store keys in a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
3. Mount keys as environment variables or files at runtime
4. Never include keys in container images or deployment artifacts
