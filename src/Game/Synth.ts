import * as w4 from "../wasm4";

// Note Type = "full" | "half" | "quarter" | "double" | "doubledouble"

export default class Synth {
	private music: Array<Note> = [];
	private config: Config = new Config();
	private frame: u32 = 0;
	private noteIndex: u8 = 0;
	private playing: bool = false;

	constructor(bpm: u16 = 128, flags: u32 = w4.TONE_PULSE1) {
		this.config.flags = flags;
		this.config.bpm = bpm;
	}

	update(): void {
		if (this.playing) {
			if (this.frame == 0) {
				w4.tone(
					this.music[this.noteIndex].frequency,
					this.music[this.noteIndex].duration,
					this.music[this.noteIndex].volume,
					this.music[this.noteIndex].flags
				);
			}
			this.frame++;

			if (this.frame == this.music[this.noteIndex].duration) {
				this.frame = 0;
				if (this.music.length - 1 != this.noteIndex) this.noteIndex++;
				else {
					this.noteIndex = 0;
					if (!this.config.loop) this.playing = false;
				}
			}
		}
	}

	play(): void {
		this.playing = true;
	}

	stop(): void {
		this.playing = false;
	}

	loop(): Synth {
		this.config.loop = true;
		return this;
	}

	noLoop(): Synth {
		this.config.loop = false;
		return this;
	}

	reset(): Synth {
		this.music.length = 0
		this.noteIndex = 0
		this.frame = 0
		this.playing = false
		return this

	}

	C(octave: u8 = 4, noteType: String = "full", volume: u8 = 50): Synth {
		const frequency: u32 =
			octave == 3 ? 131 : octave == 2 ? 65 : octave == 5 ? 523 : 262;

		this.music.push(
			new Note(frequency, volume, this.toFrames(noteType), this.config.flags)
		);

		return this;
	}

	Cs(octave: u8 = 4, noteType: String = "full", volume: u8 = 50): Synth {
		const frequency: u32 =
			octave == 3 ? 139 : octave == 2 ? 69 : octave == 5 ? 554 : 277;

		this.music.push(
			new Note(frequency, volume, this.toFrames(noteType), this.config.flags)
		);

		return this;
	}

	D(octave: u8 = 4, noteType: String = "full", volume: u8 = 50): Synth {
		const frequency: u32 =
			octave == 3 ? 147 : octave == 2 ? 73 : octave == 5 ? 587 : 294;

		this.music.push(
			new Note(frequency, volume, this.toFrames(noteType), this.config.flags)
		);

		return this;
	}

	Ds(octave: u8 = 4, noteType: String = "full", volume: u8 = 50): Synth {
		const frequency: u32 =
			octave == 3 ? 156 : octave == 2 ? 78 : octave == 5 ? 622 : 311;

		this.music.push(
			new Note(frequency, volume, this.toFrames(noteType), this.config.flags)
		);

		return this;
	}

	E(octave: u8 = 4, noteType: String = "full", volume: u8 = 50): Synth {
		const frequency: u32 =
			octave == 3 ? 165 : octave == 2 ? 82 : octave == 5 ? 659 : 330;

		this.music.push(
			new Note(frequency, volume, this.toFrames(noteType), this.config.flags)
		);

		return this;
	}

	F(octave: u8 = 4, noteType: String = "full", volume: u8 = 50): Synth {
		const frequency: u32 =
			octave == 3 ? 175 : octave == 2 ? 87 : octave == 5 ? 698 : 349;

		this.music.push(
			new Note(frequency, volume, this.toFrames(noteType), this.config.flags)
		);

		return this;
	}

	Fs(octave: u8 = 4, noteType: String = "full", volume: u8 = 50): Synth {
		const frequency: u32 =
			octave == 3 ? 185 : octave == 2 ? 92 : octave == 5 ? 740 : 370;

		this.music.push(
			new Note(frequency, volume, this.toFrames(noteType), this.config.flags)
		);

		return this;
	}

	G(octave: u8 = 4, noteType: String = "full", volume: u8 = 50): Synth {
		const frequency: u32 =
			octave == 3 ? 196 : octave == 2 ? 98 : octave == 5 ? 784 : 392;

		this.music.push(
			new Note(frequency, volume, this.toFrames(noteType), this.config.flags)
		);

		return this;
	}

	Gs(octave: u8 = 4, noteType: String = "full", volume: u8 = 50): Synth {
		const frequency: u32 =
			octave == 3 ? 208 : octave == 2 ? 104 : octave == 5 ? 831 : 415;

		this.music.push(
			new Note(frequency, volume, this.toFrames(noteType), this.config.flags)
		);

		return this;
	}

	A(octave: u8 = 4, noteType: String = "full", volume: u8 = 50): Synth {
		const frequency: u32 =
			octave == 3 ? 220 : octave == 2 ? 110 : octave == 5 ? 880 : 440;

		this.music.push(
			new Note(frequency, volume, this.toFrames(noteType), this.config.flags)
		);

		return this;
	}

	As(octave: u8 = 4, noteType: String = "full", volume: u8 = 50): Synth {
		const frequency: u32 =
			octave == 3 ? 233 : octave == 2 ? 117 : octave == 5 ? 932 : 466;

		this.music.push(
			new Note(frequency, volume, this.toFrames(noteType), this.config.flags)
		);

		return this;
	}

	B(octave: u8 = 4, noteType: String = "full", volume: u8 = 50): Synth {
		const frequency: u32 =
			octave == 3 ? 247 : octave == 2 ? 123 : octave == 5 ? 988 : 494;

		this.music.push(
			new Note(frequency, volume, this.toFrames(noteType), this.config.flags)
		);

		return this;
	}

	// Utilities

	toFrames(noteType: String): u16 {
		const frames =
			noteType == "half"
				? u16(Math.round(this.config.bpm / 4))
				: noteType == "quarter"
					? u16(Math.round(this.config.bpm / 8))
					: noteType == "double"
						? u16(Math.round(this.config.bpm))
						: noteType == "doubledouble"
							? u16(Math.round(this.config.bpm * 2))
							: u16(Math.round(this.config.bpm / 2));

		return frames;
	}
}

class Note {
	frequency: u32;
	volume: u8;
	duration: u16;
	flags: u32;

	constructor(frequency: u32, volume: u8, duration: u16, flags: u32) {
		this.volume = volume;
		this.frequency = frequency;
		this.duration = duration;
		this.flags = flags;
	}
}

class Config {
	public bpm: u16 = 128;
	public flags: u32 = w4.TONE_PULSE1;
	public loop: bool = false;
}
