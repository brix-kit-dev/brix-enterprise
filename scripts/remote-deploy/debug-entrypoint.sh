#!/bin/sh
# Add --debug to enable Spring Boot CONDITIONS EVALUATION REPORT
exec java $JAVA_OPTS -jar /app/app.jar --debug
