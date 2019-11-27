

//An example module


class ModFill_Viz {
	constructor(seq, sketch, config) {
		this.sketch = sketch
		this.seq = seq
        this.modDimension = config.modDimension
		this.i = 0;
	}

	drawNew(num, seq) {
		let black = this.sketch.color(0);
		this.sketch.fill(black);
		let i;
		let j;
		for (let mod = 1; mod <= this.modDimension; mod++) {
			i = seq.getElement(num) % mod;
			j = mod - 1;
			this.sketch.rect(j * this.rectWidth, this.sketch.height - (i + 1) * this.rectHeight, this.rectWidth, this.rectHeight);
		}

	}

	setup() {
		this.rectWidth = this.sketch.width / this.modDimension;
		this.rectHeight = this.sketch.height / this.modDimension;
		this.sketch.noStroke();
	}

	draw() {
		this.drawNew(this.i, this.seq);
		this.i++;
		if (i == 1000) {
			this.sketch.noLoop();
		}
	}

}

const ModFill_SCHEMA = {
    modDimension: {
        type: "number",
        title: "Mod dimension",
        description: "",
        required: true
    }
}


const ModFill_MODULE = {
	viz: ModFill_Viz,
	name: "Mod Fill",
	description: "",
	configSchema: ModFill_SCHEMA
}

export default ModFill_MODULE