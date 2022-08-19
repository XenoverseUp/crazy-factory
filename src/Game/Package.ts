import * as w4 from "../wasm4"
import Point from "./Point"
import { Package as PackagePtr, Package2, Package3, SPackage } from "./Assets"
import { DOWN, LEFT, RIGHT, UP, TILE_SIZE } from "../constants"

enum Direction {
	UP,
	DOWN,
	RIGHT,
	LEFT
}

export default class Package {
	private type: u8
	public position: Point<u8> = new Point(25, 19)
	private frameCount: u8 = 0
	private direction: Direction = Direction.RIGHT
	private endOffset: u8 = 0
	public speed: u8 = 4

	constructor(t: u8) {
		this.type = t

		if (t == 1) this.position = new Point(25, 3 * TILE_SIZE + 19) // Machine 2
		if (t == 2) this.position = new Point(25, 6 * TILE_SIZE + 19) // Machine 3
		if (t == 3) {
			this.position = new Point(8 * TILE_SIZE + 4, 4 * TILE_SIZE + 19)
			this.direction = Direction.UP
		} // Science Machine
	}

	update(): void {
		if (this.frameCount++ == 120) this.frameCount = 0
		if (this.frameCount % (8 - this.speed) == 0) {
			this.position = Point.add(this.position, this.getDirectionVector(this.direction))
			if (this.position.x > 7 * TILE_SIZE - 8 && [0, 1, 2].includes(this.type)) this.endOffset++
			if (this.position.x > 9 * TILE_SIZE - 8 && this.type == 3) this.endOffset++

			if (this.type == 0) {
				if (Point.equals(this.position, new Point(66, 19))) this.position = Point.add(this.position, DOWN)
				if (Point.equals(this.position, new Point(67, 20))) this.position = Point.add(this.position, DOWN)
				if (Point.equals(this.position, new Point(68, 21))) this.direction = Direction.DOWN

				if (Point.equals(this.position, new Point(68, 81))) this.position = Point.add(this.position, RIGHT)
				if (Point.equals(this.position, new Point(69, 82))) this.position = Point.add(this.position, RIGHT)
				if (Point.equals(this.position, new Point(70, 83))) this.direction = Direction.RIGHT
			}

			if (this.type == 1) {
				if (Point.equals(this.position, new Point(50, 3 * TILE_SIZE + 19))) this.position = Point.add(this.position, DOWN)
				if (Point.equals(this.position, new Point(51, 3 * TILE_SIZE + 20))) this.position = Point.add(this.position, DOWN)
				if (Point.equals(this.position, new Point(52, 3 * TILE_SIZE + 21))) this.direction = Direction.DOWN

				if (Point.equals(this.position, new Point(52, 3 * TILE_SIZE + 49))) this.position = Point.add(this.position, RIGHT)
				if (Point.equals(this.position, new Point(53, 3 * TILE_SIZE + 50))) this.position = Point.add(this.position, RIGHT)
				if (Point.equals(this.position, new Point(54, 3 * TILE_SIZE + 51))) this.direction = Direction.RIGHT
			}

			if (this.type == 3) {
				if (Point.equals(this.position, new Point(8 * TILE_SIZE + 4, 3 * TILE_SIZE + 7))) this.position = Point.add(this.position, RIGHT)
				if (Point.equals(this.position, new Point(8 * TILE_SIZE + 5, 3 * TILE_SIZE + 6))) this.position = Point.add(this.position, RIGHT)
				if (Point.equals(this.position, new Point(8 * TILE_SIZE + 6, 3 * TILE_SIZE + 5))) this.direction = Direction.RIGHT
			}
		}


	}

	draw(): void {
		store<u16>(w4.DRAW_COLORS, 0x321)
		let pkgSprite = PackagePtr

		switch (this.type) {
			case 3: {
				pkgSprite = SPackage
				break
			}
			case 2: {
				pkgSprite = Package2
				break
			}
			case 1: {
				pkgSprite = Package3
				break
			}
			default: {
				pkgSprite = PackagePtr
			}

		}

		if (this.type == 2) store<u16>(w4.DRAW_COLORS, 0x0023)

		w4.blitSub(pkgSprite, this.position.x, this.position.y, 8 - this.endOffset, 6, 0, 0, 8, w4.BLIT_2BPP)
	}

	getDirectionVector(direction: Direction): Point<i8> {
		switch (direction) {
			case Direction.UP:
				return UP
			case Direction.DOWN:
				return DOWN
			case Direction.LEFT:
				return LEFT
			case Direction.RIGHT:
				return RIGHT
			default:
				return UP
		}
	}
}