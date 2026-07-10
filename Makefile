.PHONY: all clean help test test-fast test-parallel test-browser-parallel playground-html playground-jekyll playground-swift playground-tailwind playground-bootstrap playground-react playground-vue playground-python playground-all \
	build-all build-core build-themes build-js build-js-only build-html build-site build-tailwind build-swift build-examples examples-prep build-gem \
	test-unit test-e2e test-examples test-example-bootstrap test-example-html test-example-jekyll test-example-react test-example-tailwind test-example-vue \
	test-python test-swift test-lhci test-links test-all ensure-deps ensure-report-dirs copy-reports serve-reports _serve serve serve-quick \
	test-workflows test-workflows-quick test-workflows-list test-workflows-dry test-workflows-clean

.DEFAULT_GOAL := help

##@ General

help: ## Show this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage: make <target>\n"} /^[a-zA-Z0-9_-]+:.*?##/ { printf "  \033[36m%-24s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) }' $(MAKEFILE_LIST)

all: build-all ## Build everything (alias for build-all)

clean: ## Remove build artifacts and test outputs
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf dist/ apps/site/dist/ apps/site/.astro/ coverage/ htmlcov/ .lighthouse/ lighthouse-reports/ playwright-report/ test-results/ .test-results/
	@find . -name "*.gem" -type f -delete
	@echo "✅ Clean complete"

##@ Playground (run example sites)

playground-html: ## Open vanilla HTML example
	@./scripts/playground.sh html

playground-jekyll: ## Serve Jekyll example (demonstrates gem usage)
	@./scripts/playground.sh jekyll

playground-swift: ## Open SwiftUI example in Xcode
	@./scripts/playground.sh swift

playground-tailwind: ## Run Vite dev server for Tailwind example
	@./scripts/playground.sh tailwind

playground-bootstrap: ## Run Vite dev server for Bootstrap example
	@cd examples/bootstrap && bun install && bun run dev

playground-react: ## Run Vite dev server for React example
	@cd examples/react && bun install && bun run dev

playground-vue: ## Run Vite dev server for Vue example
	@cd examples/vue && bun install && bun run dev

playground-python: ## Python example (placeholder)
	@echo "Python example placeholder - add implementation in examples/python-report/"

playground-all: playground-html playground-jekyll playground-tailwind playground-react playground-vue ## Open HTML, Jekyll, Tailwind, React, Vue examples

##@ Test

# Detect number of CPU cores for parallel execution
NPROC := $(shell nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 4)

# Reusable validation macro for bun commands
define check_bun
	@if ! command -v bun >/dev/null 2>&1 || [ ! -f "package.json" ]; then \
		echo "❌ bun or package.json missing. Install bun and deps first."; \
		exit 1; \
	fi
endef

# Run all tests in optimized parallel phases:
# Phase 1: Unit + Python + Swift (parallel)
# Phase 2: Build examples (required for browser tests)
# Phase 3: Examples + E2E (parallel)
# Phase 4: Lighthouse (sequential, needs server)
test: ensure-deps test-parallel build-examples examples-prep test-browser-parallel test-lhci ## Run all tests in optimized parallel phases

# Phase 1: Fast parallel tests (unit, python, swift)
test-parallel: ## Phase 1: unit + python + swift in parallel
	@echo "🚀 Phase 1: Running unit tests in parallel ($(NPROC) CPUs available)..."
	@rm -rf .test-results && mkdir -p .test-results
	@( $(MAKE) test-unit > .test-results/unit.log 2>&1 && touch .test-results/unit.ok ) & \
	( $(MAKE) test-python > .test-results/python.log 2>&1 && touch .test-results/python.ok ) & \
	( $(MAKE) test-swift > .test-results/swift.log 2>&1 && touch .test-results/swift.ok ) & \
	wait; \
	echo ""; \
	echo "📋 Phase 1 Results:"; \
	[ -f .test-results/unit.ok ] && echo "  ✅ Unit tests passed" || echo "  ❌ Unit tests failed"; \
	[ -f .test-results/python.ok ] && echo "  ✅ Python tests passed" || echo "  ❌ Python tests failed"; \
	[ -f .test-results/swift.ok ] && echo "  ✅ Swift tests passed" || echo "  ❌ Swift tests failed"; \
	[ -f .test-results/unit.ok ] && [ -f .test-results/python.ok ] && [ -f .test-results/swift.ok ]

# Phase 3: Browser-based tests (sequential suites, each internally parallelized)
test-browser-parallel: ## Phase 3: run e2e then examples sequentially
	@echo "🚀 Phase 3: Running browser test suites sequentially..."
	@$(MAKE) test-e2e
	@$(MAKE) test-examples

test-fast: ensure-deps test-parallel build-examples examples-prep test-browser-parallel ## Run without lighthouse (good for local dev)

