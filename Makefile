.PHONY: deps test test-unit test-acceptance typecheck load-check

deps:
	npm install --ignore-scripts

test: test-unit test-acceptance

test-unit:
	./node_modules/.bin/vitest run $(TEST_FILTER)

test-acceptance:
	NODE_OPTIONS="--import tsx" ./node_modules/.bin/cucumber-js $(ACCEPTANCE_FILTER)

typecheck:
	./node_modules/.bin/tsc --noEmit

load-check:
	node --import tsx --input-type=module -e 'const m = await import("./extensions/auto-model.ts"); if (typeof m.default !== "function") throw new Error("Missing extension factory"); console.log("Extension module loads");'
