import * as w4 from "./wasm4"

export const TILE_SIZE: u8 = 16
export const GAME_SIZE: u8 = u8(w4.SCREEN_SIZE / TILE_SIZE)
export const DAY_COUNT: u16 = 7200 // 2min in 60 FPS
export const WINDOW_SIZE: u8 = 160