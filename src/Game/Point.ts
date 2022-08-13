export default class Point<T> {
	constructor(
		public x: T,
		public y: T
	) { }

	toU8(): Point<u8> {
		return new Point(u8(this.x), u8(this.y))
	}

	static add(a: Point<u8>, b: Point<i8>): Point<u8> {
		return new Point(a.x + b.x, a.y + b.y)
	}

	static equals<K>(a: Point<K>, b: Point<K>): boolean {
		return a.x == b.x && a.y == b.y
	}
}