# Individual example test targets
test-example-bootstrap: ## Run Playwright tests for the Bootstrap example
	@node scripts/test-examples.mjs bootstrap

test-example-html: ## Run Playwright tests for the vanilla HTML example
	@node scripts/test-examples.mjs html-vanilla

test-example-jekyll: ## Run Playwright tests for the Jekyll example
	@node scripts/test-examples.mjs jekyll

test-example-react: ## Run Playwright tests for the React example
	@node scripts/test-examples.mjs react

test-example-tailwind: ## Run Playwright tests for the Tailwind example
	@node scripts/test-examples.mjs tailwind

test-example-vue: ## Run Playwright tests for the Vue example
	@node scripts/test-examples.mjs vue

test-examples: ## Run Playwright tests for all examples
	@echo "🧪 Running all example tests..."
	@bun run examples:test

test-unit: ## Run TypeScript/Vitest unit tests
	$(call check_bun)
	@bun run test

test-e2e: ## Run Playwright E2E tests
	@if [ "$${SKIP_E2E:-0}" = "1" ]; then \
		echo "⏭️  Skipping E2E (SKIP_E2E=1)"; \
	elif ! command -v bun >/dev/null 2>&1 || [ ! -f "package.json" ]; then \
		echo "❌ bun or package.json missing. Install bun and deps first."; \
		exit 1; \
	else \
		bun run e2e:ci; \
	fi

test-lhci: ## Run Lighthouse CI against apps/site/dist
	@if [ "$${SKIP_LHCI:-0}" = "1" ]; then \
		echo "⏭️  Skipping Lighthouse (SKIP_LHCI=1)"; \
	elif ! command -v bun >/dev/null 2>&1 || [ ! -f "package.json" ]; then \
		echo "❌ bun or package.json missing. Install bun and deps first."; \
		exit 1; \
	else \
		bunx lhci autorun --config=lighthouserc.json --collect.numberOfRuns=1; \
	fi

test-links: build-site ## Validate internal links with html-proofer
	@echo "🔗 Running link validation with html-proofer..."
	@if [ "$${SKIP_LINKS:-0}" = "1" ]; then \
		echo "⏭️  Skipping link tests (SKIP_LINKS=1)"; \
	else \
		bunx htmlproofer \
			--assume-extension \
			--allow-hash-href \
			--allow-missing-href \
			--disable-external \
			--ignore-urls "/localhost/,/coverage-ruby/,/playwright/,/lighthouse/,/reports\\/coverage/,/reports\\/playwright/,/reports\\/lighthouse/" \
			--ignore-files "/coverage-python/,/examples\\/html-vanilla/,/examples\\/tailwind/" \
			apps/site/dist 2>&1 || (echo "❌ Link validation failed"; exit 1); \
		echo "✅ Link validation passed"; \
	fi

test-python: ## Run Python unit tests
	@cd python && uv sync --extra dev && uv run pytest tests/ -v

test-swift: ## Run Swift unit tests with coverage
	@if [ "$${SKIP_SWIFT:-0}" = "1" ]; then \
		echo "⏭️  Skipping Swift tests (SKIP_SWIFT=1)"; \
	else \
		if command -v swift >/dev/null 2>&1; then \
			echo "🧪 Running Swift tests with coverage..."; \
			cd examples/swift-swiftui && swift test --enable-code-coverage && \
			echo "📊 Generating Swift coverage report..." && \
			rm -rf htmlcov && mkdir -p htmlcov && \
			xcrun llvm-cov show \
				.build/arm64-apple-macosx/debug/TurboThemesPackageTests.xctest/Contents/MacOS/TurboThemesPackageTests \
				-instr-profile=.build/arm64-apple-macosx/debug/codecov/default.profdata \
				-format=html \
				-output-dir=htmlcov \
				-show-branches=count \
				-ignore-filename-regex='.*Tests.*' \
				-ignore-filename-regex='.*/.build/.*' && \
			echo "✅ Swift coverage report generated at examples/swift-swiftui/htmlcov/" && \
			echo "📊 Checking Swift coverage threshold (85% minimum)..." && \
			SWIFT_COV=$$(xcrun llvm-cov report \
				.build/arm64-apple-macosx/debug/TurboThemesPackageTests.xctest/Contents/MacOS/TurboThemesPackageTests \
				-instr-profile=.build/arm64-apple-macosx/debug/codecov/default.profdata \
				-ignore-filename-regex='.*Tests.*' \
				-ignore-filename-regex='.*/.build/.*' 2>&1 | grep '^TOTAL' | awk '{print $$10}' | tr -d '%') && \
			echo "Swift coverage: $${SWIFT_COV}%" && \
			if [ $$(echo "$${SWIFT_COV} < 85" | bc -l) -eq 1 ]; then \
				echo "❌ Swift coverage ($${SWIFT_COV}%) is below 85% threshold"; \
				exit 1; \
			else \
				echo "✅ Swift coverage meets 85% threshold"; \
			fi; \
		else \
			echo "⚠️  Swift not installed, skipping Swift tests"; \
		fi; \
	fi

