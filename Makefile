.PHONY: deps test test-unit test-acceptance typecheck load-check try

deps:
	npm install --ignore-scripts

test: test-unit test-acceptance

test-unit:
	./node_modules/.bin/vitest run $(TEST_FILTER)

test-acceptance:
	NODE_OPTIONS="--import tsx" ./node_modules/.bin/cucumber-js $(ACCEPTANCE_FILTER)

typecheck:
	./node_modules/.bin/tsc --noEmit

# Run Pi with only this checkout's extension, so an installed copy does not load twice.
# Pass extra Pi flags with ARGS, e.g. make try ARGS="--no-session".
try:
	pi --no-extensions -e ./extensions/auto-model.ts $(ARGS)

load-check:
	node --import tsx --input-type=module -e 'const m = await import("./extensions/auto-model.ts"); if (typeof m.default !== "function") throw new Error("Missing extension factory"); console.log("Extension module loads");'
