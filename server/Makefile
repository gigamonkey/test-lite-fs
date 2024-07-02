# Remove make's default rules.
.SUFFIXES:

SHELL := bash -O globstar

all:

serve: .env
	./loop.sh

docker:
	docker build . -t test-lite-fs

deploy: fly.env fly.toml
	fly deploy --build-arg GIT_STATUS="$(shell ./gitenv.sh)"

run_docker:
	docker run --env PORT=9000 --name test-lite-fs -d -p 9000:9000 test-lite-fs

.env:
	$(error Need an .env file. See template.env)

*.env:
	$(error Create a $@ by copying template.env. Do not add it to git)

fly.toml:
	$(error Create $@ by running fly launch)

pretty:
	prettier -w **/*.js *.sql public/**/*.css

clean:

clean_db:
	rm -f db.db*

.PHONY: all pretty serve docker deploy run_docker clean clean_db
