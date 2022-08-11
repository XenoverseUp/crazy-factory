import { TILE_SIZE } from "../constants";
import { number, vtriangle } from "../utils";
import * as w4 from "../wasm4"
import { Dollar, LevelText, ProductPrices, Science, ScienceMachine } from "./Assets";
import Game from "./Game";
import Point from "./Point";
import { SelectionHandler } from "./SelectionHandler";

enum ControlPanelSelection {
	RESEARCH = 0,
	PRICES
}

export default class ScienceStand {
	static upgradeLevel: u8 = 1
	private researchCosts: Uint16Array = new Uint16Array(3)
	private selection: ControlPanelSelection = ControlPanelSelection.RESEARCH
	private selectionPosition: Point<u8> = new Point(40, 130)
	private selectionDestinations: Map<ControlPanelSelection, Point<i16>> = new Map<ControlPanelSelection, Point<i16>>()
	private canResearch: boolean = false


	constructor() {
		this.researchCosts[0] = 500
		this.researchCosts[1] = 1000
		this.researchCosts[2] = 1500
		this.selectionDestinations.set(ControlPanelSelection.RESEARCH, new Point(40, 130))
		this.selectionDestinations.set(ControlPanelSelection.PRICES, new Point(123, 130))
	}

	draw(): void {
		store<u16>(w4.DRAW_COLORS, 0x0432)
		w4.blit(ScienceMachine, 7 * TILE_SIZE, 5 * TILE_SIZE, 48, 48, w4.BLIT_2BPP)
	}

	handleControlPanelInput(justPressed: u8): void {
		if (justPressed & w4.BUTTON_2) {
			SelectionHandler.selected = false
			this.selection = ControlPanelSelection.RESEARCH
			this.selectionPosition = this.selectionDestinations.get(ControlPanelSelection.RESEARCH).toU8()
		} else if (justPressed & w4.BUTTON_RIGHT) {
			 this.selection = ControlPanelSelection.PRICES
		} else if (justPressed & w4.BUTTON_LEFT) {
			this.selection = ControlPanelSelection.RESEARCH
		}
	}

	updateControlPanel(): void {
		this.canResearch = (Game.balance > i16(this.researchCosts[ScienceStand.upgradeLevel - 1]) && ScienceStand.upgradeLevel < 5) ? true : false

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

		store<u16>(w4.DRAW_COLORS, 0x0321)
		w4.blit(Science, 18, 136, 16, 16, w4.BLIT_2BPP)
		store<u16>(w4.DRAW_COLORS, 0x1)
		w4.blit(LevelText, 38, 138, 24, 5, w4.BLIT_1BPP)
		number((ScienceStand.upgradeLevel + 1).toString(), new Point(59, 138))
		store<u16>(w4.DRAW_COLORS, 0x0003)
		number(`$${this.researchCosts[ScienceStand.upgradeLevel - 1]}`, new Point(38, 146))


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


	drawInfo(): void { }

}