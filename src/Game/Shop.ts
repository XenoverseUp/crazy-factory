import * as w4 from "../wasm4"
import { TILE_SIZE, WINDOW_SIZE } from "../constants";
import { Ascendio, Back, CustomerSatisfaction, Depulso, MarketplacePrompts, MP_Potion, MP_Skins, Potion1, Potion2, PotionPrompts, Shop as ShopSprite } from "./Assets";
import { SelectionHandler } from "./SelectionHandler";
import { ascendioCosts, depulsoCosts, number, pixel, withSign } from "../utils";
import Point from "./Point";
import Game from "./Game";
import ScienceStand from "./ScienceStand";

enum View {
	DEFAULT = 0,
	POTIONS,
	SKINS
}

enum PossibleSelections {
	FIRST = 0,
	SECOND
}

export default class Shop {
	private view: View = View.DEFAULT
	private currentSelection: PossibleSelections = PossibleSelections.FIRST
	private selectionPosition: Point<u8>
	private selectionPositionDestinations: Map<PossibleSelections, Point<i16>> = new Map<PossibleSelections, Point<i16>>()
	private selected: boolean = false

	constructor() {
		this.selectionPositionDestinations.set(PossibleSelections.FIRST, new Point(TILE_SIZE - 2, 47))
		this.selectionPositionDestinations.set(PossibleSelections.SECOND, new Point(6 * TILE_SIZE - 2, 47))
		this.selectionPosition = this.selectionPositionDestinations.get(PossibleSelections.FIRST).toU8()
	}

	handleInput(justPressed: u8): void {
		if (justPressed & w4.BUTTON_2) {
			if (this.view == View.DEFAULT) SelectionHandler.selected = false
			else this.view = View.DEFAULT
		} else if (justPressed & w4.BUTTON_1) {
			if (this.view == View.DEFAULT) {
				if (this.currentSelection == PossibleSelections.FIRST) this.view = View.POTIONS
				else this.view = View.SKINS

				this.currentSelection = PossibleSelections.FIRST
			}

		} else if (justPressed & w4.BUTTON_RIGHT) {
			this.currentSelection = PossibleSelections.SECOND
		} else if (justPressed & w4.BUTTON_LEFT) {
			this.currentSelection = PossibleSelections.FIRST
		}
	}

	update(): void { }

	draw(): void {
		store<u16>(w4.DRAW_COLORS, 0x0432)
		w4.blit(ShopSprite, 8 * TILE_SIZE, 0, 2 * TILE_SIZE, 2 * TILE_SIZE, w4.BLIT_2BPP)
	}


	updateControlPanel(): void {
		this.updateSelection()
	}

