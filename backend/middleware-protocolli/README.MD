mvn clean install -DskipTests

docker build -t docker-registry.docker-registry.10.10.85.108.xip.io/docker-local/bari-citta-connessa-middleware:1.0.28 .

docker push docker-registry.docker-registry.10.10.85.108.xip.io/docker-local/bari-citta-connessa-middleware:1.0.28