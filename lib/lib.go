package main

import (
	"syscall/js"
)

func f(x float64) float64 {
	return x * x
}

func Integrate(xmin float64, xmax float64, intervals_count int) float64 {
	dx := (xmax - xmin) / float64(intervals_count)
	total := 0.0
	x := xmin

	for i := 0; i < intervals_count; i++ {
		total = total + dx*(f(x)+f(x+dx))/2.0
		x = x + dx
	}

	return total
}

func x2Integrate(this js.Value, args []js.Value) interface{} {
	xmin := args[0].Float()
	xmax := args[1].Float()
	intervals_count := args[2].Int()
	return Integrate(xmin, xmax, intervals_count)
}

func main() {
	js.Global().Set("x2Integrate", js.FuncOf(x2Integrate))
	select {}
}
