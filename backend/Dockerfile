# ---------- Stage 1: Build ----------
FROM maven:3.9.9-eclipse-temurin-17-alpine AS build

WORKDIR /app

# copy only build metadata first so dependency resolution is cacheable
COPY pom.xml ./
COPY .mvn/ .mvn/
COPY mvnw ./
RUN ./mvnw -q -DskipTests dependency:go-offline

# then copy source and package
COPY src/ src/
RUN ./mvnw -q -DskipTests clean package

# ---------- Stage 2: Run ----------
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]