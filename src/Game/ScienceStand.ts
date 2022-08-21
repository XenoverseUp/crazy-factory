import * as w4 from "../wasm4"
import Game from "./Game"
import Package from "./Package"
import Machine from "./Machine"
import Point from "./Point"

import { TILE_SIZE } from "../constants"
import { htriangle, number, vtriangle } from "../utils"
import { Back, ConfigurePrices, Dollar, LevelText, ProductPrices, Research, Science, ScienceMachine, PackageBig, OnProgress, Package2Big, Package3Big } from "./Assets"
import { SelectionHandler } from "./SelectionHandler"

enum ControlPanelSelection {
	RESEARCH = 0,
	PRICES
}

enum PriceSelection {
	MACHINE_1 = 0,
	MACHINE_2,
	MACHINE_3
}

export default class ScienceStand {
	static upgradeLevel: u8 = 1
	private researchCosts: Uint16Array = new Uint16Array(4)
	private selection: ControlPanelSelection = ControlPanelSelection.RESEARCH
	private selectionPosition: Point<u8> = new Point(40, 130)
	private selectionDestinations: Map<ControlPanelSelection, Point<i16>> = new Map<ControlPanelSelection, Point<i16>>()
	private canResearch: boolean = false
	private packages: Array<Package> = []
	private frameCount: u8 = 0
	public isPackaging: boolean = false
	private packagingTimeout: u16 = 0
	private showPrices: boolean = false
	private isResearching: boolean = false
	public productPrices: Uint8Array = new Uint8Array(3)
	private priceSelection: PriceSelection = PriceSelection.MACHINE_1
	private priceSelectionPosition: Point<u8> = new Point(12, 56)
	private priceSelectionDestinations: Map<PriceSelection, Point<i16>> = new Map<PriceSelection, Point<i16>>()
	public machineLevels: Array<u8> = new Array<u8>(3)
	private researchCount: u16 = 0
	static frameSinceLastUpgrade: u32 = 0


	constructor() {
		this.researchCosts[0] = 500
		this.researchCosts[1] = 1000
		this.researchCosts[2] = 1500
		this.researchCosts[3] = 2000

		this.selectionDestinations.set(ControlPanelSelection.RESEARCH, new Point(40, 130))
		this.selectionDestinations.set(ControlPanelSelection.PRICES, new Point(123, 130))
		this.priceSelectionDestinations.set(PriceSelection.MACHINE_1, new Point(12, 56))
		this.priceSelectionDestinations.set(PriceSelection.MACHINE_2, new Point(12, 76))
		this.priceSelectionDestinations.set(PriceSelection.MACHINE_3, new Point(12, 96))

		this.productPrices[0] = 3
		this.productPrices[1] = 3
		this.productPrices[2] = 3

		this.machineLevels[0] = 1
		this.machineLevels[1] = 1
		this.machineLevels[2] = 1
	}

	draw(): void {
		this.packages.forEach(pkg => pkg.draw())
		store<u16>(w4.DRAW_COLORS, 0x0432)
		w4.blit(ScienceMachine, 7 * TILE_SIZE, 5 * TILE_SIZE, 48, 48, w4.BLIT_2BPP)
		store<u16>(w4.DRAW_COLORS, 0x0001)
		w4.text(ScienceStand.upgradeLevel.toString(), 8 * TILE_SIZE + 4, 6 * TILE_SIZE + 4)
		this.drawResearchProgress()
	}

	handleInput(justPressed: u8): void {
		if (this.showPrices) {
			if (justPressed & w4.BUTTON_2) {
				Game.bass.reset().noLoop().A(4, "quarter", 50).play()
				this.showPrices = false
			}
			else if ((justPressed & w4.BUTTON_DOWN) && this.priceSelection != PriceSelection.MACHINE_3) this.priceSelection++
			else if ((justPressed & w4.BUTTON_UP) && this.priceSelection != PriceSelection.MACHINE_1) this.priceSelection--
			else if ((justPressed & w4.BUTTON_RIGHT) && this.machineLevels[this.priceSelection] * 4 > this.productPrices[this.priceSelection]) this.productPrices[this.priceSelection]++
			else if ((justPressed & w4.BUTTON_LEFT) && this.machineLevels[this.priceSelection] < this.productPrices[this.priceSelection]) this.productPrices[this.priceSelection]--
		} else {
			if (justPressed & w4.BUTTON_RIGHT) {
				this.selection = ControlPanelSelection.PRICES
			} else if (justPressed & w4.BUTTON_LEFT) {
				this.selection = ControlPanelSelection.RESEARCH
			} else if (justPressed & w4.BUTTON_1) {

				if (this.selection == ControlPanelSelection.PRICES) {
					Game.percussion.reset().noLoop().A(5, "quarter", 20).play()
					this.showPrices = true
				}
				else if (this.selection == ControlPanelSelection.RESEARCH && !this.isResearching && this.canResearch) {
					Game.percussion.reset().noLoop().A(5, "quarter", 20).play()
					SelectionHandler.selected = false
					this.isResearching = true
					Game.balance -= this.researchCosts[ScienceStand.upgradeLevel - 1]
				}
			} else if (justPressed & w4.BUTTON_2) {
				SelectionHandler.selected = false
				this.selection = ControlPanelSelection.RESEARCH
				this.selectionPosition = this.selectionDestinations.get(ControlPanelSelection.RESEARCH).toU8()
				Game.bass.reset().noLoop().A(4, "quarter", 50).play()
			}

		}
	}

