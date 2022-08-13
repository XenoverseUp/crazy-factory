import * as w4 from "../wasm4"
import { DefaultPrompts, DownPipe, Machine as MachineSprite, OnOff, Out, ResearchToUpgrade, RightPipe, ToDownRightPipe, ToRightDownPipe, ToTopRightPipe, Upgrade } from "./Assets"
import { TILE_SIZE } from "../constants"
import Point from "./Point"
import { SelectionHandler } from "./SelectionHandler"
import { number, pixel, upgradeCosts, vtriangle } from "../utils"
import Game from "./Game"
import ScienceStand from "./ScienceStand"
import Package from "./Package"

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

enum ControlPanelSelection {
	POWER = 0,
	UPGRADE,
	PPD
}

export default class Machine {
	public id: u8
	private level: u8 = 1
	public isWorking: boolean = false
	private canUpgrade: boolean = false
	private position: Point<u8>
	public ppd: u8 = 4
	private selection: ControlPanelSelection = ControlPanelSelection.POWER
	private selectionPosition: Point<u8> = new Point(17, 130)
	private selectionDestinations: Map<ControlPanelSelection, Point<i16>> = new Map<ControlPanelSelection, Point<i16>>()
	private packages: Array<Package> = []
	private frameCount: u8 = 0

	constructor(id: u8, position: Point<u8>) {
		this.id = id
		this.position = position

		this.selectionDestinations.set(ControlPanelSelection.POWER, new Point(17, 130))
		this.selectionDestinations.set(ControlPanelSelection.UPGRADE, new Point(77, 130))
		this.selectionDestinations.set(ControlPanelSelection.PPD, new Point(138, 130))
	}

	update(): void {
		this.packages.forEach(pkg => pkg.update())
		if (++this.frameCount == u8(NativeMath.floor(480 / this.ppd))) {
			this.frameCount = 0
			if (this.isWorking) this.packages.push(new Package(this.id))
		}

		for (let i = 0; i < this.packages.length; i++)
			this.packages.at(i).speed = this.ppd - 2

		this.packages = this.packages.filter(pkg => pkg.position.x < 7 * TILE_SIZE)
	}

