import * as w4 from "../wasm4"
import { Machine as MachineSprite } from "./Assets"
import { TILE_SIZE } from "../constants"


export default class Machine {
	private level: u8 = 1
	private isWorking: boolean = false
	private productPerDay: u8 = 4
	private position: Uint8Array = new Uint8Array(2)

	constructor(x: u8, y: u8) {
		this.position[0] = x
		this.position[1] = y
	}


	draw(): void {
		store<u16>(w4.DRAW_COLORS, 0x0432)
		w4.blit(MachineSprite, this.position[0] * TILE_SIZE, this.position[1] * TILE_SIZE, 32, 32, w4.BLIT_2BPP)

		store<u16>(w4.DRAW_COLORS, 0x0001)
		if (!this.isWorking) w4.text("!", this.position[0] * TILE_SIZE + 7, this.position[1] * TILE_SIZE + 13)
		else w4.text(this.level.toString(), this.position[0] * TILE_SIZE + 7, this.position[1] * TILE_SIZE + 13)

	}

}