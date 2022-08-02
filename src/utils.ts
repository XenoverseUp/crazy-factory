import * as w4 from "./wasm4"
import Point from "./Game/Point"

export function setColors(): void {

	// GREEN
	store<u32>(w4.PALETTE, 0xe0f8cf, 0 * sizeof<u32>());
	store<u32>(w4.PALETTE, 0x86c06c, 1 * sizeof<u32>());
	store<u32>(w4.PALETTE, 0x306850, 2 * sizeof<u32>());
	store<u32>(w4.PALETTE, 0x071821, 3 * sizeof<u32>());

	// BLUE
	// store<u32>(w4.PALETTE, 0xDFF6FF, 0 * sizeof<u32>());
	// store<u32>(w4.PALETTE, 0x47B5FF, 1 * sizeof<u32>());
	// store<u32>(w4.PALETTE, 0x1363DF, 2 * sizeof<u32>());
	// store<u32>(w4.PALETTE, 0x06283D, 3 * sizeof<u32>());

	// WESTLAND
	// store<u32>(w4.PALETTE, 0xF7D716, 0 * sizeof<u32>());
	// store<u32>(w4.PALETTE, 0xEC9B3B, 1 * sizeof<u32>());
	// store<u32>(w4.PALETTE, 0xF24C4C, 2 * sizeof<u32>());
	// store<u32>(w4.PALETTE, 0x293462, 3 * sizeof<u32>());
}

export function pixel(position: Point<u8>): void {
	w4.hline(position.x, position.y, 1)
}

export function vtriangle(position: Point<u8>, direction: boolean): void {
	if (direction) {
		w4.hline(position.x, position.y, 6)
		w4.hline(position.x + 1, position.y - 1, 4)
		w4.hline(position.x + 2, position.y - 2, 2)
	} else {
		w4.hline(position.x, position.y, 6)
		w4.hline(position.x + 1, position.y + 1, 4)
		w4.hline(position.x + 2, position.y + 2, 2)
	}
}