	update(): void {
		this.canResearch = (ScienceStand.upgradeLevel < 4 && Game.balance >= i16(this.researchCosts[ScienceStand.upgradeLevel - 1])) ? true : false
		this.packages.forEach(pkg => pkg.update())
		if (++this.frameCount == 90) {
			this.frameCount = 0
			if (this.isPackaging && this.packagingTimeout > 1000) this.packages.push(new Package(3))
		}

		for (let i = 0; i < this.packages.length; i++)
			this.packages.at(i).speed = 4

		this.packages = this.packages.filter(pkg => pkg.position.x < 10 * TILE_SIZE - 8)

		if (!this.isPackaging) this.packagingTimeout = 0
		if (!(this.packagingTimeout > 1000)) this.packagingTimeout++

		if (this.showPrices) this.updatePrices()
		if (this.isResearching) {
			this.researchCount++
			this.research()
		}


	}

	updateControlPanel(): void {
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
		if (!this.showPrices) this.drawInfo()
		else this.drawPrices()
		this.drawSelection()

		store<u16>(w4.DRAW_COLORS, 0x0321)
		w4.blit(Science, 18, 136, 16, 16, w4.BLIT_2BPP)
		if (ScienceStand.upgradeLevel < 4) {
			store<u16>(w4.DRAW_COLORS, 0x1)
			w4.blit(LevelText, 38, 138, 24, 5, w4.BLIT_1BPP)
			number((ScienceStand.upgradeLevel + 1).toString(), new Point(59, 138))
			store<u16>(w4.DRAW_COLORS, 0x0003)
			if (this.isResearching) w4.blit(OnProgress, 38, 146, 40, 5, w4.BLIT_1BPP)
			else number(`$${this.researchCosts[ScienceStand.upgradeLevel - 1]}`, new Point(38, 146))
		} else {
			store<u16>(w4.DRAW_COLORS, 0x0001)
			w4.text("Max", 40, 141)
		}


		store<u16>(w4.DRAW_COLORS, 0x0132)
		w4.blit(Dollar, 95, 139, 20, 10, w4.BLIT_2BPP)
		store<u16>(w4.DRAW_COLORS, 0x0003)
		w4.vline(94, 140, 10)
		w4.hline(94, 149, 20)

		store<u16>(w4.DRAW_COLORS, 0x1)
		w4.blit(ProductPrices, 120, 141, 24, 5, w4.BLIT_1BPP)


	}

	drawSelection(): void {
		store<u16>(w4.DRAW_COLORS, 0x0001)
		vtriangle(new Point(this.selectionPosition.x, this.selectionPosition.y), false)
	}


	drawInfo(): void {
		store<u16>(w4.DRAW_COLORS, 0x4)
		w4.rect(0, 8 * TILE_SIZE - 15, 160, 15)

		store<u16>(w4.DRAW_COLORS, 0x1)
		if (this.selection == ControlPanelSelection.RESEARCH) w4.blit(Research, 61, 8 * TILE_SIZE - 9, 48, 5, w4.BLIT_1BPP)
		store<u16>(w4.DRAW_COLORS, 0x10)
		if (this.selection == ControlPanelSelection.PRICES) w4.blit(ConfigurePrices, 44, 8 * TILE_SIZE - 9, 72, 5, w4.BLIT_1BPP)
	}

	updatePrices(): void {
		const selectionSpeedY: u8 = u8(NativeMathf.ceil(NativeMathf.abs(
			this.priceSelectionDestinations.get(this.priceSelection).y - this.priceSelectionPosition.y
		) / 5))



		if ((this.priceSelectionDestinations.get(this.priceSelection).y - this.priceSelectionPosition.y > 0)) {
			this.priceSelectionPosition.y += selectionSpeedY
		} else if ((this.priceSelectionDestinations.get(this.priceSelection).y - this.priceSelectionPosition.y < 0)) {
			this.priceSelectionPosition.y -= selectionSpeedY
		}

	}

