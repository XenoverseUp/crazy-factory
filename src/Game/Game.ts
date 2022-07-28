import Machine from "./Machine"
import ScienceStand from "./ScienceStand"

enum GameState {
	START,
	IN_GAME,
	GAME_OVER
}

export default class Game {
	private gameState: GameState
	private gameOver: boolean = false
	private balance: u16 = 500
	private machines: Array<Machine> = [
		new Machine(),
		new Machine(),
		new Machine()
	]
	private scienceStand: ScienceStand = new ScienceStand()
	private staticExpenses = new Map<string, u8>()

	constructor() {
		this.gameState = GameState.START

		this.staticExpenses.set("rent", 150)
		this.staticExpenses.set("electricity", 25) // +25 for each working level 1 machine
	}

	update(): void {}
	draw(): void {}

	finishDay(): void {} // calculate the balance and reset everything
}