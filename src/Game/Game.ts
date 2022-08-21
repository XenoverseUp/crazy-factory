import * as w4 from "../wasm4"
import Machine from "./Machine"
import ScienceStand from "./ScienceStand"
import Point from "./Point"


import { Back, ConfigureText, Info, Start, Tile } from "./Assets"
import { TILE_SIZE, WINDOW_SIZE, } from "../constants"
import { SelectionHandler, Selection } from "./SelectionHandler"
import { number, pixel, withSign } from "../utils"
import Shop from "./Shop"
import Synth from "./Synth"

enum GameState {
	START,
	IN_GAME,
	INFO,
	GAME_OVER
}

export default class Game {
	static balance: i16 = 1500
	static satisfaction: i64 = 21000
	private gameState: GameState
	private prevGamepadState: u8
	private machines: Array<Machine> = [
		new Machine(0, new Point(0, 0)),
		new Machine(1, new Point(0, 3)),
		new Machine(2, new Point(0, 6))
	]
	private scienceStand: ScienceStand = new ScienceStand()
	private shop: Shop = new Shop()
	private selectionHandler: SelectionHandler = new SelectionHandler()
	private frame: u8 = 0
	private hasShownInfo: boolean = false
	private infoCounter: u16 = 0
	static melody1: Synth = new Synth(80)
	static bass: Synth = new Synth(80, w4.TONE_TRIANGLE)
	static percussion: Synth = new Synth(80, w4.TONE_NOISE)

	constructor() {
		this.gameState = GameState.START

		this.setArpeggio()
		Game.melody1
			.loop()

		this.setBass()
		Game.bass.loop()

		this.setPercussion()
		Game.percussion.loop()

	}


	update(): void {
		Game.melody1.update()
		Game.bass.update()
		Game.percussion.update()

		if (this.gameState == GameState.START) {
			this.handleStartInput()
		} else if (this.gameState == GameState.IN_GAME) {
			this.updateGame()
		} else if (this.gameState == GameState.INFO) {
			this.updateInfo()
		}
	}

	draw(): void {
		if (this.gameState == GameState.START) {
			this.drawStart()
		} else if (this.gameState == GameState.IN_GAME) {
			this.drawGame()
		} else if (this.gameState == GameState.INFO) {
			this.drawInfo()
		} else if (this.gameState == GameState.GAME_OVER) {
			this.drawGameOver()
		}
	}

	/** START */

	handleStartInput(): void {
		const gamepad = load<u8>(w4.GAMEPAD1)
		const justPressed = gamepad & (gamepad ^ this.prevGamepadState)

		if (justPressed & w4.BUTTON_1) {
			Game.melody1.stop()
			Game.bass.stop()
			Game.percussion.stop()
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
		this.frame++
		if (!this.hasShownInfo) this.infoCounter++

		if (this.frame % 3 == 0) {
			Game.satisfaction += this.calculateSatisfactionDiff()
			if (Game.satisfaction > 24000) Game.satisfaction = 24000
			if (Game.satisfaction < 20) Game.satisfaction = 20
			this.frame = 0
		}


		if (this.machines.some(machine => machine.isWorking)) ScienceStand.frameSinceLastUpgrade++

		for (let i = 0; i < this.machines.length; i++) {
			this.machines[i].update()
			this.machines[i].productPrice = this.scienceStand.productPrices[i]
		}


		this.scienceStand.machineLevels = this.machines.map<u8>(machine => machine.level)
		this.scienceStand.update()
		this.scienceStand.isPackaging = this.machines[0].isWorking || this.machines[1].isWorking || this.machines[2].isWorking

		this.shop.update()

		this.selectionHandler.updateSelection()

		if (SelectionHandler.selected) this.updateControlPanel()

		if (this.infoCounter == 1800) {
			this.gameState = GameState.INFO
			this.infoCounter = 0
			this.hasShownInfo = true
		}
		if (Game.balance < -50) this.gameState = GameState.GAME_OVER
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
		Machine.drawPipes()
		this.machines.forEach(machine => machine.draw())
		this.scienceStand.draw()
		this.shop.draw()
		if (!SelectionHandler.selected) this.drawSelectionName()
		else this.drawControlPanel()
		this.printBalance()
	}

	handleGameInput(): void {
		const gamepad = load<u8>(w4.GAMEPAD1)
		const justPressed = gamepad & (gamepad ^ this.prevGamepadState)


		if (this.gameState != GameState.INFO) {
			if (SelectionHandler.selected) {
				if (this.selectionHandler.selection == Selection.SCIENCE_STAND) this.scienceStand.handleInput(justPressed)
				else if (this.selectionHandler.selection == Selection.SHOP) this.shop.handleInput(justPressed)
				else this.machines[this.selectionHandler.selection].handleControlPanelInput(justPressed)

			} else this.selectionHandler.handleSelectionInput(justPressed)
		} else if (this.gameState == GameState.INFO && (justPressed & w4.BUTTON_2)) this.gameState = GameState.IN_GAME


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
		} else if (this.selectionHandler.selection == Selection.SHOP) {
			w4.text("Shop", 64, 136)
		}

		w4.blit(ConfigureText, 42, 148, 80, 5, w4.BLIT_1BPP)
	}

