# Universal File Viewer - Build System
# Usage: make [target]

# Variables
NAME = universal-file-viewer
VERSION = $(shell grep '"version"' manifest.json | cut -d'"' -f4)
BUILD_DIR = dist
SRC_DIRS = js css lib
SRC_FILES = manifest.json popup.html popup.js

# Colors for output
RED = \033[0;31m
GREEN = \033[0;32m
YELLOW = \033[1;33m
NC = \033[0m # No Color

# Default target
.PHONY: all
all: clean setup build

# Setup dependencies
.PHONY: setup
setup:
	@echo "$(GREEN)Setting up dependencies...$(NC)"
	@mkdir -p lib
	@if [ ! -f lib/js-yaml.min.js ]; then \
		echo "Downloading js-yaml..."; \
		curl -sL https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js -o lib/js-yaml.min.js; \
	fi
	@echo "$(GREEN)✓ Dependencies ready$(NC)"

# Development build
.PHONY: build
build: setup
	@echo "$(GREEN)Building extension...$(NC)"
	@mkdir -p $(BUILD_DIR)
	@zip -r $(BUILD_DIR)/$(NAME)-$(VERSION).zip $(SRC_FILES) $(SRC_DIRS) -x "*.DS_Store" "*~" "*.swp"
	@echo "$(GREEN)✓ Built: $(BUILD_DIR)/$(NAME)-$(VERSION).zip$(NC)"

# Production build (minified)
.PHONY: production
production: setup lint test
	@echo "$(GREEN)Creating production build...$(NC)"
	@mkdir -p $(BUILD_DIR)/prod

	# Copy files
	@cp -r $(SRC_DIRS) $(SRC_FILES) $(BUILD_DIR)/prod/

	# Minify JavaScript (requires uglify-js)
	@if command -v uglifyjs &> /dev/null; then \
		find $(BUILD_DIR)/prod/js -name "*.js" -exec uglifyjs {} -o {} -c -m \; ; \
		echo "$(GREEN)✓ JavaScript minified$(NC)"; \
	else \
		echo "$(YELLOW)⚠ uglify-js not found, skipping minification$(NC)"; \
	fi

	# Minify CSS (requires clean-css-cli)
	@if command -v cleancss &> /dev/null; then \
		find $(BUILD_DIR)/prod/css -name "*.css" -exec cleancss {} -o {} \; ; \
		echo "$(GREEN)✓ CSS minified$(NC)"; \
	else \
		echo "$(YELLOW)⚠ clean-css not found, skipping minification$(NC)"; \
	fi

	# Create production zip
	@cd $(BUILD_DIR)/prod && zip -r ../$(NAME)-$(VERSION)-prod.zip * -x "*.DS_Store" "*~" "*.swp"
	@rm -rf $(BUILD_DIR)/prod
	@echo "$(GREEN)✓ Production build: $(BUILD_DIR)/$(NAME)-$(VERSION)-prod.zip$(NC)"

# Run extension in Firefox
.PHONY: run
run: setup
	@echo "$(GREEN)Starting Firefox with extension...$(NC)"
	@if command -v web-ext &> /dev/null; then \
		web-ext run --verbose; \
	else \
		echo "$(RED)✗ web-ext not found. Install with: npm install -g web-ext$(NC)"; \
		exit 1; \
	fi

# Lint the extension
.PHONY: lint
lint:
	@echo "$(GREEN)Linting extension...$(NC)"
	@if command -v web-ext &> /dev/null; then \
		web-ext lint; \
	else \
		echo "$(YELLOW)⚠ web-ext not found, skipping lint$(NC)"; \
	fi

# Run tests
.PHONY: test
test:
	@echo "$(GREEN)Running tests...$(NC)"
	@if [ -f package.json ]; then \
		npm test; \
	else \
		echo "$(YELLOW)⚠ No package.json found, skipping tests$(NC)"; \
	fi

# Watch for changes and rebuild
.PHONY: watch
watch:
	@echo "$(GREEN)Watching for changes...$(NC)"
	@while true; do \
		$(MAKE) build; \
		echo "$(YELLOW)Waiting for changes... (Ctrl+C to stop)$(NC)"; \
		fswatch -1 -r js css manifest.json 2>/dev/null || sleep 5; \
	done

# Install development tools
.PHONY: install-tools
install-tools:
	@echo "$(GREEN)Installing development tools...$(NC)"
	npm install -g web-ext
	npm install -g uglify-js
	npm install -g clean-css-cli
	@echo "$(GREEN)✓ Tools installed$(NC)"

# Create source distribution
.PHONY: source
source:
	@echo "$(GREEN)Creating source distribution...$(NC)"
	@mkdir -p $(BUILD_DIR)
	@git archive --format=tar.gz -o $(BUILD_DIR)/$(NAME)-$(VERSION)-source.tar.gz HEAD
	@echo "$(GREEN)✓ Source: $(BUILD_DIR)/$(NAME)-$(VERSION)-source.tar.gz$(NC)"

# Sign extension (requires Mozilla credentials)
.PHONY: sign
sign: production
	@echo "$(GREEN)Signing extension...$(NC)"
	@if [ -z "$(AMO_JWT_ISSUER)" ] || [ -z "$(AMO_JWT_SECRET)" ]; then \
		echo "$(RED)✗ Set AMO_JWT_ISSUER and AMO_JWT_SECRET environment variables$(NC)"; \
		exit 1; \
	fi
	@web-ext sign --source-dir . --artifacts-dir $(BUILD_DIR)

# Clean build artifacts
.PHONY: clean
clean:
	@echo "$(GREEN)Cleaning build artifacts...$(NC)"
	@rm -rf $(BUILD_DIR)
	@rm -f *.zip *.xpi
	@echo "$(GREEN)✓ Cleaned$(NC)"

# Full clean (including dependencies)
.PHONY: distclean
distclean: clean
	@echo "$(GREEN)Removing all generated files...$(NC)"
	@rm -rf lib/*.min.js
	@rm -rf node_modules
	@echo "$(GREEN)✓ Distribution cleaned$(NC)"

# Check for required tools
.PHONY: check
check:
	@echo "$(GREEN)Checking environment...$(NC)"
	@echo -n "Node.js: "; node --version 2>/dev/null || echo "$(RED)Not found$(NC)"
	@echo -n "npm: "; npm --version 2>/dev/null || echo "$(RED)Not found$(NC)"
	@echo -n "web-ext: "; web-ext --version 2>/dev/null || echo "$(YELLOW)Not found (optional)$(NC)"
	@echo -n "uglifyjs: "; uglifyjs --version 2>/dev/null || echo "$(YELLOW)Not found (optional)$(NC)"
	@echo -n "cleancss: "; cleancss --version 2>/dev/null || echo "$(YELLOW)Not found (optional)$(NC)"
	@echo -n "fswatch: "; fswatch --version 2>/dev/null || echo "$(YELLOW)Not found (optional)$(NC)"

# Display help
.PHONY: help
help:
	@echo "$(GREEN)Universal File Viewer - Build System$(NC)"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Main targets:"
	@echo "  $(YELLOW)all$(NC)          - Clean, setup, and build (default)"
	@echo "  $(YELLOW)setup$(NC)        - Download dependencies"
	@echo "  $(YELLOW)build$(NC)        - Create development build"
	@echo "  $(YELLOW)production$(NC)   - Create minified production build"
	@echo "  $(YELLOW)run$(NC)          - Run extension in Firefox"
	@echo ""
	@echo "Development:"
	@echo "  $(YELLOW)watch$(NC)        - Watch files and rebuild on changes"
	@echo "  $(YELLOW)lint$(NC)         - Lint the extension"
	@echo "  $(YELLOW)test$(NC)         - Run tests"
	@echo "  $(YELLOW)check$(NC)        - Check for required tools"
	@echo ""
	@echo "Distribution:"
	@echo "  $(YELLOW)sign$(NC)         - Sign extension (requires Mozilla credentials)"
	@echo "  $(YELLOW)source$(NC)       - Create source tarball"
	@echo ""
	@echo "Maintenance:"
	@echo "  $(YELLOW)clean$(NC)        - Remove build artifacts"
	@echo "  $(YELLOW)distclean$(NC)    - Remove all generated files"
	@echo "  $(YELLOW)install-tools$(NC) - Install development tools"
	@echo ""
	@echo "Environment variables:"
	@echo "  AMO_JWT_ISSUER - Mozilla addon API key"
	@echo "  AMO_JWT_SECRET - Mozilla addon API secret"

# Phony target list
.PHONY: all setup build production run lint test watch install-tools source sign clean distclean check help