# ---------- Stage 1: Build ----------
FROM maven:3.9.9-eclipse-temurin-17-alpine AS build

WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# ---------- Stage 2: Run ----------
FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]