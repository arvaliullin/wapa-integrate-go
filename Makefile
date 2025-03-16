default: pkg

.PHONY: pkg publish build clean

export GOARCH=wasm
export GOOS=js

build:
	@echo "Выполняется сборка WebAssembly файла... (build)"
	mkdir -p out
	go build -o $(PWD)/out/integrate.wasm $(PWD)/lib/lib.go

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
