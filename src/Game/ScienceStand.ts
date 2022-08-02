import { TILE_SIZE } from "../constants";
import * as w4 from "../wasm4"
import { ScienceMachine } from "./Assets";
import { SelectionHandler } from "./SelectionHandler";

export default class ScienceStand {
	public upgradeLevel: u8 = 1

	draw(): void {
		store<u16>(w4.DRAW_COLORS, 0x0432)
		w4.blit(ScienceMachine, 7 * TILE_SIZE, 5 * TILE_SIZE, 48, 48, w4.BLIT_2BPP)
	}

	handleControlPanelInput(justPressed: u8 ): void {
		if(justPressed & w4.BUTTON_2) {
			SelectionHandler.selected = false
		}
	}

	drawControlPanel(): void {
		w4.text(`Fuck fuck!`, 20, 148)
	}
}