	drawControlPanel(): void {
		store<u16>(w4.DRAW_COLORS, 0x4)
		w4.rect(0, 0, WINDOW_SIZE, 8 * TILE_SIZE)
		store<u16>(w4.DRAW_COLORS, 0x0321)
		w4.blit(Back, 5, 5, 44, 10, w4.BLIT_2BPP)
		store<u16>(w4.DRAW_COLORS, 0x0002)
		withSign(Game.balance < 0 ? '-' : '+', `$${u16(NativeMath.abs(Game.balance))}`, new Point(123, 7))
		this.drawSelection()

		if (this.view == View.DEFAULT) {
			store<u16>(w4.DRAW_COLORS, 0x1)
			w4.text("Market Place", 32, 30)

			store<u16>(w4.DRAW_COLORS, 0x0321)
			w4.blit(MP_Potion, TILE_SIZE, 3 * TILE_SIZE + 2, 48, 48, w4.BLIT_2BPP)
			store<u16>(w4.DRAW_COLORS, 0x3021)
			w4.blit(MP_Skins, WINDOW_SIZE - 4 * TILE_SIZE, 3 * TILE_SIZE + 2, 48, 48, w4.BLIT_2BPP)

			store<u16>(w4.DRAW_COLORS, 0x1)
			w4.blitSub(MarketplacePrompts, TILE_SIZE + 10, 6 * TILE_SIZE + 2, 29, 5, 0, 0, 48, w4.BLIT_1BPP)
			w4.blitSub(MarketplacePrompts, WINDOW_SIZE - 4 * TILE_SIZE + 14, 6 * TILE_SIZE + 2, 19, 5, 29, 0, 48, w4.BLIT_1BPP)


			store<u16>(w4.DRAW_COLORS, 0x10)
			w4.blit(CustomerSatisfaction, 36, 136, 88, 5, w4.BLIT_1BPP)
			store<u16>(w4.DRAW_COLORS, 0x20)
			w4.rect(19, 147, 122, 6)
			store<u16>(w4.DRAW_COLORS, 0x4)
			pixel(new Point(19, 147))
			pixel(new Point(19, 152))
			pixel(new Point(140, 147))
			pixel(new Point(140, 152))
			store<u16>(w4.DRAW_COLORS, 0x1)
			w4.rect(20, 148, u8(Math.round(f64(120) * (f64(Game.satisfaction) / f64(2400)))), 4)

		} else if (this.view == View.POTIONS) {
			store<u16>(w4.DRAW_COLORS, 0x1)
			w4.text("Potions", 52, 30)

			store<u16>(w4.DRAW_COLORS, 0x0321)
			w4.blit(Potion1, TILE_SIZE, 3 * TILE_SIZE - 2, 48, 48, w4.BLIT_2BPP)
			store<u16>(w4.DRAW_COLORS, 0x0231)
			w4.blit(Potion2, WINDOW_SIZE - 4 * TILE_SIZE, 3 * TILE_SIZE - 1, 48, 48, w4.BLIT_2BPP)


			store<u16>(w4.DRAW_COLORS, 0x10)
			w4.blitSub(PotionPrompts, TILE_SIZE + 8, 6 * TILE_SIZE - 6, 32, 5, 0, 0, 64, w4.BLIT_1BPP)
			w4.blitSub(PotionPrompts, WINDOW_SIZE - 4 * TILE_SIZE + 9, 6 * TILE_SIZE - 6, 30, 5, 32, 0, 64, w4.BLIT_1BPP)

			store<u16>(w4.DRAW_COLORS, 0x2)
			number(`$${ascendioCosts.get(ScienceStand.upgradeLevel)}`, new Point(2 * TILE_SIZE - 1, 6 * TILE_SIZE + 3))
			number(`$${depulsoCosts.get(ScienceStand.upgradeLevel)}`, new Point(WINDOW_SIZE - 3 * TILE_SIZE - 2, 6 * TILE_SIZE + 3))

			store<u16>(w4.DRAW_COLORS, 0x1)
			if (this.currentSelection == PossibleSelections.FIRST)
				w4.blit(Ascendio, 16, 9 * TILE_SIZE - 7, 128, 16, w4.BLIT_1BPP)
			else w4.blit(Depulso, 20, 9 * TILE_SIZE - 7, 120, 16, w4.BLIT_1BPP)


		} else if (this.view == View.SKINS) {
			store<u16>(w4.DRAW_COLORS, 0x1)
			w4.text("Skins", 60, 30)
		}
	}

	updateSelection(): void {
		const selectionSpeedX: u8 = u8(NativeMathf.ceil(NativeMathf.abs(
			this.selectionPositionDestinations.get(this.currentSelection).x - this.selectionPosition.x
		) / 5))



		if ((this.selectionPositionDestinations.get(this.currentSelection).x - this.selectionPosition.x > 0)) {
			this.selectionPosition.x += selectionSpeedX
		} else if ((this.selectionPositionDestinations.get(this.currentSelection).x - this.selectionPosition.x < 0)) {
			this.selectionPosition.x -= selectionSpeedX
		}
	}

	drawSelection(): void {
		store<u16>(w4.DRAW_COLORS, 0x20)
		w4.rect(this.selectionPosition.x, this.selectionPosition.y, 51, 64)
	}
}