import * as w4 from "../wasm4"
import { DownPipe, Machine as MachineSprite, Out, RightPipe, ToDownRightPipe, ToRightDownPipe, ToTopRightPipe } from "./Assets"
import { TILE_SIZE } from "../constants"
import Point from "./Point"

const pipeScene = [
	[".", ".", ".", ".", ".", ".", ".", ".", ".", "."],
	[".", ".", "-", "-", ")", ".", ".", ".", ".", "."],
	[".", ".", ".", ".", "|", ".", ".", ".", ".", "."],
	[".", ".", ".", ".", "|", ".", ".", ".", ">", "o"],
	[".", ".", "-", ")", "|", ".", ".", ".", "|", "."],
	[".", ".", ".", "|", "(", "-", "-", ".", ".", "."],
	[".", ".", ".", "(", "-", "-", "-", ".", ".", "."],
	[".", ".", "-", "-", "-", "-", "-", ".", ".", "."],
]


export default class Machine {
	private id: u8
	private level: u8 = 1
	private isWorking: boolean = false
	private productPerDay: u8 = 4
	private position: Point<u8>

	constructor(id: u8, position: Point<u8>) {
		this.id = id
		this.position = position
	}


	draw(): void {
		store<u16>(w4.DRAW_COLORS, 0x0432)
		w4.blit(MachineSprite, this.position.x * TILE_SIZE, this.position.y * TILE_SIZE, 2 * TILE_SIZE, 2 * TILE_SIZE, w4.BLIT_2BPP)

		store<u16>(w4.DRAW_COLORS, 0x0001)
		if (!this.isWorking) w4.text("!", this.position.x * TILE_SIZE + 7, this.position.y * TILE_SIZE + 13)
		else w4.text(this.level.toString(), this.position.x * TILE_SIZE + 7, this.position.y * TILE_SIZE + 13)

	}

	static drawPipes(): void {
		store<u16>(w4.DRAW_COLORS, 0x0431)
		for (let y = 0; y < 8; y++) {
			for (let x = 0; x < 10; x++) {
				if (pipeScene[y][x] == ".") continue
				if (pipeScene[y][x] == "-") w4.blit(RightPipe, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE, w4.BLIT_2BPP)
				if (pipeScene[y][x] == ")") w4.blit(ToRightDownPipe, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE, w4.BLIT_2BPP)
				if (pipeScene[y][x] == "(") w4.blit(ToDownRightPipe, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE, w4.BLIT_2BPP)
				if (pipeScene[y][x] == "|") w4.blit(DownPipe, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE, w4.BLIT_2BPP)
				if (pipeScene[y][x] == ">") w4.blit(ToTopRightPipe, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE, w4.BLIT_2BPP)
				if (pipeScene[y][x] == "o") w4.blit(Out, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE, w4.BLIT_2BPP)
			}
		}
	}

}