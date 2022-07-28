import * as w4 from "./wasm4";
import Game from "./Game/Game"

const game: Game = new Game()

export function start(): void {
    store<u32>(w4.PALETTE, 0xe0f8cf, 0 * sizeof<u32>());   // light
    store<u32>(w4.PALETTE, 0x7c3f58, 1 * sizeof<u32>());   // red
    store<u32>(w4.PALETTE, 0x306850, 2 * sizeof<u32>());   // dark
    store<u32>(w4.PALETTE, 0x86c06c, 3 * sizeof<u32>());   // green
}

export function update(): void {
    game.update()
    game.draw()
}
