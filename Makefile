.PHONY: install dev build lint format format-check typecheck test check clean

install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

lint:
	pnpm lint

format:
	pnpm format

format-check:
	pnpm format:check

typecheck:
	pnpm typecheck

test:
	pnpm test

check:
	pnpm check

clean:
	pnpm clean
