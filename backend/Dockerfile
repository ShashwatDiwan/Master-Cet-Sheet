# syntax=docker/dockerfile:1.7

# ---------- Stage 1: Build ----------
FROM maven:3.9.9-eclipse-temurin-17-alpine AS build

WORKDIR /app

COPY pom.xml ./
COPY .mvn/ .mvn/
RUN --mount=type=cache,target=/root/.m2 \
    mvn -q -DskipTests dependency:go-offline

COPY src/ src/
RUN --mount=type=cache,target=/root/.m2 \
    mvn -q -DskipTests package

# ✅ NEW: Extract layered JAR for better Docker layer caching
RUN java -Djarmode=layertools -jar target/*.jar extract --destination target/extracted

# ---------- Stage 2: Run ----------
FROM eclipse-temurin:17-jre-alpine

# ✅ NEW: Label your image with useful metadata
LABEL org.opencontainers.image.title="My App" \
      org.opencontainers.image.version="1.0"

WORKDIR /app

# ✅ NEW: Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# ✅ NEW: Copy layered JAR in order (least → most frequently changed)
#    This means code changes don't invalidate the dependencies layer
COPY --from=build /app/target/extracted/dependencies/ ./
COPY --from=build /app/target/extracted/spring-boot-loader/ ./
COPY --from=build /app/target/extracted/snapshot-dependencies/ ./
COPY --from=build /app/target/extracted/application/ ./
# The BirBal importer is intentionally opt-in, but when it is enabled it needs
# the pre-generated chapter corpus alongside the application.
COPY --chown=appuser:appgroup corpus-json/ ./corpus-json/

# ✅ NEW: Switch to non-root user (never run as root in production)
USER appuser

EXPOSE 8080

# ✅ NEW: Add a healthcheck so orchestrators (K8s, Docker Compose) know when app is ready
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:8080/api/v1/actuator/health || exit 1

# ✅ IMPROVED: Pass JVM flags for container-awareness
ENTRYPOINT ["java", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "org.springframework.boot.loader.launch.JarLauncher"]
