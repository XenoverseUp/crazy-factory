
import * as w4 from "./wasm4"
import Point from "./Game/Point"
import { Numbers } from "./Game/Assets";


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

export function htriangle(position: Point<u8>, direction: boolean): void {
	if (direction) {
		w4.vline(position.x, position.y, 6)
		w4.vline(position.x - 1, position.y + 1, 4)
		w4.vline(position.x - 2, position.y + 2, 2)
	} else {
		w4.vline(position.x, position.y, 6)
		w4.vline(position.x + 1, position.y + 1, 4)
		w4.vline(position.x + 2, position.y + 2, 2)
	}
}


export function withSign(sign: String, num: String, position: Point<u8>): void {
	const charPositionX: u8 = (sign == "+" ? 35 : 38)
	w4.blitSub(Numbers, position.x, position.y, 3, 5, charPositionX, 0, 48, w4.BLIT_1BPP)
	number(num, new Point(position.x + 4, position.y))
}

export function number(num: String, position: Point<u8>): void {
	if (num.charAt(0) == "$") {
		w4.blitSub(Numbers, position.x, position.y, 5, 5, 3 * 10, 0, 48, w4.BLIT_1BPP)

		for (let i = 1; i < num.length; i++) {
			w4.blitSub(Numbers, position.x + i * 4 + 2, position.y, 3, 5, 3 * u8(parseInt(num.charAt(i))), 0, 48, w4.BLIT_1BPP)
		}
	} else {
		for (let i = 0; i < num.length; i++) {
			w4.blitSub(Numbers, position.x + i * 4, position.y, 3, 5, 3 * u8(parseInt(num.charAt(i))), 0, 48, w4.BLIT_1BPP)
		}
	}
}

export const ascendioCosts: Map<u8, i16> = new Map<u8,i16>()
ascendioCosts.set(1, 250)
ascendioCosts.set(2, 350)
ascendioCosts.set(3, 500)
ascendioCosts.set(4, 750)

export const depulsoCosts: Map<u8, i16> = new Map<u8,i16>()
depulsoCosts.set(1, 150)
depulsoCosts.set(2, 200)
depulsoCosts.set(3, 300)
depulsoCosts.set(4, 500)


export const upgradeCosts: Int16Array = new Int16Array(3)
upgradeCosts[0] = 500
upgradeCosts[1] = 750
upgradeCosts[2] = 1000

