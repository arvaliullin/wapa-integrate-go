const fs = require("fs/promises");
const path = require("path");
require("./wasm_exec");

/**
 * BenchmarkRunner запускает несколько функций
 * из WebAssembly-модуля с аргументами.
 */
class BenchmarkRunner {
    constructor(wasmPath, argsPath) {
        this.wasmPath = wasmPath;
        this.argsPath = argsPath;
    }

    /**
     * Проверка существования файла.
     * @param {string} filePath
     */
    async checkFileExists(filePath) {
        try {
            await fs.access(filePath);
        } catch (err) {
            throw new Error(`File not found: ${filePath}`);
        }
    }

    /**
     * Загрузка JSON-файла.
     * @param {string} filePath
     * @returns {Promise<object>}
     */
    async loadJSON(filePath) {
        await this.checkFileExists(filePath);
        try {
            const data = await fs.readFile(filePath, "utf8");
            return JSON.parse(data);
        } catch (err) {
            throw new Error(`Invalid JSON content in file ${filePath}: ${err.message}`);
        }
    }

    async run() {
        try {
            await this.checkFileExists(this.wasmPath);
            const argsData = await this.loadJSON(this.argsPath);

            const functions = argsData.functions || [];
            if (!Array.isArray(functions) || functions.length === 0) {
                throw new Error("Invalid or empty 'functions' array in the arguments JSON.");
            }

            const source = await fs.readFile(this.wasmPath);
            const typedArray = new Uint8Array(source);

            const go = new globalThis.Go();
            const result = await WebAssembly.instantiate(typedArray, go.importObject);

            go.run(result.instance);

            for (let i = 0; i < functions.length; i++) {
                const func = functions[i];
                const funcName = func.function;
                const funcArgs = func.args || [];

                if (!funcName) {
                    console.warn(`Function at index ${i} does not specify a 'function' name. Skipping...`);
                    continue;
                }

                if (typeof globalThis[funcName] !== "function") {
                    console.error(`[Error] Function '${funcName}' does not exist in the WebAssembly global scope.`);
                    continue;
                }

                await this.runFunction(i, funcName, funcArgs);
            }
        } catch (err) {
            console.error(`[Error] ${err.message}`);
        }
    }

    /**
     * Выполнение отдельной функции из WebAssembly.
     * @param {number} index Индекс функции в массиве
     * @param {string} funcName Название функции
     * @param {Array} funcArgs Аргументы функции
     */
    async runFunction(index, funcName, funcArgs) {
        try {
            const start = performance.now();
            const resultValue = globalThis[funcName](...funcArgs);
            const end = performance.now();

            this.logResult(index, funcName, funcArgs, resultValue, end - start);
        } catch (err) {
            console.error(`[Error] Failed to execute function '${funcName}' at index ${index}: ${err.message}`);
        }
    }

    /**
     * Логирование результата выполнения функции.
     * @param {number} index Индекс функции в массиве
     * @param {string} funcName Название функции
     * @param {Array} funcArgs Аргументы функции
     * @param {*} resultValue Результат выполнения
     * @param {number} execTime Время выполнения (мс)
     */
    logResult(index, funcName, funcArgs, resultValue, execTime) {
        console.log(`\n[Function #${index}]`);
        console.log(`Name: ${funcName}`);
        console.log(`Arguments: ${JSON.stringify(funcArgs)}`);
        console.log(`Result: ${resultValue}`);
        console.log(`Execution Time: ${execTime.toFixed(2)} ms`);
    }
}

async function main() {
    if (process.argv.length < 4) {
        console.error("Usage: bun bench.js <wasm_file> <args_file>");
        process.exit(1);
    }

    const wasmFile = path.resolve(process.cwd(), process.argv[2]);
    const argsFile = path.resolve(process.cwd(), process.argv[3]);

    const runner = new BenchmarkRunner(wasmFile, argsFile);
    await runner.run();
}

main();
