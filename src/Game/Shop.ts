import * as w4 from "../wasm4"
import { TILE_SIZE, WINDOW_SIZE } from "../constants";
import { Ascendio, Back, CustomerSatisfaction, Depulso, Machine, MarketplacePrompts, MP_Potion, MP_Skins, Potion1, Potion2, PotionPrompts, Shop as ShopSprite, Skin1, Skin1Prompt, Skin2Prompt, SkinPrompts, VagueSkin } from "./Assets";
import { SelectionHandler } from "./SelectionHandler";
import { ascendioCosts, depulsoCosts, number, pixel, withSign } from "../utils";
import Point from "./Point";
import Game from "./Game";
import MachineClass from "./Machine"
import ScienceStand from "./ScienceStand";
import { Skin } from "./Machine";

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
	static depulso: boolean = false
	private depulsoCount: u16 = 0
	static boughtSkins: Array<Skin> = []

	constructor() {
		this.selectionPositionDestinations.set(PossibleSelections.FIRST, new Point(TILE_SIZE - 2, 47))
		this.selectionPositionDestinations.set(PossibleSelections.SECOND, new Point(6 * TILE_SIZE - 2, 47))
		this.selectionPosition = this.selectionPositionDestinations.get(PossibleSelections.FIRST).toU8()
	}

	handleInput(justPressed: u8): void {
		if (justPressed & w4.BUTTON_2) {
			Game.bass.reset().noLoop().A(4, "quarter", 50).play()
			if (this.view == View.DEFAULT) SelectionHandler.selected = false
			else this.view = View.DEFAULT
		} else if (justPressed & w4.BUTTON_1) {
			Game.percussion.reset().noLoop().A(5, "quarter", 20).play()
			if (this.view == View.DEFAULT) {
				if (this.currentSelection == PossibleSelections.FIRST) this.view = View.POTIONS
				else this.view = View.SKINS

				this.currentSelection = PossibleSelections.FIRST
			} else if (this.view == View.POTIONS) {
				if (this.currentSelection == PossibleSelections.FIRST) {
					if (Game.balance >= ascendioCosts.get(ScienceStand.upgradeLevel)) {
						if (Game.satisfaction < 1600) Game.satisfaction += 8000
						else Game.satisfaction = 24000
						Game.balance -= ascendioCosts.get(ScienceStand.upgradeLevel)
						this.view = View.DEFAULT
					}
				}
				else {
					if (!Shop.depulso && Game.balance >= depulsoCosts.get(ScienceStand.upgradeLevel)) {
						Shop.depulso = true
						Game.balance -= depulsoCosts.get(ScienceStand.upgradeLevel)
						this.view = View.DEFAULT
					}
				}
			} else if (this.view == View.SKINS) {
				if (this.currentSelection == PossibleSelections.FIRST) {
					if (Shop.boughtSkins.includes(Skin.ROUND)) {
						if (MachineClass.skin != Skin.ROUND) MachineClass.skin = Skin.ROUND
						else MachineClass.skin = Skin.DEFAULT
					} else if (Game.balance >= 1500) {
						Shop.boughtSkins.push(Skin.ROUND)
						Game.balance -= 1500
						MachineClass.skin = Skin.ROUND
						this.view = View.DEFAULT
						SelectionHandler.selected = false
					}
				}
				else {
					if (Shop.boughtSkins.includes(Skin.VAGUE)) {
						if (MachineClass.skin != Skin.VAGUE) MachineClass.skin = Skin.VAGUE
						else MachineClass.skin = Skin.DEFAULT
					} else if (Game.balance >= 2500) {
						Shop.boughtSkins.push(Skin.VAGUE)
						Game.balance -= 2500
						MachineClass.skin = Skin.VAGUE
						this.view = View.DEFAULT
						SelectionHandler.selected = false
					}
				}
			}

		} else if (justPressed & w4.BUTTON_RIGHT) {
			this.currentSelection = PossibleSelections.SECOND
		} else if (justPressed & w4.BUTTON_LEFT) {
			this.currentSelection = PossibleSelections.FIRST
		}
	}

	update(): void {
		if (Shop.depulso) this.depulsoCount++
		if (this.depulsoCount == 1800) Shop.depulso = false
	}

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
			w4.rect(20, 148, u8(Math.round(f64(120) * (f64(Game.satisfaction) / f64(24000)))), 4)

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
			w4.text("Machine Skins", 27, 30)

			store<u16>(w4.DRAW_COLORS, 0x12)
			w4.oval(TILE_SIZE + 11, 3 * TILE_SIZE + 7, 27, 27)
			store<u16>(w4.DRAW_COLORS, 0x13)
			w4.oval(TILE_SIZE + 14, 3 * TILE_SIZE + 10, 20, 20)

			store<u16>(w4.DRAW_COLORS, 0x0321)
			w4.blit(VagueSkin, WINDOW_SIZE - 4 * TILE_SIZE + 7, 3 * TILE_SIZE + 4, 32, 32, w4.BLIT_2BPP)

			store<u16>(w4.DRAW_COLORS, 0x1)
			w4.blitSub(SkinPrompts, 2 * TILE_SIZE - 3, 6 * TILE_SIZE - 6, 22, 5, 0, 0, 48, w4.BLIT_1BPP)
			w4.blitSub(SkinPrompts, WINDOW_SIZE - 3 * TILE_SIZE - 2, 6 * TILE_SIZE - 6, 22, 6, 22, 0, 48, w4.BLIT_1BPP)

			store<u16>(w4.DRAW_COLORS, 0x2)
			number("$1500", new Point(2 * TILE_SIZE - 3, 6 * TILE_SIZE + 3))
			number("$2500", new Point(WINDOW_SIZE - 3 * TILE_SIZE - 3, 6 * TILE_SIZE + 3))

			store<u16>(w4.DRAW_COLORS, 0x1)
			if (this.currentSelection == PossibleSelections.FIRST)
				w4.blit(Skin1Prompt, 20, 9 * TILE_SIZE - 8, 120, 18, w4.BLIT_1BPP)
			else w4.blit(Skin2Prompt, 24, 9 * TILE_SIZE - 8, 112, 18, w4.BLIT_1BPP)



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