	drawPrices(): void {

		const gamepad: u8 = load<u8>(w4.GAMEPAD1)

		store<u16>(w4.DRAW_COLORS, 0x4)
		w4.rect(0, 0, 10 * TILE_SIZE, 8 * TILE_SIZE)

		// Selection
		store<u16>(w4.DRAW_COLORS, 0x00020)
		w4.rect(this.priceSelectionPosition.x, this.priceSelectionPosition.y, 136, 20)

		store<u16>(w4.DRAW_COLORS, 0x0321)
		w4.blit(Back, 5, 5, 44, 10, w4.BLIT_2BPP)
		store<u16>(w4.DRAW_COLORS, 0x1)
		w4.text("Prices", 60, 30)

		store<u16>(w4.DRAW_COLORS, 0x321)
		w4.blit(PackageBig, 20, 60, 16, 12, w4.BLIT_2BPP)
		store<u16>(w4.DRAW_COLORS, 0x2)
		if (((gamepad & w4.BUTTON_LEFT) && this.priceSelection == PriceSelection.MACHINE_1) || this.machineLevels[0] == this.productPrices[0]) store<u16>(w4.DRAW_COLORS, 0x3)
		else store<u16>(w4.DRAW_COLORS, 0x2)
		htriangle(new Point(110, 63), true)
		if (((gamepad & w4.BUTTON_RIGHT) && this.priceSelection == PriceSelection.MACHINE_1) || this.machineLevels[0] * 4 == this.productPrices[0]) store<u16>(w4.DRAW_COLORS, 0x3)
		else store<u16>(w4.DRAW_COLORS, 0x2)
		htriangle(new Point(140, 63), false)
		store<u16>(w4.DRAW_COLORS, 0x2)
		number(`$${this.productPrices[0]}`, new Point(121 - (this.productPrices[0] > 9 ? 2 : 0), 63))

		store<u16>(w4.DRAW_COLORS, 0x031)
		w4.blit(Package2Big, 20, 80, 16, 12, w4.BLIT_2BPP)
		if (((gamepad & w4.BUTTON_LEFT) && this.priceSelection == PriceSelection.MACHINE_2) || this.machineLevels[1] == this.productPrices[1]) store<u16>(w4.DRAW_COLORS, 0x3)
		else store<u16>(w4.DRAW_COLORS, 0x2)
		htriangle(new Point(110, 83), true)
		if (((gamepad & w4.BUTTON_RIGHT) && this.priceSelection == PriceSelection.MACHINE_2) || this.machineLevels[1] * 4 == this.productPrices[1]) store<u16>(w4.DRAW_COLORS, 0x3)
		else store<u16>(w4.DRAW_COLORS, 0x2)
		htriangle(new Point(140, 83), false)
		store<u16>(w4.DRAW_COLORS, 0x2)
		number(`$${this.productPrices[1]}`, new Point(121 - (this.productPrices[1] > 9 ? 2 : 0), 83))


		store<u16>(w4.DRAW_COLORS, 0x321)
		w4.blit(Package3Big, 20, 100, 16, 12, w4.BLIT_2BPP)
		store<u16>(w4.DRAW_COLORS, 0x2)
		if (((gamepad & w4.BUTTON_LEFT) && this.priceSelection == PriceSelection.MACHINE_3) || this.machineLevels[2] == this.productPrices[2]) store<u16>(w4.DRAW_COLORS, 0x3)
		else store<u16>(w4.DRAW_COLORS, 0x2)
		htriangle(new Point(110, 103), true)
		if (((gamepad & w4.BUTTON_RIGHT) && this.priceSelection == PriceSelection.MACHINE_3) || this.machineLevels[2] * 4 == this.productPrices[2]) store<u16>(w4.DRAW_COLORS, 0x3)
		else store<u16>(w4.DRAW_COLORS, 0x2)
		htriangle(new Point(140, 103), false)
		store<u16>(w4.DRAW_COLORS, 0x2)
		number(`$${this.productPrices[2]}`, new Point(121 - (this.productPrices[2] > 9 ? 2 : 0), 103))

	}

	research(): void {
		if (this.researchCount == 360) {
			this.researchCount = 0
			this.isResearching = false
			ScienceStand.frameSinceLastUpgrade = 0
			ScienceStand.upgradeLevel++
			return
		}
	}

	drawResearchProgress(): void {
		const c: f32 = f32(this.researchCount) / f32(360)

		store<u16>(w4.DRAW_COLORS, 0x1)
		w4.rect(8 * TILE_SIZE - 1, 7 * TILE_SIZE + 4, u8(NativeMath.ceil(17 * c)), 2)
	}
}