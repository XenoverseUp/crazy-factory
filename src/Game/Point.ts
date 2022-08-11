export default class Point<T> {
	constructor(
		public x: T,
		public y: T
	) { }

	toU8(): Point<u8> {
		return new Point(u8(this.x), u8(this.y))
	}
}
