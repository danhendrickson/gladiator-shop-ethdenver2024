# .PHONY: deploy docker docker-no-cache prune

# =======================================================================================
# Propagate latest Github Tag Semantically
# Usage: make deploy tag={TAG}
deploy:
	sh get-git.sh $(tag)

# =======================================================================================
# Run a docker build
#docker:
#	docker build --tag gladiator .

#docker-no-cache:
#	docker build --no-cache --tag gladiator .