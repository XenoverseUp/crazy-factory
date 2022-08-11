import * as w4 from "../wasm4"
import Point from "./Point"
import { Package as PackagePtr } from "./Assets"
import { TILE_SIZE } from "../constants"

export default class Package {
	private type: u8
	private position: Point<u8> = new Point(30, 19)

	constructor(t: u8) {
		this.type = t

		if (t == 1) this.position = new Point(30, 3 * TILE_SIZE + 19)
		if (t == 2) this.position = new Point(30, 6 * TILE_SIZE + 19)
	}

	draw(): void {
		store<u16>(w4.DRAW_COLORS, 0x321)
		w4.blit(PackagePtr, this.position.x, this.position.y, 8, 6, w4.BLIT_2BPP)
	}
}