	draw(): void {
		this.packages.forEach(pkg => pkg.draw())
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

	handleControlPanelInput(justPressed: u8): void {
		if (justPressed & w4.BUTTON_2) {
			SelectionHandler.selected = false
			this.selection = ControlPanelSelection.POWER
			this.selectionPosition = this.selectionDestinations.get(ControlPanelSelection.POWER).toU8()
		} else if ((justPressed & w4.BUTTON_RIGHT) && this.selection != ControlPanelSelection.PPD) this.selection += 1
		else if ((justPressed & w4.BUTTON_LEFT) && this.selection != ControlPanelSelection.POWER) this.selection -= 1


		if (justPressed & w4.BUTTON_1) {
			if (this.selection == ControlPanelSelection.POWER) {
				this.isWorking = !this.isWorking
			}
		}

		if (this.selection == ControlPanelSelection.PPD) {
			if (justPressed & w4.BUTTON_UP) this.increasePPM()
			if (justPressed & w4.BUTTON_DOWN) this.decreasePPM()
		}
	}

	updateControlPanel(): void {
		this.canUpgrade = (ScienceStand.upgradeLevel > this.level && Game.balance > upgradeCosts[this.level - 1] && this.level < 4) ? true : false

		const selectionSpeedX: u8 = u8(NativeMathf.ceil(NativeMathf.abs(
			this.selectionDestinations.get(this.selection).x - this.selectionPosition.x
		) / 5))



		if ((this.selectionDestinations.get(this.selection).x - this.selectionPosition.x > 0)) {
			this.selectionPosition.x += selectionSpeedX
		} else if ((this.selectionDestinations.get(this.selection).x - this.selectionPosition.x < 0)) {
			this.selectionPosition.x -= selectionSpeedX
		}
	}

	drawControlPanel(): void {
		this.drawInfo()
		this.drawSelection()

		const gamepad = load<u8>(w4.GAMEPAD1)
		store<u16>(w4.DRAW_COLORS, 0x0002)
		if (((gamepad & w4.BUTTON_UP) && this.selection == ControlPanelSelection.PPD) || this.ppd == 8) {
			store<u16>(w4.DRAW_COLORS, 0x0003)
		}
		vtriangle(new Point(130, 141), true)
		store<u16>(w4.DRAW_COLORS, 0x0002)
		if (((gamepad & w4.BUTTON_DOWN) && this.selection == ControlPanelSelection.PPD) || this.ppd == 2) {
			store<u16>(w4.DRAW_COLORS, 0x0003)
		}
		vtriangle(new Point(130, 147), false)
		store<u16>(w4.DRAW_COLORS, 0x0030)
		store<u16>(w4.DRAW_COLORS, 0x0001)
		w4.text(this.ppd.toString(), 143, 141)


		// On Off Button
		const offsetPower: u8 = ((gamepad & w4.BUTTON_1) && this.selection == ControlPanelSelection.POWER) ? 1 : 0

		store<u16>(w4.DRAW_COLORS, 0x0003)
		w4.hline(10, 153, 21)
		w4.hline(10, 154, 21)
		store<u16>(w4.DRAW_COLORS, 0x0002)
		w4.rect(10, 135 + offsetPower, 21, 18)
		store<u16>(w4.DRAW_COLORS, 0x0004)
		pixel(new Point(10, 135 + offsetPower))
		pixel(new Point(30, 135 + offsetPower))
		store<u16>(w4.DRAW_COLORS, 0x0010)
		if (this.isWorking) {
			w4.blitSub(OnOff, 16, 137 + offsetPower, 4, 5, 0, 0, 16, w4.BLIT_1BPP)
			w4.blitSub(OnOff, 21, 137 + offsetPower, 4, 5, 5, 0, 16, w4.BLIT_1BPP)
			store<u16>(w4.DRAW_COLORS, 0x0031)
		}
		else {
			w4.blitSub(OnOff, 14, 137 + offsetPower, 4, 5, 0, 0, 16, w4.BLIT_1BPP)
			w4.blitSub(OnOff, 19, 137 + offsetPower, 4, 5, 10, 0, 16, w4.BLIT_1BPP)
			w4.blitSub(OnOff, 24, 137 + offsetPower, 4, 5, 10, 0, 16, w4.BLIT_1BPP)
			store<u16>(w4.DRAW_COLORS, 0x0043)
		}
		w4.oval(18, 145 + offsetPower, 4, 4)

		// Upgrade Button

		const offsetUpgrade: u8 = ((gamepad & w4.BUTTON_1) && this.selection == ControlPanelSelection.UPGRADE && this.canUpgrade) ? 1 : 0


		store<u16>(w4.DRAW_COLORS, 0x0003)
		w4.hline(58, 149, 44)
		w4.hline(58, 150, 44)
		store<u16>(w4.DRAW_COLORS, 0x0002)
		w4.rect(58, 138 + offsetUpgrade, 44, 11)
		if (this.canUpgrade) store<u16>(w4.DRAW_COLORS, 0x0001)
		else store<u16>(w4.DRAW_COLORS, 0x0003)
		w4.blit(Upgrade, 63, 141 + offsetUpgrade, 40, 5, w4.BLIT_1BPP)
	}

	drawSelection(): void {
		store<u16>(w4.DRAW_COLORS, 0x0001)
		vtriangle(new Point(this.selectionPosition.x, this.selectionPosition.y), false)
	}

	drawInfo(): void {
		store<u16>(w4.DRAW_COLORS, 0x4)
		w4.rect(0, 8 * TILE_SIZE - 15, 160, 15)


		store<u16>(w4.DRAW_COLORS, 0x0001)
		if (this.selection == ControlPanelSelection.POWER) w4.blitSub(DefaultPrompts, 62, 8 * TILE_SIZE - 9, 34, 5, 0, 0, 144, w4.BLIT_1BPP)
		if (this.selection == ControlPanelSelection.PPD) w4.blitSub(DefaultPrompts, 25, 8 * TILE_SIZE - 9, 109, 5, 35, 0, 144, w4.BLIT_1BPP)
		if (this.selection == ControlPanelSelection.UPGRADE) {
			if (!this.canUpgrade) w4.blit(ResearchToUpgrade, 9, 8 * TILE_SIZE - 9, 144, 5, w4.BLIT_1BPP)
		}
	}

	increasePPM(): void {
		if (this.ppd < 8) this.ppd++
	}

	decreasePPM(): void {
		if (this.ppd > 2) this.ppd--
	}


}