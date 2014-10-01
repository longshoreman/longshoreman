version = $(shell cat package.json | jq -r '.version')
image = longshorman/longshoreman:$(version)

all: build push

build:
	docker build -t $(image) .

push:
	docker push $(image)

.PHONY: build push all