	printBalance(): void {
		let balanceSign: String = '+'
		if (Game.balance < 0) {
			balanceSign = '-'
		}

		store<u16>(w4.DRAW_COLORS, 0x0004)
		withSign(balanceSign, `$${u16(NativeMath.abs(Game.balance))}`, new Point(60, 5))
	}

	updateControlPanel(): void {
		if (this.selectionHandler.selection == Selection.SCIENCE_STAND) {
			return this.scienceStand.updateControlPanel()
		} else if (this.selectionHandler.selection == Selection.SHOP) {
			return this.shop.updateControlPanel()
		}

		this.machines[this.selectionHandler.selection].updateControlPanel()

	}

	drawControlPanel(): void {
		store<u16>(w4.DRAW_COLORS, 0x0001)

		if (this.selectionHandler.selection == Selection.SCIENCE_STAND) {
			return this.scienceStand.drawControlPanel()
		} else if (this.selectionHandler.selection == Selection.SHOP) {
			return this.shop.drawControlPanel()
		}

		this.machines[this.selectionHandler.selection].drawControlPanel()
	}

	/** INFO */

	updateInfo(): void {
		this.handleGameInput()
	}

	drawInfo(): void {
		store<u16>(w4.DRAW_COLORS, 0x4)
		w4.rect(0, 0, WINDOW_SIZE, WINDOW_SIZE)

		store<u16>(w4.DRAW_COLORS, 0x0321)
		w4.blit(Back, 5, 5, 44, 10, w4.BLIT_2BPP)

		store<u16>(w4.DRAW_COLORS, 0x2)
		w4.text("Wait a minute!", 24, 30)

		store<u16>(w4.DRAW_COLORS, 0x1)
		w4.blit(Info, 8, 50, 144, 66, w4.BLIT_2BPP)
	}


	/** GAME_OVER */



	drawGameOver(): void {
		store<u16>(w4.DRAW_COLORS, 0x4)
		w4.rect(0, 0, WINDOW_SIZE, WINDOW_SIZE)

		store<u16>(w4.DRAW_COLORS, 0x2)
		w4.text("Game Over", 44, 76)

	}



	/** EXTRAS */

	setState(state: GameState): void {
		this.gameState = state
	}


	calculateSatisfactionDiff(): i16 {
		let diff: f64 = 0

		// Product Price Related
		const minRevenue: f64 = f64(this.machines.reduce((acc, mac) => acc + (mac.isWorking ? mac.level : 0), 0))
		const maxRevenue: f64 = minRevenue * 4.0
		const currentRevenue: f64 = f64(this.machines.reduce((acc, mac) => acc + (mac.isWorking ? mac.productPrice : 0), 0))

		if (f64(currentRevenue) / f64(maxRevenue) > 0.75) diff -= 1
		else if (f64(currentRevenue) / f64(maxRevenue) <= 0.4) diff += 1


		// // // Production Speed Related
		const totalProduction: u8 = u8(this.machines.reduce((acc, mac) => acc + (mac.isWorking ? mac.ppd : 0), 0))

		if (totalProduction > 18) diff -= 1
		else if (totalProduction >= 9) diff += 1


		// Upgrade related issues
		if (ScienceStand.frameSinceLastUpgrade > 3600 * 2 && this.machines.some(machine => machine.isWorking) && ScienceStand.upgradeLevel != 4) diff -= 3



		return i16(diff)
	}


	setArpeggio(): void {
		Game.melody1
			.F(5, "quarter", 100)
			.D(5, "quarter", 100)
			.A(4, "quarter", 100)
			.D(5, "quarter", 100)
			.F(5, "quarter", 100)
			.D(5, "quarter", 100)
			.A(4, "quarter", 100)
			.D(5, "quarter", 100)

			.F(5, "quarter", 100)
			.C(5, "quarter", 100)
			.A(4, "quarter", 100)
			.C(5, "quarter", 100)
			.F(5, "quarter", 100)
			.C(5, "quarter", 100)
			.A(4, "quarter", 100)
			.C(5, "quarter", 100)

			.E(5, "quarter", 100)
			.Cs(5, "quarter", 100)
			.A(4, "quarter", 100)
			.Cs(5, "quarter", 100)
			.E(5, "quarter", 100)
			.Cs(5, "quarter", 100)
			.A(4, "quarter", 100)
			.Cs(5, "quarter", 100)

			.E(5, "quarter", 100)
			.Cs(5, "quarter", 100)
			.A(4, "quarter", 100)
			.Cs(5, "quarter", 100)
			.E(5, "quarter", 100)
			.Cs(5, "quarter", 100)
			.A(4, "quarter", 100)
			.Cs(5, "quarter", 100)
	}

	setBass(): void {
		Game.bass
			.D(4, "double", 25)
			.F(4, "double", 25)
			.A(3, "full", 25)
			.Cs(4, "full", 25)
			.A(4, "full", 25)
			.Cs(4, "full", 25)
	}

	setPercussion(): void {
		Game.percussion
			.A(5, "quarter", 50)
			.A(5, "quarter", 0)
			.A(5, "half", 0)
			.A(5, "quarter", 50)
			.A(5, "quarter", 0)
			.A(5, "half", 0)
			.A(5, "half", 50)
			.A(5, "half", 50)
			.A(5, "half", 0)
			.A(5, "half", 50)

	}
}