#!/bin/bash

mvn clean package -Dengine.version=$1 -Dengine.builddate=`date +%Y-%m-%d`