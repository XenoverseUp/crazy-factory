export default class Random {
	private lastRand: f32 = .5
	private randNum: f32 = .5

	rand(): f32 {
		while (this.randNum == this.lastRand) {
			this.randNum = (((Math.PI * this.lastRand) % 1) * 17) % 1;
		}
		return this.lastRand = this.randNum;
	}
}

