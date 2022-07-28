import * as w4 from "./wasm4"

export const TILE_SIZE: u8 = 8
export const GAME_SIZE: u8 = u8(w4.SCREEN_SIZE / TILE_SIZE)
export const DAY_COUNT: u16 = 7200 // 2min in 60 FPS