test-all: test ## Alias for test

##@ Workflow testing (requires ACT + Docker)

test-workflows: ## Run all testable workflows (WORKFLOW=name, CATEGORY=cat, EVENT=type)
	@./scripts/local/test-workflows-act.sh $(if $(WORKFLOW),$(WORKFLOW),) \
		$(if $(CATEGORY),--category $(CATEGORY),) \
		$(if $(EVENT),--event $(EVENT),)

test-workflows-quick: ## Run quality workflows only (fastest)
	@./scripts/local/test-workflows-act.sh --category quality

test-workflows-list: ## List all available workflows
	@./scripts/local/test-workflows-act.sh --list

test-workflows-dry: ## Dry-run (show commands without executing)
	@./scripts/local/test-workflows-act.sh --dry-run $(if $(WORKFLOW),$(WORKFLOW),)

test-workflows-clean: ## Clean up stale ACT containers
	@echo "Cleaning up stale ACT containers..."
	@# Note: removed -r flag from xargs for macOS/BSD compatibility
	@docker ps -a --filter "name=act-" -q | xargs docker rm -f 2>/dev/null || true

ensure-deps:
	@if ! command -v bun >/dev/null 2>&1; then \
		echo "❌ bun is required. Install from https://bun.sh"; \
		exit 1; \
	fi
	@if [ -f "package.json" ] && [ ! -d "node_modules" ]; then \
		echo "📦 Installing JS deps with bun install..."; \
		bun install; \
	fi
	@if [ -d "node_modules/@playwright/test" ]; then \
		echo "🎭 Ensuring Playwright browsers are installed..."; \
		bunx playwright install chromium >/dev/null 2>&1 || true; \
	fi
	@if [ -f "apps/site/package.json" ] && [ ! -d "apps/site/node_modules" ]; then \
		echo "📦 Installing Astro site deps..."; \
		cd apps/site && bun install; \
	fi

# Ensure report directories exist (these are cleaned by make clean)
ensure-report-dirs:
	@mkdir -p coverage lighthouse-reports playwright-report

##@ Serve & Reports

copy-reports: ## Copy test reports to apps/site/dist
	@echo "📊 Copying test reports to site dist..."
	@cd apps/site && node scripts/post-build.mjs

serve-reports: ## Serve apps/site/dist (and reports) on http://127.0.0.1:4173
	@if ! command -v bunx >/dev/null 2>&1; then \
		echo "❌ bunx required to serve reports (http-server)."; exit 1; \
	fi
	@echo "Serving apps/site/dist (and reports if present) on http://127.0.0.1:4173 ..."
	@bunx --no-install http-server apps/site/dist -a 127.0.0.1 -p 4173 -c-1

# Internal serve target (shared by all serve variants)
_serve:
	@echo "🚀 Starting preview server..."
	@cd apps/site && bun run preview

serve: copy-reports ## Serve existing dist (copies reports first)
	@$(MAKE) _serve

serve-quick: build-site ## Build site and serve (no tests)
	@$(MAKE) _serve

##@ Build

build-core: ## bun run build (tokens/ts)
	bun run build

build-themes: ## bun run build:themes (CSS themes)
	bun run build:themes

build-js: ## bun run build:js (theme selector JS)
	bun run build:js

# JS bundle only (dev + prod) - use after build-core to avoid redundancy
build-js-only: ## bun run build:js:dev + build:js:prod (skip build-core)
	bun run build:js:dev && bun run build:js:prod

build-html: build-core build-js-only ## Build core+themes+js for vanilla demo
	@echo "HTML demo built. Open examples/html-vanilla/index.html"

build-site: build-core build-js-only ensure-report-dirs ## Build core+themes+js and Astro site
	cd apps/site && bun run build

build-tailwind: ## bun build inside examples/tailwind
	cd examples/tailwind && bun install && bun run build

build-examples: ## Build all framework examples (React, Vue, Bootstrap, Tailwind)
	@echo "📦 Building all examples..."
	@bun run examples:build

examples-prep: ## Copy built examples into site dist
	@echo "📋 Preparing examples in site dist..."
	@bun run examples:prep

build-swift: ## SwiftUI preview (open in Xcode)
	@echo "Open examples/swift-swiftui/Package.swift in Xcode to build previews."

build-gem: ## Build Ruby gem for Jekyll
	@echo "💎 Building Ruby gem..."
	@./scripts/build-gem.sh

build-all: build-core build-js-only build-examples build-site examples-prep build-gem ## core + js + examples + site + prep + gem
