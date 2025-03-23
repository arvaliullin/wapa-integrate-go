export GOARCH=wasm
export GOOS=js

all: pkg

build:
	@echo "Выполняется сборка WebAssembly файла... (build)"
	mkdir -p out
	tinygo build -o $(PWD)/out/integrate.wasm $(PWD)/lib/lib.go

bench: build
	@echo "Выполняется тестирование... (bench)"
	cp "/usr/local/lib/tinygo/targets/wasm_exec.js" cmd/bench
	bun cmd/bench/main.js out/integrate.wasm configs/wapa.json

pkg: build
	@echo "Выполняется сборка пакета... (pkg)"
	mkdir -p out
	cp configs/wapa.json out/wapa.json
	zip -r pkg.zip out/*

publish: pkg
	@echo "Выполняется публикация пакета... (publish)"

clean:
	@echo "Очистка сгенерированных файлов... (clean)"
	rm -rf out pkg.zip

.PHONY: all pkg publish build clean bench
