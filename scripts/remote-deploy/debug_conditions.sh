#!/bin/bash
# Diagnostic: Get Spring Boot condition evaluation report
set -e
cd /home/deploy/host-shell-standalone

# Add --debug to JAVA_OPTS or override CMD
echo "Stopping host-shell..."
docker compose stop host-shell || true
docker compose rm -f host-shell || true

echo "Running with --debug to capture condition report..."
docker run --rm --name brix-debug \
  --network host-shell-standalone_default \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/brix \
  -e SPRING_DATASOURCE_USERNAME=brix \
  -e SPRING_DATASOURCE_PASSWORD=brix_dev_pass \
  -e SPRING_REDIS_HOST=redis \
  -e SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092 \
  host-shell-standalone-host-shell:latest \
  sh -c 'java $JAVA_OPTS -jar app.jar --debug 2>&1 | head -2000' > /tmp/debug-output.log 2>&1 &
DEBUG_PID=$!

# Wait up to 4 minutes for either failure or completion
for i in {1..240}; do
  sleep 1
  if grep -q "APPLICATION FAILED\|CONDITIONS EVALUATION REPORT\|Started ShellApp" /tmp/debug-output.log 2>/dev/null; then
    echo "Detected output marker after ${i}s"
    break
  fi
done

# Allow extra time for full output
sleep 5
kill $DEBUG_PID 2>/dev/null || true
docker stop brix-debug 2>/dev/null || true

echo "=== AuthFlow / Password / IdentityTenant condition matches ==="
grep -A 3 -B 1 -E "AuthFlowAutoConfiguration|PasswordCapabilityAutoConfiguration|JwtIssuerAutoConfiguration|IdentityTenantCapability" /tmp/debug-output.log | head -200
