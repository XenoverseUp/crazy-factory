import * as w4 from "../wasm4"
import { DefaultPrompts, DownPipe, Machine as MachineSprite, MachineUpgrade, Max, OnOff, Out, ResearchToUpgrade, RightPipe, Shop, Skin1, Skin2, Smoke, ToDownRightPipe, ToRightDownPipe, ToTopRightPipe, Upgrade, UpgradePrompt, VagueSkin } from "./Assets"
import { TILE_SIZE } from "../constants"
import Point from "./Point"
import { SelectionHandler } from "./SelectionHandler"
import { number, pixel, upgradeCosts, vtriangle } from "../utils"
import Game from "./Game"
import ScienceStand from "./ScienceStand"
import Package from "./Package"
import ShopClass from "./Shop"

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

export enum Skin {
	DEFAULT,
	ROUND,
	VAGUE
}

export default class Machine {
	static skin: Skin = Skin.DEFAULT
	public id: u8
	public level: u8 = 1
	public isWorking: boolean = false
	private canUpgrade: boolean = false
	private position: Point<u8>
	public ppd: u8 = 4
	private selection: ControlPanelSelection = ControlPanelSelection.POWER
	private selectionPosition: Point<u8> = new Point(17, 130)
	private selectionDestinations: Map<ControlPanelSelection, Point<i16>> = new Map<ControlPanelSelection, Point<i16>>()
	private packages: Array<Package> = []
	public productPrice: u8 = 3
	public productCost: u8 = 2 * this.level

	private frameCount: u8 = 0
	private smokeCount: u8 = 0


	constructor(id: u8, position: Point<u8>) {
		this.id = id
		this.position = position

		this.selectionDestinations.set(ControlPanelSelection.POWER, new Point(17, 130))
		this.selectionDestinations.set(ControlPanelSelection.UPGRADE, new Point(77, 130))
		this.selectionDestinations.set(ControlPanelSelection.PPD, new Point(138, 130))
	}

	update(): void {
		this.productCost = 2 * this.level
		this.packages.forEach(pkg => pkg.update())
		if (++this.frameCount == u8(NativeMath.floor(480 / this.ppd))) {
			this.frameCount = 0
			if (this.isWorking) {
				this.packages.push(new Package(this.id))
				if (!ShopClass.depulso)
					Game.balance -= this.productCost // Cost
			}
		}

		if (this.isWorking) this.smokeCount++
		if (this.smokeCount == 30) this.smokeCount = 0

		for (let i = 0; i < this.packages.length; i++)
			this.packages.at(i).speed = this.ppd - 2

		const initialLength: u8 = u8(this.packages.length)
		this.packages = this.packages.filter(pkg => pkg.position.x < 7 * TILE_SIZE)
		const finalLength: u8 = u8(this.packages.length)
		const sold = initialLength - finalLength
		Game.balance += i16(sold * this.productPrice) - (Game.satisfaction < 15000 && sold ? i16(f64(this.productPrice) / f64(4)) : Game.satisfaction < 10000 && sold ? i16(f64(this.productPrice) / f64(2)) : 0) // Price
	}

	draw(): void {
		this.packages.forEach(pkg => pkg.draw())
		store<u16>(w4.DRAW_COLORS, 0x0432)
		const mch = Machine.skin == Skin.DEFAULT ? MachineSprite : Machine.skin == Skin.ROUND ? Skin1 : Skin2
		w4.blit(mch, this.position.x * TILE_SIZE, this.position.y * TILE_SIZE, 2 * TILE_SIZE, 2 * TILE_SIZE, w4.BLIT_2BPP)

		store<u16>(w4.DRAW_COLORS, 0x0001)
		if (!this.isWorking) w4.text("!", this.position.x * TILE_SIZE + 7, this.position.y * TILE_SIZE + 13)
		else {
			w4.text(this.level.toString(), this.position.x * TILE_SIZE + 7, this.position.y * TILE_SIZE + 13)
			store<u16>(w4.DRAW_COLORS, 0x4)
			w4.blitSub(Smoke, (this.position.x + 1) * TILE_SIZE - 5, this.position.y * TILE_SIZE, 6, 3, u8(this.smokeCount > 15) * 6, 0, 16, w4.BLIT_1BPP)
		}


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
			Game.bass.reset().noLoop().A(4, "quarter", 50).play()
		} else if ((justPressed & w4.BUTTON_RIGHT) && this.selection != ControlPanelSelection.PPD) this.selection += 1
		else if ((justPressed & w4.BUTTON_LEFT) && this.selection != ControlPanelSelection.POWER) this.selection -= 1


		if (justPressed & w4.BUTTON_1) {
			if (this.selection == ControlPanelSelection.POWER) {
				Game.percussion.reset().noLoop().A(5, "quarter", 20).play()
				this.isWorking = !this.isWorking
			}

			if (this.selection == ControlPanelSelection.UPGRADE && this.canUpgrade && Game.balance > upgradeCosts[this.level - 1]) {
				Game.percussion.reset().noLoop().A(5, "quarter", 20).play()
				this.upgrade()
			}
		}

		if (this.selection == ControlPanelSelection.PPD) {
			if (justPressed & w4.BUTTON_UP) this.increasePPM()
			if (justPressed & w4.BUTTON_DOWN) this.decreasePPM()
		}
	}

	updateControlPanel(): void {
		this.canUpgrade = (ScienceStand.upgradeLevel > this.level && this.level < 4) ? true : false

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

		store<u16>(w4.DRAW_COLORS, 0x0321)
		w4.blit(MachineUpgrade, 60, 135, 40, 16, w4.BLIT_2BPP)

		if (this.level == 4) return
		store<u16>(w4.DRAW_COLORS, 0x3)
		number(`$${upgradeCosts[this.level - 1]}`, new Point(71, 145))
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
			if (this.level == 4) w4.blit(Max, 72, 8 * TILE_SIZE - 9, 16, 5, w4.BLIT_1BPP)
			else if (!this.canUpgrade) w4.blit(ResearchToUpgrade, 9, 8 * TILE_SIZE - 9, 144, 5, w4.BLIT_1BPP)
			else w4.blit(UpgradePrompt, 61, 8 * TILE_SIZE - 9, 48, 5, w4.BLIT_1BPP)
		}
	}

	increasePPM(): void {
		if (this.ppd < 8) this.ppd++
	}

	decreasePPM(): void {
		if (this.ppd > 2) this.ppd--
	}

	upgrade(): void {
		Game.balance -= upgradeCosts[this.level - 1]
		this.level++
	}
}