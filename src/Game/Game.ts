import * as w4 from "../wasm4"
import Machine from "./Machine"
import ScienceStand from "./ScienceStand"

import { Start, Tile } from "./Assets"
import { TILE_SIZE, WINDOW_SIZE, } from "../constants"

enum GameState {
	START,
	IN_GAME,
	GAME_OVER
}

export default class Game {
	private gameState: GameState
	private gameOver: boolean = false
	private balance: i16 = 500
	private prevGamepadState: u8
	private machines: Array<Machine> = [
		new Machine(0, 0),
		new Machine(0, 3),
		new Machine(0, 6)
	]

	private scienceStand: ScienceStand = new ScienceStand()
	private staticExpenses: Map<string, u8> = new Map<string, u8>()

	constructor() {
		this.gameState = GameState.START

		this.staticExpenses.set("rent", 150)
		this.staticExpenses.set("electricity", 25) // +25 for each working level 1 machine
	}

	setState(state: GameState): void {
		this.gameState = state
	}

	update(): void {
		if (this.gameState == GameState.START) {
			this.handleStartInput()
		} else if (this.gameState == GameState.IN_GAME) {
			this.updateGame()
		}
	}

	draw(): void {
		if (this.gameState == GameState.START) {
			this.drawStart()
		} else if (this.gameState == GameState.IN_GAME) {
			this.drawGame()
		}
	}

	/** START */

	handleStartInput(): void {
		const gamepad = load<u8>(w4.GAMEPAD1)
		const justPressed = gamepad & (gamepad ^ this.prevGamepadState)

		if (justPressed & w4.BUTTON_1) {
			this.setState(GameState.IN_GAME)
		}

		this.prevGamepadState = gamepad
	}

	drawStart(): void {
		store<u16>(w4.DRAW_COLORS, 0x4321)
		w4.blit(Start, 0, 0, WINDOW_SIZE, WINDOW_SIZE, w4.BLIT_2BPP)

		store<u16>(w4.DRAW_COLORS, 0x0032)
		w4.rect(10, 71, 140, 15)

		store<u16>(w4.DRAW_COLORS, 0x0004)
		w4.text("Press X to start", 17, 75)

	}

	/** IN_GAME */

	drawGame(): void {
		store<u16>(w4.DRAW_COLORS, 0x0002)
		w4.rect(0, 0, 10 * TILE_SIZE, 8 * TILE_SIZE)
		store<u16>(w4.DRAW_COLORS, 0x0004)
		w4.rect(0, 8 * TILE_SIZE, 10 * TILE_SIZE, 2 * TILE_SIZE)

		for (let y = 0; y < 8; y += 1) {
			for (let x = 0; x < 10; x += 2) {
				let tempX = x
				if (y % 2)
					tempX = x + 1

				if (tempX > 9) continue

				store<u16>(w4.DRAW_COLORS, 0x0021)
				w4.blit(Tile, tempX * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE, w4.BLIT_1BPP)
			}
		}

		this.machines.forEach(machine => machine.draw())
		this.scienceStand.draw()
	}

	updateGame(): void { }

	/** GAME_OVER */

	/** EXTRAS */

	finishDay(): void { } // calculate the balance and reset everything
}