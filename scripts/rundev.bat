@Echo off

java -Dorg.slf4j.simpleLogger.log.AIRanking=debug -ea -jar build\Engine.jar -port 9001
