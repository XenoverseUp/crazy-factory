import * as w4 from "../wasm4"
import Machine from "./Machine"
import ScienceStand from "./ScienceStand"

import { ConfigureText, Start, Tile } from "./Assets"
import { TILE_SIZE, WINDOW_SIZE, } from "../constants"
import { Point } from "../utils"

enum GameState {
	START,
	IN_GAME,
	GAME_OVER
}

enum Selection {
	MACHINE_1 = 0,
	MACHINE_2 = 1,
	MACHINE_3 = 2,
	SCIENCE_STAND = 3,
}

export default class Game {
	private gameState: GameState

	private selection: Selection = Selection.MACHINE_1
	private selectionDestinations: Map<Selection, Point<i16>> = new Map<Selection, Point<i16>>()
	private selectionPosition: Point<u16> = new Point(0, 0)
	private selectionLength: u16 = 32
	private selected: boolean = false


	private prevGamepadState: u8
	private gameOver: boolean = false
	private balance: i16 = 500
	private machines: Array<Machine> = [
		new Machine(0, 0, 0),
		new Machine(1, 0, 3),
		new Machine(2, 0, 6)
	]

	private revenue: u16 = 2

	private frameCount: u32 = 0

	private scienceStand: ScienceStand = new ScienceStand()
	private staticExpenses: Map<string, u8> = new Map<string, u8>()

	constructor() {
		this.gameState = GameState.START

		this.selectionDestinations.set(Selection.MACHINE_1, new Point(0, 0))
		this.selectionDestinations.set(Selection.MACHINE_2, new Point(0, 3 * TILE_SIZE))
		this.selectionDestinations.set(Selection.MACHINE_3, new Point(0, 6 * TILE_SIZE))
		this.selectionDestinations.set(Selection.SCIENCE_STAND, new Point(7 * TILE_SIZE, 5 * TILE_SIZE))

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
			this.frameCount++
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

		this.drawSelection()
		this.machines.forEach(machine => machine.draw())
		Machine.drawPipes()
		this.scienceStand.draw()
		if (!this.selected) this.drawSelectionPanel()
		else this.drawControlPanel()
		this.printBalance()

	}

	updateGame(): void {
		this.handleGameInput()
		if (this.frameCount % 60 == 0) {
			this.balance += this.revenue
		}
	}

	handleGameInput(): void {
		const gamepad = load<u8>(w4.GAMEPAD1)
		const justPressed = gamepad & (gamepad ^ this.prevGamepadState)

		if (!this.selected) {
			if (justPressed & w4.BUTTON_DOWN) {
				if (!([Selection.SCIENCE_STAND, Selection.MACHINE_3].includes(this.selection))) {
					this.selection = this.selection + 1
				}
			}
			else if (justPressed & w4.BUTTON_UP) {
				if (!([Selection.SCIENCE_STAND, Selection.MACHINE_1].includes(this.selection))) {
					this.selection = this.selection - 1
				} else if (this.selection == Selection.SCIENCE_STAND) {
					this.selection = Selection.MACHINE_1
				}
			}
			else if (justPressed & w4.BUTTON_RIGHT) {
				this.selection = Selection.SCIENCE_STAND
			}
			else if (justPressed & w4.BUTTON_LEFT) {
				if (this.selection == Selection.SCIENCE_STAND) {
					this.selection = Selection.MACHINE_3
				}
			}

			if (justPressed & w4.BUTTON_2) {
				this.selected = true
			}
		}
		this.prevGamepadState = gamepad
	}

	drawSelection(): void {
		store<u16>(w4.DRAW_COLORS, 0x0040)

		const selectionSpeedX: u16 = u16(NativeMathf.ceil(NativeMathf.abs(
			this.selectionDestinations.get(this.selection).x - this.selectionPosition.x
		) / 5))
		const selectionSpeedY: u16 = u16(NativeMathf.ceil(NativeMathf.abs(
			this.selectionDestinations.get(this.selection).y - this.selectionPosition.y
		) / 5))
		const growSpeed: u16 = u16(NativeMathf.ceil(NativeMathf.abs(
			(this.selection == Selection.SCIENCE_STAND ? 48 : 32) - this.selectionLength
		) / 5))

		w4.rect(this.selectionPosition.x, this.selectionPosition.y, this.selectionLength, this.selectionLength)

		if ((this.selectionDestinations.get(this.selection).x - this.selectionPosition.x > 0)) {
			this.selectionPosition.x += selectionSpeedX
		} else if ((this.selectionDestinations.get(this.selection).x - this.selectionPosition.x < 0)) {
			this.selectionPosition.x -= selectionSpeedX
		}

		if ((this.selectionDestinations.get(this.selection).y - this.selectionPosition.y > 0)) {
			this.selectionPosition.y += selectionSpeedY
		} else if ((this.selectionDestinations.get(this.selection).y - this.selectionPosition.y < 0)) {
			this.selectionPosition.y -= selectionSpeedY
		}

		if (this.selection == Selection.SCIENCE_STAND && this.selectionLength < 48) {
			this.selectionLength += growSpeed
		} else if (!(this.selection == Selection.SCIENCE_STAND) && this.selectionLength > 32) {
			this.selectionLength -= growSpeed
		}

	}

	drawSelectionPanel(): void {
		store<u16>(w4.DRAW_COLORS, 0x0001)
		if (this.selection == Selection.MACHINE_1) {
			w4.text("Machine 1", 46, 136)
		} else if (this.selection == Selection.MACHINE_2) {
			w4.text("Machine 2", 46, 136)
		} else if (this.selection == Selection.MACHINE_3) {
			w4.text("Machine 3", 46, 136)
		} else if (this.selection == Selection.SCIENCE_STAND) {
			w4.text("Science Stand", 29, 136)
		}

		w4.blit(ConfigureText, 42, 150, 80, 5, w4.BLIT_1BPP)
	}

	drawControlPanel(): void {
		store<u16>(w4.DRAW_COLORS, 0x0001)
		w4.text("Oh Jesus! Fuck", 26, 136)
	}


	printBalance(): void {
		let balanceSign = ""
		if (this.balance > 0) {
			balanceSign = "+"
		} else if (this.balance < 0) {
			balanceSign = "-"
		}

		store<u16>(w4.DRAW_COLORS, 0x0004)
		w4.text(`${balanceSign}$${this.balance}`, 117, 5)
	}

	/** GAME_OVER */

	/** EXTRAS */

	finishDay(): void { } // calculate the balance and reset everything
}