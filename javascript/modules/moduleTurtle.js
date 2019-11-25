class Turtle_VIZ {
	constructor(config, seq, sketch) {
		// this.config = config;
		var domain = JSON.parse( "[" + config['domain'] + "]" )
		var range = JSON.parse( "[" + config['range'] + "]" )
		// console.log("------------------------")
		// console.log(config)
		// console.log(domain)
		// console.log(range)
		// console.log("------------------------")
		this.rotMap = {}
		for(let i = 0; i < domain.length; i++){
			this.rotMap[domain[i]] = (Math.PI/180)*range[i]
		}
		this.stepSize = config.stepSize;
		this.bgColor = config.bgColor;
		this.strokeColor = config.strokeColor;
		this.seq = seq;
		this.currentIndex = 0;
		this.orientation = 0;
		// console.log("------------------------")
		// console.log(this.rotMap)
		// console.log(this.stepSize)
		// console.log(this.bgColor)
		// console.log(this.strokeColor)
		// console.log("------------------------")
		this.sketch = sketch;
		// console.log(this.seq.getElement( 0 ))
		// console.log(this.seq.getElement( 1 ))
		// console.log( this.rotMap[0] )
		// console.log( this.rotMap[1])
	}
	stepDraw() {
		let oldX = this.X;
		let oldY = this.Y;
		let currElement = this.seq.getElement(this.currentIndex++);
		console.log("Index: " + this.currentIndex)
		console.log("Element: " + currElement);
		let angle = this.rotMap[ currElement ];
		// let angle = this.rotMap[this.seq.getElement(this.currentIndex++)];
		this.orientation = (this.orientation + angle);
		console.log(angle)
		this.X += this.stepSize * Math.cos(this.orientation);
		this.Y += this.stepSize * Math.sin(this.orientation);
		this.sketch.line(oldX, oldY, this.X, this.Y);
	}
	setup() {
		this.X = this.sketch.width / 2;
		this.Y = this.sketch.height / 2;
		this.sketch.background(this.bgColor);
		this.sketch.stroke(this.strokeColor);
	}
	draw() {
		this.stepDraw();
		// if (this.seq.cache.length > 4000) {
		// 	this.sketch.noLoop()
		// }
	}
}


const Turtle_SCHEMA = {
	domain: {
		type: 'string',
		title: 'Sequence Domain',
		description: 'Comma seperated numbers',
		default: "0,1,2,3,4",
		required: true
	},
	range: {
		type: 'string',
		title: 'Angles',
		default: "30,45,60,90,120",
		description: 'Comma seperated numbers',
		required: true
	},
	stepSize: {
		type: 'number',
		title: 'Turtle\'s step size',
		default: 20,
		required: true
	},
	strokeWidth: {
		type: 'number',
		title: 'How wide a stroke is',
		default: 5,
		required: true
	},
	bgColor: {
		type: 'string',
		title: 'Background Color',
		format: 'color',
		default: "666666",
		required: false
	},
	strokeColor: {
		type: 'string',
		title: 'Stroke Color',
		format: 'color',
		default: '#ff0000',
		required: false
	}
}

const Turtle_MODULE = {
	viz: Turtle_VIZ,
	name: "Turtle",
	description: "",
	configSchema: Turtle_SCHEMA
}


export default Turtle_MODULE