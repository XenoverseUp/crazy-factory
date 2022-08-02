import * as w4 from "../wasm4"
import Machine from "./Machine"
import ScienceStand from "./ScienceStand"
import Point from "./Point"

import { ConfigureText, Start, Tile } from "./Assets"
import { TILE_SIZE, WINDOW_SIZE, } from "../constants"
import { SelectionHandler, Selection } from "./SelectionHandler"
import { pixel } from "../utils"

enum GameState {
	START,
	IN_GAME,
	GAME_OVER
}

export default class Game {
	private gameState: GameState
	private prevGamepadState: u8
	private gameOver: boolean = false
	private balance: i16 = 500
	private machines: Array<Machine> = [
		new Machine(0, new Point(0, 0)),
		new Machine(1, new Point(0, 3)),
		new Machine(2, new Point(0, 6))
	]
	private scienceStand: ScienceStand = new ScienceStand()
	private staticExpenses: Map<string, u8> = new Map<string, u8>()
	private selectionHandler: SelectionHandler = new SelectionHandler()


	constructor() {
		this.gameState = GameState.START

		this.staticExpenses.set("rent", 150)
		this.staticExpenses.set("electricity", 25) // +25 for each working level 1 machine
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


	updateGame(): void {
		this.handleGameInput()
		this.selectionHandler.updateSelection()
	}

	drawGame(): void {
		store<u16>(w4.DRAW_COLORS, 0x0002)
		w4.rect(0, 0, 10 * TILE_SIZE, 8 * TILE_SIZE)
		this.drawSelectionPanel()


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

		this.selectionHandler.drawSelection()
		this.machines.forEach(machine => machine.draw())
		Machine.drawPipes()
		this.scienceStand.draw()
		if (!SelectionHandler.selected) this.drawSelectionName()
		else this.drawControlPanel()
		this.printBalance()
	}

	handleGameInput(): void {
		const gamepad = load<u8>(w4.GAMEPAD1)
		const justPressed = gamepad & (gamepad ^ this.prevGamepadState)


		if (SelectionHandler.selected) {
			if (this.selectionHandler.selection == Selection.SCIENCE_STAND) this.scienceStand.handleControlPanelInput(justPressed)
			else this.machines[this.selectionHandler.selection].handleControlPanelInput(justPressed)
		} else this.selectionHandler.handleSelectionInput(justPressed)

		this.prevGamepadState = gamepad
	}

	drawSelectionPanel(): void {
		store<u16>(w4.DRAW_COLORS, 0x0004)
		w4.rect(0, 8 * TILE_SIZE, 10 * TILE_SIZE, 2 * TILE_SIZE)

		store<u16>(w4.DRAW_COLORS, 0x0003)
		w4.line(3, 8 * TILE_SIZE + 2, WINDOW_SIZE - 4, 8 * TILE_SIZE + 2)
		w4.line(3, 10 * TILE_SIZE - 2, WINDOW_SIZE - 4, 10 * TILE_SIZE - 2)
		w4.line(2, 8 * TILE_SIZE + 3, 2, WINDOW_SIZE - 3)
		w4.line(WINDOW_SIZE - 3, 8 * TILE_SIZE + 3, WINDOW_SIZE - 3, WINDOW_SIZE - 3)
		w4.rect(0, 9 * TILE_SIZE - 4, 2, 8)
		w4.rect(WINDOW_SIZE - 2, 9 * TILE_SIZE - 4, 2, 8)
		pixel(new Point(1, 9 * TILE_SIZE - 5))
		pixel(new Point(1, 9 * TILE_SIZE + 4))
		pixel(new Point(WINDOW_SIZE - 2, 9 * TILE_SIZE - 5))
		pixel(new Point(WINDOW_SIZE - 2, 9 * TILE_SIZE + 4))
		w4.vline(5, 8 * TILE_SIZE + 3, 2)
		w4.hline(3, 8 * TILE_SIZE + 5, 2)
		w4.vline(WINDOW_SIZE - 6, 8 * TILE_SIZE + 3, 2)
		w4.hline(WINDOW_SIZE - 5, 8 * TILE_SIZE + 5, 2)
		w4.vline(5, WINDOW_SIZE - 4, 2)
		w4.hline(3, WINDOW_SIZE - 5, 2)
		w4.vline(WINDOW_SIZE - 6, WINDOW_SIZE - 4, 2)
		w4.hline(WINDOW_SIZE - 5, WINDOW_SIZE - 5, 2)
	}

	drawSelectionName(): void {
		store<u16>(w4.DRAW_COLORS, 0x0001)
		if (this.selectionHandler.selection == Selection.MACHINE_1) {
			w4.text("Machine 1", 46, 136)
		} else if (this.selectionHandler.selection == Selection.MACHINE_2) {
			w4.text("Machine 2", 46, 136)
		} else if (this.selectionHandler.selection == Selection.MACHINE_3) {
			w4.text("Machine 3", 46, 136)
		} else if (this.selectionHandler.selection == Selection.SCIENCE_STAND) {
			w4.text("Science Stand", 29, 136)
		}

		w4.blit(ConfigureText, 42, 148, 80, 5, w4.BLIT_1BPP)
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

	drawControlPanel(): void {
		store<u16>(w4.DRAW_COLORS, 0x0001)

		if (this.selectionHandler.selection == Selection.SCIENCE_STAND) {
			return this.scienceStand.drawControlPanel()
		}

		this.machines[this.selectionHandler.selection].drawControlPanel()
	}


	/** GAME_OVER */

	/** EXTRAS */

	setState(state: GameState): void {
		this.gameState = state
	}


	finishDay(): void { } // calculate the balance and reset everything
}