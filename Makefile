all: build push

build:
	docker build -t longshoreman/longshoreman .

push:
	docker push longshoreman/longshoreman

.PHONY: build push
