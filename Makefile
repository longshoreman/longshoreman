version = $(npm version)
image = longshoreman/longshoreman:$(version)

all: build push

build:
	docker build -t $(image) .

push:
	docker push $(image)

.PHONY: build push all
