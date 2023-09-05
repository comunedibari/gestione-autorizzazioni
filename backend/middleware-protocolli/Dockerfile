FROM openjdk:8-jdk-alpine

LABEL maintainer="almaviva.it"

VOLUME /opt/bari-citta-connessa-middleware

EXPOSE 8082

WORKDIR /bari-citta-connessa-middleware

ARG JAR_FILE=target/bari-citta-connessa-middleware-1.1.jar

ADD ${JAR_FILE} bari-citta-connessa-middleware.jar

RUN addgroup -g 1001 appuser && adduser -D -S -u 1001 appuser -G appuser && chown -R appuser:appuser /bari-citta-connessa-middleware && chmod -R 775 /bari-citta-connessa-middleware

USER appuser

ENTRYPOINT ["java","-jar","bari-citta-connessa-middleware.jar"]