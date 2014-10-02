docker rm -f $(docker ps -aq) 2> /dev/null
export CONTROLLER_HOST=`boot2docker ip 2> /dev/null`
export REDIS_PORT=6379
export REDIS_HOST=localhost
export DOCKER_HOST=`boot2docker ip 2> /dev/null`
export DOCKER_IMAGE=longshoreman/test
mocha --reporter spec -t 10000
