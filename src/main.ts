import Game from "./Game/Game"
import { setColors } from "./utils";

const game: Game = new Game()

export function start(): void {
    /**
     * @transparent = store<u16>(w4.DRAW_COLORS, 0)
     * @extralight = store<u16>(w4.DRAW_COLORS, 1)
     * @light = store<u16>(w4.DRAW_COLORS, 2)
     * @dark = store<u16>(w4.DRAW_COLORS, 3)
     * @extradark = store<u16>(w4.DRAW_COLORS, 4)
     */

    setColors()
    Game.melody1.play()
    Game.bass.play()
    Game.percussion.play()
}

export function update(): void {
    game.update()
    game.draw()
}
