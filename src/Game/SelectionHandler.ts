import * as w4 from "../wasm4"
import Point from "./Point"
import { TILE_SIZE } from "../constants"
import Game from "./Game"


export enum Selection {
	MACHINE_1 = 0,
	MACHINE_2 = 1,
	MACHINE_3 = 2,
	SCIENCE_STAND = 3,
	SHOP = 4
}

export class SelectionHandler {
	static selected: boolean = false
	public selection: Selection = Selection.MACHINE_1
	private destinations: Map<Selection, Point<i16>> = new Map<Selection, Point<i16>>()
	private selectionPosition: Point<u8> = new Point(0, 0)
	private selectionLength: u8 = 32

	constructor() {
		this.destinations.set(Selection.MACHINE_1, new Point(0, 0))
		this.destinations.set(Selection.MACHINE_2, new Point(0, 3 * TILE_SIZE))
		this.destinations.set(Selection.MACHINE_3, new Point(0, 6 * TILE_SIZE))
		this.destinations.set(Selection.SCIENCE_STAND, new Point(7 * TILE_SIZE, 5 * TILE_SIZE))
		this.destinations.set(Selection.SHOP, new Point(8 * TILE_SIZE, 0))
	}

	handleSelectionInput(justPressed: u8): void {
		if (justPressed & w4.BUTTON_DOWN) {

			if ([Selection.MACHINE_1, Selection.MACHINE_2].includes(this.selection)) this.selection = this.selection + 1
			else if (this.selection == Selection.SHOP) this.selection = Selection.SCIENCE_STAND
		}
		else if (justPressed & w4.BUTTON_UP) {
			if ([Selection.MACHINE_2, Selection.MACHINE_3].includes(this.selection)) this.selection--
			else if (this.selection == Selection.SCIENCE_STAND) this.selection = Selection.SHOP
		}
		else if (justPressed & w4.BUTTON_RIGHT) {
			if (this.selection == Selection.MACHINE_1) this.selection = Selection.SHOP
			else if ([Selection.MACHINE_2, Selection.MACHINE_3].includes(this.selection)) this.selection = Selection.SCIENCE_STAND
		}
		else if (justPressed & w4.BUTTON_LEFT) {
			if (this.selection == Selection.SCIENCE_STAND) this.selection = Selection.MACHINE_3
			else if (this.selection == Selection.SHOP) this.selection = Selection.MACHINE_1
		}

		if (justPressed & w4.BUTTON_2) {
			Game.bass.reset().noLoop().A(3, "quarter", 50).play()
			SelectionHandler.selected = true
		}
	}

	updateSelection(): void {
		const selectionSpeedX: u8 = u8(NativeMathf.ceil(NativeMathf.abs(
			this.destinations.get(this.selection).x - this.selectionPosition.x
		) / 5))
		const selectionSpeedY: u8 = u8(NativeMathf.ceil(NativeMathf.abs(
			this.destinations.get(this.selection).y - this.selectionPosition.y
		) / 5))
		const growSpeed: u8 = u8(NativeMathf.ceil(NativeMathf.abs(
			(this.selection == Selection.SCIENCE_STAND ? 48 : 32) - this.selectionLength
		) / 5))

		if ((this.destinations.get(this.selection).x - this.selectionPosition.x > 0)) {
			this.selectionPosition.x += selectionSpeedX
		} else if ((this.destinations.get(this.selection).x - this.selectionPosition.x < 0)) {
			this.selectionPosition.x -= selectionSpeedX
		}

		if ((this.destinations.get(this.selection).y - this.selectionPosition.y > 0)) {
			this.selectionPosition.y += selectionSpeedY
		} else if ((this.destinations.get(this.selection).y - this.selectionPosition.y < 0)) {
			this.selectionPosition.y -= selectionSpeedY
		}

		if (this.selection == Selection.SCIENCE_STAND && this.selectionLength < 48) {
			this.selectionLength += growSpeed
		} else if (!(this.selection == Selection.SCIENCE_STAND) && this.selectionLength > 32) {
			this.selectionLength -= growSpeed
		}

	}

	drawSelection(): void {
		store<u16>(w4.DRAW_COLORS, 0x0042)
		w4.rect(this.selectionPosition.x, this.selectionPosition.y, this.selectionLength, this.selectionLength)
	}
}