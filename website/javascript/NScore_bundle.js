(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*jshint maxerr: 10000 */

SEQUENCE = require('./sequences/sequences.js');
MODULES = require('./modules/modules.js');
Validation = require('./Validation.js');

const ListToSeq = SEQUENCE.ListToSeq;
const OEISToSeq = SEQUENCE.OEISToSeq;
const BuiltInNameToSeq = SEQUENCE.BuiltInNameToSeq;

function stringToArray(strArr) {
	return JSON.parse("[" + strArr + "]");
}

const NScore = function () {
	const modules = MODULES; //  classes to the drawing modules
	const BuiltInSeqs = SEQUENCE.BuiltInSeqs;
	const validOEIS = VALIDOEIS;
	var preparedSequences = []; // sequenceGenerators to be drawn
	var preparedTools = []; // chosen drawing modules 
	var unprocessedSequences = []; //sequences in a saveable format
	var unprocessedTools = []; //tools in a saveable format
	var liveSketches = []; // p5 sketches being drawn

	/**
	 *
	 *
	 * @param {*} moduleClass drawing module to be used for this sketch
	 * @param {*} config corresponding config for drawing module
	 * @param {*} seq sequence to be passed to drawing module
	 * @param {*} divID div where sketch will be placed
	 * @param {*} width width of sketch
	 * @param {*} height height of sketch
	 * @returns p5 sketch
	 */
	const generateP5 = function (moduleClass, config, seq, divID, width, height) {

		//Create canvas element here
		var div = document.createElement('div');
		//The style of the canvases will be "canvasClass"
		div.className = "canvasClass";
		div.id = "liveCanvas" + divID;
		document.getElementById("canvasArea").appendChild(div);
		//-------------------------------------------
		//Create P5js instance
		let myp5 = new p5(function (sketch) {
			let moduleInstance = new moduleClass(seq, sketch, config);
			sketch.setup = function () {
				sketch.createCanvas(width, height);
				sketch.background("white");
				moduleInstance.setup();
			};

			sketch.draw = function () {
				moduleInstance.draw();
			};
		}, div.id);
		return myp5;
	};

	/**
	 * When the user chooses a drawing module and provides corresponding config
	 * it will automatically be passed to this function, which will validate input
	 * and append it to the prepared tools
	 * @param {*} moduleObj information used to prepare the right drawing module, this input
	 * this will contain an ID, the moduleKey which should match a key in MODULES_JSON, and
	 * a config object.
	 */
	const receiveModule = function (moduleObj) {
		if ((moduleObj.ID && moduleObj.moduleKey && moduleObj.config && modules[moduleObj.moduleKey]) == undefined) {
			console.error("One or more undefined module properties received in NScore");
		} else {
			validationResult = Validation.module(moduleObj);
			if (validationResult.errors.length != 0) {
				preparedTools[moduleObj.ID] = null;
				return validationResult.errors;
			}
			moduleObj.config = validationResult.parsedFields;
			preparedTools[moduleObj.ID] = {
				module: modules[moduleObj.moduleKey],
				config: moduleObj.config,
				ID: moduleObj.ID
			};
			unprocessedTools[moduleObj.ID] = moduleObj;
			return true;
		}
	};

	/**
	 * When the user chooses a sequence, we will automatically pass it to this function
	 * which will validate the input, and then depending on the input type, it will prepare
	 * the sequence in some way to get a sequenceGenerator object which will be appended
	 * to preparedSequences
	 * @param {*} seqObj information used to prepare the right sequence, this will contain a
	 * sequence ID, the type of input, and the input itself (sequence name, a list, an OEIS number..etc).
	 */
	const receiveSequence = function (seqObj) {
		if ((seqObj.ID && seqObj.inputType && seqObj.inputValue && seqObj.parameters) == undefined) {
			console.error("One or more undefined module properties received in NScore");
		} else {
			// We will process different inputs in different ways
			if (seqObj.inputType == "builtIn") {
				validationResult = Validation.builtIn(seqObj);
				if (validationResult.errors.length != 0) {
					return validationResult.errors;
				}
				seqObj.parameters = validationResult.parsedFields;
				preparedSequences[seqObj.ID] = BuiltInNameToSeq(seqObj.ID, seqObj.inputValue, seqObj.parameters);
			}
			if (seqObj.inputType == "OEIS") {
				validationResult = Validation.oeis(seqObj);
				if (validationResult.errors.length != 0) {
					return validationResult.errors;
				}
				preparedSequences[seqObj.ID] = OEISToSeq(seqObj.ID, seqObj.inputValue);
			}
			if (seqObj.inputType == "list") {
				validationResult = Validation.list(seqObj);
				if (validationResult.errors.length != 0) {
					return validationResult.errors;
				}
				preparedSequences[seqObj.ID] = ListToSeq(seqObj.ID, seqObj.inputValue);

			}
			if (seqObj.inputType == "code") {
				console.error("Not implemented");
			}
			unprocessedSequences[seqObj.ID] = seqObj;
		}
		return true;
	};
	/**
	 * We initialize the drawing processing. First we calculate the dimensions of each sketch
	 * then we pair up sequences and drawing modules, and finally we pass them to generateP5
	 * which actually instantiates drawing modules and begins drawing.
	 * 
	 * @param {*} seqVizPairs a list of pairs where each pair contains an ID of a sequence
	 * and an ID of a drawing tool, this lets us know to pass which sequence to which
	 * drawing tool.
	 */
	const begin = function (seqVizPairs) {
		hideLog();

		//Figuring out layout
		//--------------------------------------
		let totalWidth = document.getElementById('canvasArea').offsetWidth;
		let totalHeight = document.getElementById('canvasArea').offsetHeight;
		let canvasCount = seqVizPairs.length;
		let gridSize = Math.ceil(Math.sqrt(canvasCount));
		let individualWidth = totalWidth / gridSize - 20;
		let individualHeight = totalHeight / gridSize;
		//--------------------------------------

		for (let pair of seqVizPairs) {
			let currentSeq = preparedSequences[pair.seqID];
			let currentTool = preparedTools[pair.toolID];
			if (currentSeq == undefined || currentTool == undefined) {
				console.error("undefined ID for tool or sequence");
			} else {
				liveSketches.push(generateP5(currentTool.module.viz, currentTool.config, currentSeq, liveSketches.length, individualWidth, individualHeight));
			}
		}
	};

	const makeJSON = function (seqVizPairs) {
		if( unprocessedSequences.length == 0 && unprocessedTools.length == 0 ){
			return "Nothing to save!";
		}
		toShow = [];
		for (let pair of seqVizPairs) {
			toShow.push({
				seq: unprocessedSequences[pair.seqID],
				tool: unprocessedTools[pair.toolID]
			});
		}
		return JSON.stringify(toShow);
	};

	const clear = function () {
		showLog();
		if (liveSketches.length == 0) {
			return;
		} else {
			for (let i = 0; i < liveSketches.length; i++) {
				liveSketches[i].remove(); //delete canvas element
			}
		}
	};

	const pause = function () {
		liveSketches.forEach(function (sketch) {
			sketch.noLoop();
		});
	};

	const resume = function () {
		liveSketches.forEach(function (sketch) {
			sketch.loop();
		});
	};

	const step = function () {
		liveSketches.forEach(function (sketch) {
			sketch.redraw();
		});
	};

	return {
		receiveSequence: receiveSequence,
		receiveModule: receiveModule,
		liveSketches: liveSketches,
		preparedSequences: preparedSequences,
		preparedTools: preparedTools,
		modules: modules,
		validOEIS: validOEIS,
		BuiltInSeqs: BuiltInSeqs,
		makeJSON: makeJSON,
		begin: begin,
		pause: pause,
		resume: resume,
		step: step,
		clear: clear,
	};
}();




const LogPanel = function () {
	logGreen = function (line) {
		$("#innerLogArea").append(`<p style="color:#00ff00">${line}</p><br>`);
	};
	logRed = function (line) {
		$("#innerLogArea").append(`<p style="color:red">${line}</p><br>`);
	};
	clearlog = function () {
		$("#innerLogArea").empty();
	};
	hideLog = function () {
		$("#logArea").css('display', 'none');
	};
	showLog = function () {
		$("#logArea").css('display', 'block');
	};
	return {
		logGreen: logGreen,
		logRed: logRed,
		clearlog: clearlog,
		hideLog: hideLog,
		showLog: showLog,
	};
}();
window.NScore = NScore;
window.LogPanel = LogPanel;

},{"./Validation.js":2,"./modules/modules.js":8,"./sequences/sequences.js":14}],2:[function(require,module,exports){
SEQUENCE = require('./sequences/sequences.js');
VALIDOEIS = require('./validOEIS.js');
MODULES = require('./modules/modules.js');


const Validation = function () {


	const listError = function (title) {
		let msg = "can't parse the list, please pass numbers seperated by commas (example: 1,2,3)";
		if (title != undefined) {
			msg = title + ": " + msg;
		}
		return msg;
	};

	const requiredError = function (title) {
		return `${title}: this is a required value, don't leave it empty!`;
	};

	const typeError = function (title, value, expectedType) {
		return `${title}: ${value} is a ${typeof(value)}, expected a ${expectedType}. `;
	};

	const oeisError = function (code) {
		return `${code}: Either an invalid OEIS code or not defined by sage!`;
	};

	const builtIn = function (seqObj) {
		let schema = SEQUENCE.BuiltInSeqs[seqObj.inputValue].paramsSchema;
		let receivedParams = seqObj.parameters;

		let validationResult = {
			parsedFields: {},
			errors: []
		};
		Object.keys(receivedParams).forEach(
			(parameter) => {
				validateFromSchema(schema, parameter, receivedParams[parameter], validationResult);
			}
		);
		return validationResult;
	};

	const oeis = function (seqObj) {
		let validationResult = {
			parsedFields: {},
			errors: []
		};
		seqObj.inputValue = seqObj.inputValue.trim();
		let oeisCode = seqObj.inputValue;
		if (!VALIDOEIS.includes(oeisCode)) {
			validationResult.errors.push(oeisError(oeisCode));
		}
		return validationResult;
	};

	const list = function (seqObj) {
		let validationResult = {
			parsedFields: {},
			errors: []
		};
		try {
			if (typeof seqObj.inputValue == String) seqObj.inputValue = JSON.parse(seqObj.inputValue);
		} catch (err) {
			validationResult.errors.push(listError());
		}
		return validationResult;
	};

	const _module = function (moduleObj) {
                console.log("here");
                console.log(moduleObj.moduleKey);
		let schema = MODULES[moduleObj.moduleKey].configSchema;
		let receivedConfig = moduleObj.config;

		let validationResult = {
			parsedFields: {},
			errors: []
		};

		Object.keys(receivedConfig).forEach(
			(configField) => {
				validateFromSchema(schema, configField, receivedConfig[configField], validationResult);
			}
		);
		return validationResult;
	};

	const validateFromSchema = function (schema, field, value, validationResult) {
		let title = schema[field].title;
		if (typeof (value) == "string") {
			value = value.trim();
		}
		let expectedType = schema[field].type;
		let required = (schema[field].required !== undefined) ? schema[field].required : false;
		let format = (schema[field].format !== undefined) ? schema[field].format : false;
		let isEmpty = (value === '');
		if (required && isEmpty) {
			validationResult.errors.push(requiredError(title));
		}
		if (isEmpty) {
			parsed = '';
		}
		if (!isEmpty && (expectedType == "number")) {
			parsed = parseInt(value);
			if (parsed != parsed) { // https://stackoverflow.com/questions/34261938/what-is-the-difference-between-nan-nan-and-nan-nan
				validationResult.errors.push(typeError(title, value, expectedType));
			}
		}
		if (!isEmpty && (expectedType == "string")) {
			parsed = value;
		}
		if (!isEmpty && (expectedType == "boolean")) {
			if (value == '1') {
				parsed = true;
			} else {
				parsed = false;
			}
		}
		if (format && (format == "list")) {
			try {
				parsed = JSON.parse("[" + value + "]");
			} catch (err) {
				validationResult.errors.push(listError(title));
			}
		}
		if (parsed !== undefined) {
			validationResult.parsedFields[field] = parsed;
		}
	};

	return {
		builtIn: builtIn,
		oeis: oeis,
		list: list,
		module: _module
	};
}();

module.exports = Validation;

},{"./modules/modules.js":8,"./sequences/sequences.js":14,"./validOEIS.js":15}],3:[function(require,module,exports){
/*
    var list=[2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997, 1009, 1013, 1019, 1021, 1031, 1033, 1039, 1049, 1051, 1061, 1063, 1069, 1087, 1091, 1093, 1097, 1103, 1109, 1117, 1123, 1129, 1151, 1153, 1163, 1171, 1181, 1187, 1193, 1201, 1213, 1217, 1223];

*/

class VIZ_Differences {
	constructor(seq, sketch, config) {

		this.n = config.n; //n is number of terms of top sequence
		this.levels = config.Levels; //levels is number of layers of the pyramid/trapezoid created by writing the differences.
		this.seq = seq;
		this.sketch = sketch;
	}

	drawDifferences(n, levels, sequence) {

		//changed background color to grey since you can't see what's going on
		this.sketch.background('black');

		n = Math.min(n, sequence.length);
		levels = Math.min(levels, n - 1);
		let font, fontSize = 20;
		this.sketch.textFont("Arial");
		this.sketch.textSize(fontSize);
		this.sketch.textStyle(this.sketch.BOLD);
		let xDelta = 50;
		let yDelta = 50;
		let firstX = 30;
		let firstY = 30;
		this.sketch.colorMode(this.sketch.HSB, 255);
		let myColor = this.sketch.color(100, 255, 150);
		let hue;

		let workingSequence = [];

		for (let i = 0; i < this.n; i++) {
			workingSequence.push(sequence.getElement(i)); //workingSequence cannibalizes first n elements of sequence.
		}


		for (let i = 0; i < this.levels; i++) {
			hue = (i * 255 / 6) % 255;
			myColor = this.sketch.color(hue, 150, 200);
			this.sketch.fill(myColor);
			for (let j = 0; j < workingSequence.length; j++) {
				this.sketch.text(workingSequence[j], firstX + j * xDelta, firstY + i * yDelta); //Draws and updates workingSequence simultaneously.
				if (j < workingSequence.length - 1) {
					workingSequence[j] = workingSequence[j + 1] - workingSequence[j];
				}
			}

			workingSequence.length = workingSequence.length - 1; //Removes last element.
			firstX = firstX + (1 / 2) * xDelta; //Moves line forward half for pyramid shape.

		}

	}
	setup() {}
	draw() {
		this.drawDifferences(this.n, this.levels, this.seq);
		this.sketch.noLoop();
	}
}



const SCHEMA_Differences = {
	n: {
		type: 'number',
		title: 'N',
		description: 'Number of elements',
		required: true
	},
	Levels: {
		type: 'number',
		title: 'Levels',
		description: 'Number of levels',
		required: true
	},
};

const MODULE_Differences = {
	viz: VIZ_Differences,
	name: "Differences",
	description: "",
	configSchema: SCHEMA_Differences
};


module.exports = MODULE_Differences;

},{}],4:[function(require,module,exports){
//An example module


class VIZ_ModFill {
	constructor(seq, sketch, config) {
		this.sketch = sketch;
		this.seq = seq;
		this.modDimension = config.modDimension;
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

const SCHEMA_ModFill = {
	modDimension: {
		type: "number",
		title: "Mod dimension",
		description: "",
		required: true
	}
};


const MODULE_ModFill = {
	viz: VIZ_ModFill,
	name: "Mod Fill",
	description: "",
	configSchema: SCHEMA_ModFill
};

module.exports = MODULE_ModFill;
},{}],5:[function(require,module,exports){
class VIZ_shiftCompare {
	constructor(seq, sketch, config) {
		//Sketch is your canvas
		//config is the parameters you expect
		//seq is the sequence you are drawing
		this.sketch = sketch;
		this.seq = seq;
		this.MOD = 2;
		// Set up the image once.
	}


	setup() {
		console.log(this.sketch.height, this.sketch.width);
		this.img = this.sketch.createImage(this.sketch.width, this.sketch.height);
		this.img.loadPixels(); // Enables pixel-level editing.
	}

	clip(a, min, max) {
		if (a < min) {
			return min;
		} else if (a > max) {
			return max;
		}
		return a;
	}


	draw() { //This will be called everytime to draw
		// Ensure mouse coordinates are sane.
		// Mouse coordinates look they're floats by default.

		let d = this.sketch.pixelDensity();
		let mx = this.clip(Math.round(this.sketch.mouseX), 0, this.sketch.width);
		let my = this.clip(Math.round(this.sketch.mouseY), 0, this.sketch.height);
		if (this.sketch.key == 'ArrowUp') {
			this.MOD += 1;
			this.sketch.key = null;
			console.log("UP PRESSED, NEW MOD: " + this.MOD);
		} else if (this.sketch.key == 'ArrowDown') {
			this.MOD -= 1;
			this.sketch.key = null;
			console.log("DOWN PRESSED, NEW MOD: " + this.MOD);
		} else if (this.sketch.key == 'ArrowRight') {
			console.log(console.log("MX: " + mx + " MY: " + my));
		}
		// Write to image, then to screen for speed.
		for (let x = 0; x < this.sketch.width; x++) {
			for (let y = 0; y < this.sketch.height; y++) {
				for (let i = 0; i < d; i++) {
					for (let j = 0; j < d; j++) {
						let index = 4 * ((y * d + j) * this.sketch.width * d + (x * d + i));
						if (this.seq.getElement(x) % (this.MOD) == this.seq.getElement(y) % (this.MOD)) {
							this.img.pixels[index] = 255;
							this.img.pixels[index + 1] = 255;
							this.img.pixels[index + 2] = 255;
							this.img.pixels[index + 3] = 255;
						} else {
							this.img.pixels[index] = 0;
							this.img.pixels[index + 1] = 0;
							this.img.pixels[index + 2] = 0;
							this.img.pixels[index + 3] = 255;
						}
					}
				}
			}
		}

		this.img.updatePixels(); // Copies our edited pixels to the image.

		this.sketch.image(this.img, 0, 0); // Display image to screen.this.sketch.line(50,50,100,100);
	}
}


const MODULE_ShiftCompare = {
	viz: VIZ_shiftCompare,
	name: "Shift Compare",
	description: "",
	configSchema: {}
};

module.exports = MODULE_ShiftCompare;
},{}],6:[function(require,module,exports){
class VIZ_Turtle {
	constructor(seq, sketch, config) {
		var domain = config.domain;
		var range = config.range;
		this.rotMap = {};
		for (let i = 0; i < domain.length; i++) {
			this.rotMap[domain[i]] = (Math.PI / 180) * range[i];
		}
		this.stepSize = config.stepSize;
		this.bgColor = config.bgColor;
		this.strokeColor = config.strokeColor;
		this.strokeWidth = config.strokeWeight;
		this.seq = seq;
		this.currentIndex = 0;
		this.orientation = 0;
		this.sketch = sketch;
		if (config.startingX != "") {
			this.X = config.startingX;
			this.Y = config.startingY;
		} else {
			this.X = null;
			this.Y = null;
		}

	}
	stepDraw() {
		let oldX = this.X;
		let oldY = this.Y;
		let currElement = this.seq.getElement(this.currentIndex++);
		let angle = this.rotMap[currElement];
		if (angle == undefined) {
			throw ('angle undefined for element: ' + currElement);
		}
		this.orientation = (this.orientation + angle);
		this.X += this.stepSize * Math.cos(this.orientation);
		this.Y += this.stepSize * Math.sin(this.orientation);
		this.sketch.line(oldX, oldY, this.X, this.Y);
	}
	setup() {
		this.X = this.sketch.width / 2;
		this.Y = this.sketch.height / 2;
		this.sketch.background(this.bgColor);
		this.sketch.stroke(this.strokeColor);
		this.sketch.strokeWeight(this.strokeWidth);
	}
	draw() {
		this.stepDraw();
	}
}


const SCHEMA_Turtle = {
	domain: {
		type: 'string',
		title: 'Sequence Domain',
		description: 'Comma seperated numbers',
		format: 'list',
		default: "0,1,2,3,4",
		required: true
	},
	range: {
		type: 'string',
		title: 'Angles',
		default: "30,45,60,90,120",
		format: 'list',
		description: 'Comma seperated numbers',
		required: true
	},
	stepSize: {
		type: 'number',
		title: 'Step Size',
		default: 20,
		required: true
	},
	strokeWeight: {
		type: 'number',
		title: 'Stroke Width',
		default: 5,
		required: true
	},
	startingX: {
		type: 'number',
		tite: 'X start'
	},
	startingY: {
		type: 'number',
		tite: 'Y start'
	},
	bgColor: {
		type: 'string',
		title: 'Background Color',
		format: 'color',
		default: "#666666",
		required: false
	},
	strokeColor: {
		type: 'string',
		title: 'Stroke Color',
		format: 'color',
		default: '#ff0000',
		required: false
	},
};

const MODULE_Turtle = {
	viz: VIZ_Turtle,
	name: "Turtle",
	description: "",
	configSchema: SCHEMA_Turtle
};


module.exports = MODULE_Turtle;
},{}],7:[function(require,module,exports){
        
// number of iterations for
// the reiman zeta function computation
const num_iter = 10

class VIZ_Zeta {
        constructor(seq, sketch, config){
                // Sequence label
                this.seq = seq
                // P5 sketch object
                this.sketch = sketch
        }

        setup(){
                this.iter = 0;
                this.sketch.pixelDensity(1);
                this.sketch.frameRate(1);
        }


        mappingFunc(x_, y_, iters) {
                let a = x_;
                let b = y_;
                let n_ = 0;
                while(n_ < iters) {
                        const aa = a*a;
                        const bb = b*b;
                        const ab = 2.0 * a * b;

                        a = aa - bb + x_;
                        b = ab + y_;
                        n_++;
                }
                return this.sketch.dist(a, b, 0, 0);
        }

        // mappingFunc(x_, y_, iters) {
        //         let a = x_;
        //         let n_ = 0;
        //         let R = 2.0;
        //         while(n_ < iters) {
        //                 const next = R * a * (1 - a);
        //                 a = next;
        //                 n_ ++;
        //         }
        //         return a;
        // }
        //

        drawMap(maxiterations){

                this.sketch.background(0);
                const w = 4;
                const h = (w * this.sketch.height) / this.sketch.width;

                const xmin = -w/2;
                const ymin = -h/2;

                this.sketch.loadPixels();

                const xmax = xmin + w;
                const ymax = ymin + h;

                const dx = (xmax - xmin) / (this.sketch.width);
                const dy = (ymax - ymin) / (this.sketch.height);

                let y = ymin;
                for(let i = 0; i < this.sketch.height; ++i) {

                        let x = xmin;
                        for(let j = 0; j < this.sketch.width; ++j) {

                                let n = this.mappingFunc(x, y, maxiterations);
                                // Multiply complex numbers maxiterations times


                                // index of the pixel based on i, j (4 spanned array)
                                const pix = (j + i*this.sketch.width) * 4;

                                // Proportionality solver:
                                // maps n  \in [0, maxiterations] 
                                // to   n' \in [0, 1]
                                const norm = this.sketch.map(n, 0, maxiterations, 0, 1);

                                // constrain between 0 and 255
                                let colo = this.sketch.map(Math.sqrt(norm), 0, 1, 0, 255);

                                if (n == maxiterations) {
                                        colo = 0;
                                } else {
                                        // RGB coloring gets indexed here
                                        this.sketch.pixels[pix + 0] = colo;
                                        this.sketch.pixels[pix + 1] = colo;
                                        this.sketch.pixels[pix + 2] = colo;

                                        // Alpha:
                                        // https://en.wikipedia.org/wiki/RGBA_color_model
                                        // This is opacity
                                        this.sketch.pixels[pix + 3] = 255;
                                }
                                x += dx;
                        }
                        y += dy;
                }

                this.sketch.updatePixels();
        }

        draw() {
                this.drawMap(this.iter);
                this.iter = (this.iter + 1) % 200;
        }




}

const SCHEMA_Zeta = {
            n: {
                  type: 'number',
                  title: 'N',
                  description: 'Number of elements',
                  required: true
          },
          Levels: {
                  type: 'number',
                  title: 'Levels',
                  description: 'Number of levels',
                  required: true
          },
  };


const MODULE_Zeta = {
    viz: VIZ_Zeta,
    name: 'Zeta',
    description: '',
    configSchema: SCHEMA_Zeta
}

module.exports = MODULE_Zeta
    

},{}],8:[function(require,module,exports){
//Add an import line here for new modules


//Add new modules to this constant.
const MODULES = {};

module.exports = MODULES;

/*jshint ignore:start */
MODULES["Turtle"] = require('./moduleTurtle.js');
MODULES["ShiftCompare"] = require('./moduleShiftCompare.js');
MODULES["Differences"] = require('./moduleDifferences.js');
MODULES["ModFill"] = require('./moduleModFill.js');
MODULES['Zeta'] = require('./moduleZeta.js')

},{"./moduleDifferences.js":3,"./moduleModFill.js":4,"./moduleShiftCompare.js":5,"./moduleTurtle.js":6,"./moduleZeta.js":7}],9:[function(require,module,exports){
SEQ_linearRecurrence = require('./sequenceLinRec.js');

function GEN_fibonacci({
    m
}) {
    return SEQ_linearRecurrence.generator({
        coefficientList: [1, 1],
        seedList: [1, 1],
        m
    });
}

const SCHEMA_Fibonacci = {
    m: {
        type: 'number',
        title: 'Mod',
        description: 'A number to mod the sequence by by',
        required: false
    }
};


const SEQ_fibonacci = {
    generator: GEN_fibonacci,
    name: "Fibonacci",
    description: "",
    paramsSchema: SCHEMA_Fibonacci
};

module.exports = SEQ_fibonacci;
},{"./sequenceLinRec.js":10}],10:[function(require,module,exports){
function GEN_linearRecurrence({
    coefficientList,
    seedList,
    m
}) {
    if (coefficientList.length != seedList.length) {
        //Number of seeds should match the number of coefficients
        console.log("number of coefficients not equal to number of seeds ");
        return null;
    }
    let k = coefficientList.length;
    let genericLinRec;
    if (m != null) {
        for (let i = 0; i < coefficientList.length; i++) {
            coefficientList[i] = coefficientList[i] % m;
            seedList[i] = seedList[i] % m;
        }
        genericLinRec = function (n, cache) {
            if (n < seedList.length) {
                cache[n] = seedList[n];
                return cache[n];
            }
            for (let i = cache.length; i <= n; i++) {
                let sum = 0;
                for (let j = 0; j < k; j++) {
                    sum += cache[i - j - 1] * coefficientList[j];
                }
                cache[i] = sum % m;
            }
            return cache[n];
        };
    } else {
        genericLinRec = function (n, cache) {
            if (n < seedList.length) {
                cache[n] = seedList[n];
                return cache[n];
            }

            for (let i = cache.length; i <= n; i++) {
                let sum = 0;
                for (let j = 0; j < k; j++) {
                    sum += cache[i - j - 1] * coefficientList[j];
                }
                cache[i] = sum;
            }
            return cache[n];
        };
    }
    return genericLinRec;
}

const SCHEMA_linearRecurrence = {
    coefficientList: {
        type: 'string',
        title: 'Coefficients list',
        format: 'list',
        description: 'Comma seperated numbers',
        required: true
    },
    seedList: {
        type: 'string',
        title: 'Seed list',
        format: 'list',
        description: 'Comma seperated numbers',
        required: true
    },
    m: {
        type: 'number',
        title: 'Mod',
        description: 'A number to mod the sequence by by',
        required: false
    }
};


const SEQ_linearRecurrence = {
    generator: GEN_linearRecurrence,
    name: "Linear Recurrence",
    description: "",
    paramsSchema: SCHEMA_linearRecurrence
};

module.exports = SEQ_linearRecurrence;
},{}],11:[function(require,module,exports){
const SEQ_linearRecurrence = require('./sequenceLinRec.js');

function GEN_Lucas({
    m
}) {
    return SEQ_linearRecurrence.generator({
        coefficientList: [1, 1],
        seedList: [2, 1],
        m
    });
}

const SCHEMA_Lucas = {
    m: {
        type: 'number',
        title: 'Mod',
        description: 'A number to mod the sequence by by',
        required: false
    }
};


const SEQ_Lucas = {
    generator: GEN_Lucas,
    name: "Lucas",
    description: "",
    paramsSchema: SCHEMA_Lucas
};

module.exports = SEQ_Lucas;
},{"./sequenceLinRec.js":10}],12:[function(require,module,exports){
function GEN_Naturals({
    includezero
}) {
    if (includezero) {
        return ((n) => n);
    } else {
        return ((n) => n + 1);
    }
}

const SCHEMA_Naturals = {
    includezero: {
        type: 'boolean',
        title: 'Include zero',
        description: '',
        default: 'false',
        required: false
    }
};


const SEQ_Naturals = {
    generator: GEN_Naturals,
    name: "Naturals",
    description: "",
    paramsSchema: SCHEMA_Naturals
};

// export default SEQ_Naturals
module.exports = SEQ_Naturals;
},{}],13:[function(require,module,exports){
function GEN_Primes() {
    const primes = function (n, cache) {
        if (cache.length == 0) {
            cache.push(2);
            cache.push(3);
            cache.push(5);
        }
        let i = cache[cache.length - 1] + 1;
        let k = 0;
        while (cache.length <= n) {
            let isPrime = true;
            for (let j = 0; j < cache.length; j++) {
                if (i % cache[j] == 0) {
                    isPrime = false;
                    break;
                }
            }
            if (isPrime) {
                cache.push(i);
            }
            i++;
        }
        return cache[n];
    };
    return primes;
}


const SCHEMA_Primes = {
    m: {
        type: 'number',
        title: 'Mod',
        description: 'A number to mod the sequence by',
        required: false
    }
};


const SEQ_Primes = {
    generator: GEN_Primes,
    name: "Primes",
    description: "",
    paramsSchema: SCHEMA_Primes
};

module.exports = SEQ_Primes;
},{}],14:[function(require,module,exports){
/**
 *
 * @class SequenceGenerator
 */
class SequenceGenerator {
    /**
     *Creates an instance of SequenceGenerator.
     * @param {*} generator a function that takes a natural number and returns a number, it can optionally take the cache as a second argument
     * @param {*} ID the ID of the sequence
     * @memberof SequenceGenerator
     */
    constructor(ID, generator) {
        this.generator = generator;
        this.ID = ID;
        this.cache = [];
        this.newSize = 1;
    }
    /**
     * if we need to get the nth element and it's not present in
     * in the cache, then we either double the size, or the 
     * new size becomes n+1
     * @param {*} n 
     * @memberof SequenceGenerator
     */
    resizeCache(n) {
        this.newSize = this.cache.length * 2;
        if (n + 1 > this.newSize) {
            this.newSize = n + 1;
        }
    }
    /**
     * Populates the cache up until the current newSize
     * this is called after resizeCache
     * @memberof SequenceGenerator
     */
    fillCache() {
        for (let i = this.cache.length; i < this.newSize; i++) {
            //the generator is given the cache since it would make computation more efficient sometimes
            //but the generator doesn't necessarily need to take more than one argument.
            this.cache[i] = this.generator(i, this.cache);
        }
    }
    /**
     * Get element is what the drawing tools will be calling, it retrieves
     * the nth element of the sequence by either getting it from the cache
     * or if isn't present, by building the cache and then getting it
     * @param {*} n the index of the element in the sequence we want
     * @returns a number
     * @memberof SequenceGenerator
     */
    getElement(n) {
        if (this.cache[n] != undefined || this.finite) {
            // console.log("cache hit")
            return this.cache[n];
        } else {
            // console.log("cache miss")
            this.resizeCache(n);
            this.fillCache();
            return this.cache[n];
        }
    }
}


/**
 *
 *
 * @param {*} code arbitrary sage code to be executed on aleph
 * @returns ajax response object
 */
function sageExecute(code) {
    return $.ajax({
        type: 'POST',
        async: false,
        url: 'http://aleph.sagemath.org/service',
        data: "code=" + code
    });
}

/**
 *
 *
 * @param {*} code arbitrary sage code to be executed on aleph
 * @returns ajax response object
 */
async function sageExecuteAsync(code) {
    return await $.ajax({
        type: 'POST',
        url: 'http://aleph.sagemath.org/service',
        data: "code=" + code
    });
}


class OEISSequenceGenerator {
    constructor(ID, OEIS) {
        this.OEIS = OEIS;
        this.ID = ID;
        this.cache = [];
        this.newSize = 1;
        this.prefillCache();
    }
    oeisFetch(n) {
        console.log("Fetching..");
        let code = `print(sloane.${this.OEIS}.list(${n}))`;
        let resp = sageExecute(code);
        return JSON.parse(resp.responseJSON.stdout);
    }
    async prefillCache() {
        this.resizeCache(3000);
        let code = `print(sloane.${this.OEIS}.list(${this.newSize}))`;
        let resp = await sageExecuteAsync(code);
        console.log(resp);
        this.cache = this.cache.concat(JSON.parse(resp.stdout));
    }
    resizeCache(n) {
        this.newSize = this.cache.length * 2;
        if (n + 1 > this.newSize) {
            this.newSize = n + 1;
        }
    }
    fillCache() {
        let newList = this.oeisFetch(this.newSize);
        this.cache = this.cache.concat(newList);
    }
    getElement(n) {
        if (this.cache[n] != undefined) {
            return this.cache[n];
        } else {
            this.resizeCache();
            this.fillCache();
            return this.cache[n];
        }
    }
}

function BuiltInNameToSeq(ID, seqName, seqParams) {
    let generator = BuiltInSeqs[seqName].generator(seqParams);
    return new SequenceGenerator(ID, generator);
}


function ListToSeq(ID, list) {
    let listGenerator = function (n) {
        return list[n];
    };
    return new SequenceGenerator(ID, listGenerator);
}

function OEISToSeq(ID, OEIS) {
    return new OEISSequenceGenerator(ID, OEIS);
}


const BuiltInSeqs = {};


module.exports = {
    'BuiltInNameToSeq': BuiltInNameToSeq,
    'ListToSeq': ListToSeq,
    'OEISToSeq': OEISToSeq,
    'BuiltInSeqs': BuiltInSeqs
};

/*jshint ignore: start */
BuiltInSeqs["Fibonacci"] = require('./sequenceFibonacci.js');
BuiltInSeqs["Lucas"] = require('./sequenceLucas.js');
BuiltInSeqs["Primes"] = require('./sequencePrimes.js');
BuiltInSeqs["Naturals"] = require('./sequenceNaturals.js');
BuiltInSeqs["LinRec"] = require('./sequenceLinRec.js');
BuiltInSeqs['Primes'] = require('./sequencePrimes.js');
},{"./sequenceFibonacci.js":9,"./sequenceLinRec.js":10,"./sequenceLucas.js":11,"./sequenceNaturals.js":12,"./sequencePrimes.js":13}],15:[function(require,module,exports){
module.exports = ["A000001", "A000027", "A000004", "A000005", "A000008", "A000009", "A000796", "A003418", "A007318", "A008275", "A008277", "A049310", "A000010", "A000007", "A005843", "A000035", "A000169", "A000272", "A000312", "A001477", "A004526", "A000326", "A002378", "A002620", "A005408", "A000012", "A000120", "A010060", "A000069", "A001969", "A000290", "A000225", "A000015", "A000016", "A000032", "A004086", "A002113", "A000030", "A000040", "A002808", "A018252", "A000043", "A000668", "A000396", "A005100", "A005101", "A002110", "A000720", "A064553", "A001055", "A006530", "A000961", "A005117", "A020639", "A000041", "A000045", "A000108", "A001006", "A000079", "A000578", "A000244", "A000302", "A000583", "A000142", "A000085", "A001189", "A000670", "A006318", "A000165", "A001147", "A006882", "A000984", "A001405", "A000292", "A000330", "A000153", "A000255", "A000261", "A001909", "A001910", "A090010", "A055790", "A090012", "A090013", "A090014", "A090015", "A090016", "A000166", "A000203", "A001157", "A008683", "A000204", "A000217", "A000124", "A002275", "A001110", "A051959", "A001221", "A001222", "A046660", "A001227", "A001358", "A001694", "A001836", "A001906", "A001333", "A001045", "A000129", "A001109", "A015521", "A015523", "A015530", "A015531", "A015551", "A082411", "A083103", "A083104", "A083105", "A083216", "A061084", "A000213", "A000073", "A079922", "A079923", "A109814", "A111774", "A111775", "A111787", "A000110", "A000587", "A000100"]

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvTlNjb3JlLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L1ZhbGlkYXRpb24uanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvbW9kdWxlcy9tb2R1bGVEaWZmZXJlbmNlcy5qcyIsIndlYnNpdGUvamF2YXNjcmlwdC9tb2R1bGVzL21vZHVsZU1vZEZpbGwuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvbW9kdWxlcy9tb2R1bGVTaGlmdENvbXBhcmUuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvbW9kdWxlcy9tb2R1bGVUdXJ0bGUuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvbW9kdWxlcy9tb2R1bGVaZXRhLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L21vZHVsZXMvbW9kdWxlcy5qcyIsIndlYnNpdGUvamF2YXNjcmlwdC9zZXF1ZW5jZXMvc2VxdWVuY2VGaWJvbmFjY2kuanMiLCJ3ZWJzaXRlL2phdmFzY3JpcHQvc2VxdWVuY2VzL3NlcXVlbmNlTGluUmVjLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L3NlcXVlbmNlcy9zZXF1ZW5jZUx1Y2FzLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L3NlcXVlbmNlcy9zZXF1ZW5jZU5hdHVyYWxzLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L3NlcXVlbmNlcy9zZXF1ZW5jZVByaW1lcy5qcyIsIndlYnNpdGUvamF2YXNjcmlwdC9zZXF1ZW5jZXMvc2VxdWVuY2VzLmpzIiwid2Vic2l0ZS9qYXZhc2NyaXB0L3ZhbGlkT0VJUy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxS0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8qanNoaW50IG1heGVycjogMTAwMDAgKi9cblxuU0VRVUVOQ0UgPSByZXF1aXJlKCcuL3NlcXVlbmNlcy9zZXF1ZW5jZXMuanMnKTtcbk1PRFVMRVMgPSByZXF1aXJlKCcuL21vZHVsZXMvbW9kdWxlcy5qcycpO1xuVmFsaWRhdGlvbiA9IHJlcXVpcmUoJy4vVmFsaWRhdGlvbi5qcycpO1xuXG5jb25zdCBMaXN0VG9TZXEgPSBTRVFVRU5DRS5MaXN0VG9TZXE7XG5jb25zdCBPRUlTVG9TZXEgPSBTRVFVRU5DRS5PRUlTVG9TZXE7XG5jb25zdCBCdWlsdEluTmFtZVRvU2VxID0gU0VRVUVOQ0UuQnVpbHRJbk5hbWVUb1NlcTtcblxuZnVuY3Rpb24gc3RyaW5nVG9BcnJheShzdHJBcnIpIHtcblx0cmV0dXJuIEpTT04ucGFyc2UoXCJbXCIgKyBzdHJBcnIgKyBcIl1cIik7XG59XG5cbmNvbnN0IE5TY29yZSA9IGZ1bmN0aW9uICgpIHtcblx0Y29uc3QgbW9kdWxlcyA9IE1PRFVMRVM7IC8vICBjbGFzc2VzIHRvIHRoZSBkcmF3aW5nIG1vZHVsZXNcblx0Y29uc3QgQnVpbHRJblNlcXMgPSBTRVFVRU5DRS5CdWlsdEluU2Vxcztcblx0Y29uc3QgdmFsaWRPRUlTID0gVkFMSURPRUlTO1xuXHR2YXIgcHJlcGFyZWRTZXF1ZW5jZXMgPSBbXTsgLy8gc2VxdWVuY2VHZW5lcmF0b3JzIHRvIGJlIGRyYXduXG5cdHZhciBwcmVwYXJlZFRvb2xzID0gW107IC8vIGNob3NlbiBkcmF3aW5nIG1vZHVsZXMgXG5cdHZhciB1bnByb2Nlc3NlZFNlcXVlbmNlcyA9IFtdOyAvL3NlcXVlbmNlcyBpbiBhIHNhdmVhYmxlIGZvcm1hdFxuXHR2YXIgdW5wcm9jZXNzZWRUb29scyA9IFtdOyAvL3Rvb2xzIGluIGEgc2F2ZWFibGUgZm9ybWF0XG5cdHZhciBsaXZlU2tldGNoZXMgPSBbXTsgLy8gcDUgc2tldGNoZXMgYmVpbmcgZHJhd25cblxuXHQvKipcblx0ICpcblx0ICpcblx0ICogQHBhcmFtIHsqfSBtb2R1bGVDbGFzcyBkcmF3aW5nIG1vZHVsZSB0byBiZSB1c2VkIGZvciB0aGlzIHNrZXRjaFxuXHQgKiBAcGFyYW0geyp9IGNvbmZpZyBjb3JyZXNwb25kaW5nIGNvbmZpZyBmb3IgZHJhd2luZyBtb2R1bGVcblx0ICogQHBhcmFtIHsqfSBzZXEgc2VxdWVuY2UgdG8gYmUgcGFzc2VkIHRvIGRyYXdpbmcgbW9kdWxlXG5cdCAqIEBwYXJhbSB7Kn0gZGl2SUQgZGl2IHdoZXJlIHNrZXRjaCB3aWxsIGJlIHBsYWNlZFxuXHQgKiBAcGFyYW0geyp9IHdpZHRoIHdpZHRoIG9mIHNrZXRjaFxuXHQgKiBAcGFyYW0geyp9IGhlaWdodCBoZWlnaHQgb2Ygc2tldGNoXG5cdCAqIEByZXR1cm5zIHA1IHNrZXRjaFxuXHQgKi9cblx0Y29uc3QgZ2VuZXJhdGVQNSA9IGZ1bmN0aW9uIChtb2R1bGVDbGFzcywgY29uZmlnLCBzZXEsIGRpdklELCB3aWR0aCwgaGVpZ2h0KSB7XG5cblx0XHQvL0NyZWF0ZSBjYW52YXMgZWxlbWVudCBoZXJlXG5cdFx0dmFyIGRpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdC8vVGhlIHN0eWxlIG9mIHRoZSBjYW52YXNlcyB3aWxsIGJlIFwiY2FudmFzQ2xhc3NcIlxuXHRcdGRpdi5jbGFzc05hbWUgPSBcImNhbnZhc0NsYXNzXCI7XG5cdFx0ZGl2LmlkID0gXCJsaXZlQ2FudmFzXCIgKyBkaXZJRDtcblx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc0FyZWFcIikuYXBwZW5kQ2hpbGQoZGl2KTtcblx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblx0XHQvL0NyZWF0ZSBQNWpzIGluc3RhbmNlXG5cdFx0bGV0IG15cDUgPSBuZXcgcDUoZnVuY3Rpb24gKHNrZXRjaCkge1xuXHRcdFx0bGV0IG1vZHVsZUluc3RhbmNlID0gbmV3IG1vZHVsZUNsYXNzKHNlcSwgc2tldGNoLCBjb25maWcpO1xuXHRcdFx0c2tldGNoLnNldHVwID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRza2V0Y2guY3JlYXRlQ2FudmFzKHdpZHRoLCBoZWlnaHQpO1xuXHRcdFx0XHRza2V0Y2guYmFja2dyb3VuZChcIndoaXRlXCIpO1xuXHRcdFx0XHRtb2R1bGVJbnN0YW5jZS5zZXR1cCgpO1xuXHRcdFx0fTtcblxuXHRcdFx0c2tldGNoLmRyYXcgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdG1vZHVsZUluc3RhbmNlLmRyYXcoKTtcblx0XHRcdH07XG5cdFx0fSwgZGl2LmlkKTtcblx0XHRyZXR1cm4gbXlwNTtcblx0fTtcblxuXHQvKipcblx0ICogV2hlbiB0aGUgdXNlciBjaG9vc2VzIGEgZHJhd2luZyBtb2R1bGUgYW5kIHByb3ZpZGVzIGNvcnJlc3BvbmRpbmcgY29uZmlnXG5cdCAqIGl0IHdpbGwgYXV0b21hdGljYWxseSBiZSBwYXNzZWQgdG8gdGhpcyBmdW5jdGlvbiwgd2hpY2ggd2lsbCB2YWxpZGF0ZSBpbnB1dFxuXHQgKiBhbmQgYXBwZW5kIGl0IHRvIHRoZSBwcmVwYXJlZCB0b29sc1xuXHQgKiBAcGFyYW0geyp9IG1vZHVsZU9iaiBpbmZvcm1hdGlvbiB1c2VkIHRvIHByZXBhcmUgdGhlIHJpZ2h0IGRyYXdpbmcgbW9kdWxlLCB0aGlzIGlucHV0XG5cdCAqIHRoaXMgd2lsbCBjb250YWluIGFuIElELCB0aGUgbW9kdWxlS2V5IHdoaWNoIHNob3VsZCBtYXRjaCBhIGtleSBpbiBNT0RVTEVTX0pTT04sIGFuZFxuXHQgKiBhIGNvbmZpZyBvYmplY3QuXG5cdCAqL1xuXHRjb25zdCByZWNlaXZlTW9kdWxlID0gZnVuY3Rpb24gKG1vZHVsZU9iaikge1xuXHRcdGlmICgobW9kdWxlT2JqLklEICYmIG1vZHVsZU9iai5tb2R1bGVLZXkgJiYgbW9kdWxlT2JqLmNvbmZpZyAmJiBtb2R1bGVzW21vZHVsZU9iai5tb2R1bGVLZXldKSA9PSB1bmRlZmluZWQpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJPbmUgb3IgbW9yZSB1bmRlZmluZWQgbW9kdWxlIHByb3BlcnRpZXMgcmVjZWl2ZWQgaW4gTlNjb3JlXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YWxpZGF0aW9uUmVzdWx0ID0gVmFsaWRhdGlvbi5tb2R1bGUobW9kdWxlT2JqKTtcblx0XHRcdGlmICh2YWxpZGF0aW9uUmVzdWx0LmVycm9ycy5sZW5ndGggIT0gMCkge1xuXHRcdFx0XHRwcmVwYXJlZFRvb2xzW21vZHVsZU9iai5JRF0gPSBudWxsO1xuXHRcdFx0XHRyZXR1cm4gdmFsaWRhdGlvblJlc3VsdC5lcnJvcnM7XG5cdFx0XHR9XG5cdFx0XHRtb2R1bGVPYmouY29uZmlnID0gdmFsaWRhdGlvblJlc3VsdC5wYXJzZWRGaWVsZHM7XG5cdFx0XHRwcmVwYXJlZFRvb2xzW21vZHVsZU9iai5JRF0gPSB7XG5cdFx0XHRcdG1vZHVsZTogbW9kdWxlc1ttb2R1bGVPYmoubW9kdWxlS2V5XSxcblx0XHRcdFx0Y29uZmlnOiBtb2R1bGVPYmouY29uZmlnLFxuXHRcdFx0XHRJRDogbW9kdWxlT2JqLklEXG5cdFx0XHR9O1xuXHRcdFx0dW5wcm9jZXNzZWRUb29sc1ttb2R1bGVPYmouSURdID0gbW9kdWxlT2JqO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBXaGVuIHRoZSB1c2VyIGNob29zZXMgYSBzZXF1ZW5jZSwgd2Ugd2lsbCBhdXRvbWF0aWNhbGx5IHBhc3MgaXQgdG8gdGhpcyBmdW5jdGlvblxuXHQgKiB3aGljaCB3aWxsIHZhbGlkYXRlIHRoZSBpbnB1dCwgYW5kIHRoZW4gZGVwZW5kaW5nIG9uIHRoZSBpbnB1dCB0eXBlLCBpdCB3aWxsIHByZXBhcmVcblx0ICogdGhlIHNlcXVlbmNlIGluIHNvbWUgd2F5IHRvIGdldCBhIHNlcXVlbmNlR2VuZXJhdG9yIG9iamVjdCB3aGljaCB3aWxsIGJlIGFwcGVuZGVkXG5cdCAqIHRvIHByZXBhcmVkU2VxdWVuY2VzXG5cdCAqIEBwYXJhbSB7Kn0gc2VxT2JqIGluZm9ybWF0aW9uIHVzZWQgdG8gcHJlcGFyZSB0aGUgcmlnaHQgc2VxdWVuY2UsIHRoaXMgd2lsbCBjb250YWluIGFcblx0ICogc2VxdWVuY2UgSUQsIHRoZSB0eXBlIG9mIGlucHV0LCBhbmQgdGhlIGlucHV0IGl0c2VsZiAoc2VxdWVuY2UgbmFtZSwgYSBsaXN0LCBhbiBPRUlTIG51bWJlci4uZXRjKS5cblx0ICovXG5cdGNvbnN0IHJlY2VpdmVTZXF1ZW5jZSA9IGZ1bmN0aW9uIChzZXFPYmopIHtcblx0XHRpZiAoKHNlcU9iai5JRCAmJiBzZXFPYmouaW5wdXRUeXBlICYmIHNlcU9iai5pbnB1dFZhbHVlICYmIHNlcU9iai5wYXJhbWV0ZXJzKSA9PSB1bmRlZmluZWQpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJPbmUgb3IgbW9yZSB1bmRlZmluZWQgbW9kdWxlIHByb3BlcnRpZXMgcmVjZWl2ZWQgaW4gTlNjb3JlXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBXZSB3aWxsIHByb2Nlc3MgZGlmZmVyZW50IGlucHV0cyBpbiBkaWZmZXJlbnQgd2F5c1xuXHRcdFx0aWYgKHNlcU9iai5pbnB1dFR5cGUgPT0gXCJidWlsdEluXCIpIHtcblx0XHRcdFx0dmFsaWRhdGlvblJlc3VsdCA9IFZhbGlkYXRpb24uYnVpbHRJbihzZXFPYmopO1xuXHRcdFx0XHRpZiAodmFsaWRhdGlvblJlc3VsdC5lcnJvcnMubGVuZ3RoICE9IDApIHtcblx0XHRcdFx0XHRyZXR1cm4gdmFsaWRhdGlvblJlc3VsdC5lcnJvcnM7XG5cdFx0XHRcdH1cblx0XHRcdFx0c2VxT2JqLnBhcmFtZXRlcnMgPSB2YWxpZGF0aW9uUmVzdWx0LnBhcnNlZEZpZWxkcztcblx0XHRcdFx0cHJlcGFyZWRTZXF1ZW5jZXNbc2VxT2JqLklEXSA9IEJ1aWx0SW5OYW1lVG9TZXEoc2VxT2JqLklELCBzZXFPYmouaW5wdXRWYWx1ZSwgc2VxT2JqLnBhcmFtZXRlcnMpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHNlcU9iai5pbnB1dFR5cGUgPT0gXCJPRUlTXCIpIHtcblx0XHRcdFx0dmFsaWRhdGlvblJlc3VsdCA9IFZhbGlkYXRpb24ub2VpcyhzZXFPYmopO1xuXHRcdFx0XHRpZiAodmFsaWRhdGlvblJlc3VsdC5lcnJvcnMubGVuZ3RoICE9IDApIHtcblx0XHRcdFx0XHRyZXR1cm4gdmFsaWRhdGlvblJlc3VsdC5lcnJvcnM7XG5cdFx0XHRcdH1cblx0XHRcdFx0cHJlcGFyZWRTZXF1ZW5jZXNbc2VxT2JqLklEXSA9IE9FSVNUb1NlcShzZXFPYmouSUQsIHNlcU9iai5pbnB1dFZhbHVlKTtcblx0XHRcdH1cblx0XHRcdGlmIChzZXFPYmouaW5wdXRUeXBlID09IFwibGlzdFwiKSB7XG5cdFx0XHRcdHZhbGlkYXRpb25SZXN1bHQgPSBWYWxpZGF0aW9uLmxpc3Qoc2VxT2JqKTtcblx0XHRcdFx0aWYgKHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzLmxlbmd0aCAhPSAwKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHByZXBhcmVkU2VxdWVuY2VzW3NlcU9iai5JRF0gPSBMaXN0VG9TZXEoc2VxT2JqLklELCBzZXFPYmouaW5wdXRWYWx1ZSk7XG5cblx0XHRcdH1cblx0XHRcdGlmIChzZXFPYmouaW5wdXRUeXBlID09IFwiY29kZVwiKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG5cdFx0XHR9XG5cdFx0XHR1bnByb2Nlc3NlZFNlcXVlbmNlc1tzZXFPYmouSURdID0gc2VxT2JqO1xuXHRcdH1cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fTtcblx0LyoqXG5cdCAqIFdlIGluaXRpYWxpemUgdGhlIGRyYXdpbmcgcHJvY2Vzc2luZy4gRmlyc3Qgd2UgY2FsY3VsYXRlIHRoZSBkaW1lbnNpb25zIG9mIGVhY2ggc2tldGNoXG5cdCAqIHRoZW4gd2UgcGFpciB1cCBzZXF1ZW5jZXMgYW5kIGRyYXdpbmcgbW9kdWxlcywgYW5kIGZpbmFsbHkgd2UgcGFzcyB0aGVtIHRvIGdlbmVyYXRlUDVcblx0ICogd2hpY2ggYWN0dWFsbHkgaW5zdGFudGlhdGVzIGRyYXdpbmcgbW9kdWxlcyBhbmQgYmVnaW5zIGRyYXdpbmcuXG5cdCAqIFxuXHQgKiBAcGFyYW0geyp9IHNlcVZpelBhaXJzIGEgbGlzdCBvZiBwYWlycyB3aGVyZSBlYWNoIHBhaXIgY29udGFpbnMgYW4gSUQgb2YgYSBzZXF1ZW5jZVxuXHQgKiBhbmQgYW4gSUQgb2YgYSBkcmF3aW5nIHRvb2wsIHRoaXMgbGV0cyB1cyBrbm93IHRvIHBhc3Mgd2hpY2ggc2VxdWVuY2UgdG8gd2hpY2hcblx0ICogZHJhd2luZyB0b29sLlxuXHQgKi9cblx0Y29uc3QgYmVnaW4gPSBmdW5jdGlvbiAoc2VxVml6UGFpcnMpIHtcblx0XHRoaWRlTG9nKCk7XG5cblx0XHQvL0ZpZ3VyaW5nIG91dCBsYXlvdXRcblx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0bGV0IHRvdGFsV2lkdGggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FudmFzQXJlYScpLm9mZnNldFdpZHRoO1xuXHRcdGxldCB0b3RhbEhlaWdodCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYW52YXNBcmVhJykub2Zmc2V0SGVpZ2h0O1xuXHRcdGxldCBjYW52YXNDb3VudCA9IHNlcVZpelBhaXJzLmxlbmd0aDtcblx0XHRsZXQgZ3JpZFNpemUgPSBNYXRoLmNlaWwoTWF0aC5zcXJ0KGNhbnZhc0NvdW50KSk7XG5cdFx0bGV0IGluZGl2aWR1YWxXaWR0aCA9IHRvdGFsV2lkdGggLyBncmlkU2l6ZSAtIDIwO1xuXHRcdGxldCBpbmRpdmlkdWFsSGVpZ2h0ID0gdG90YWxIZWlnaHQgLyBncmlkU2l6ZTtcblx0XHQvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblx0XHRmb3IgKGxldCBwYWlyIG9mIHNlcVZpelBhaXJzKSB7XG5cdFx0XHRsZXQgY3VycmVudFNlcSA9IHByZXBhcmVkU2VxdWVuY2VzW3BhaXIuc2VxSURdO1xuXHRcdFx0bGV0IGN1cnJlbnRUb29sID0gcHJlcGFyZWRUb29sc1twYWlyLnRvb2xJRF07XG5cdFx0XHRpZiAoY3VycmVudFNlcSA9PSB1bmRlZmluZWQgfHwgY3VycmVudFRvb2wgPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoXCJ1bmRlZmluZWQgSUQgZm9yIHRvb2wgb3Igc2VxdWVuY2VcIik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRsaXZlU2tldGNoZXMucHVzaChnZW5lcmF0ZVA1KGN1cnJlbnRUb29sLm1vZHVsZS52aXosIGN1cnJlbnRUb29sLmNvbmZpZywgY3VycmVudFNlcSwgbGl2ZVNrZXRjaGVzLmxlbmd0aCwgaW5kaXZpZHVhbFdpZHRoLCBpbmRpdmlkdWFsSGVpZ2h0KSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cdGNvbnN0IG1ha2VKU09OID0gZnVuY3Rpb24gKHNlcVZpelBhaXJzKSB7XG5cdFx0aWYoIHVucHJvY2Vzc2VkU2VxdWVuY2VzLmxlbmd0aCA9PSAwICYmIHVucHJvY2Vzc2VkVG9vbHMubGVuZ3RoID09IDAgKXtcblx0XHRcdHJldHVybiBcIk5vdGhpbmcgdG8gc2F2ZSFcIjtcblx0XHR9XG5cdFx0dG9TaG93ID0gW107XG5cdFx0Zm9yIChsZXQgcGFpciBvZiBzZXFWaXpQYWlycykge1xuXHRcdFx0dG9TaG93LnB1c2goe1xuXHRcdFx0XHRzZXE6IHVucHJvY2Vzc2VkU2VxdWVuY2VzW3BhaXIuc2VxSURdLFxuXHRcdFx0XHR0b29sOiB1bnByb2Nlc3NlZFRvb2xzW3BhaXIudG9vbElEXVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdHJldHVybiBKU09OLnN0cmluZ2lmeSh0b1Nob3cpO1xuXHR9O1xuXG5cdGNvbnN0IGNsZWFyID0gZnVuY3Rpb24gKCkge1xuXHRcdHNob3dMb2coKTtcblx0XHRpZiAobGl2ZVNrZXRjaGVzLmxlbmd0aCA9PSAwKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbGl2ZVNrZXRjaGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGxpdmVTa2V0Y2hlc1tpXS5yZW1vdmUoKTsgLy9kZWxldGUgY2FudmFzIGVsZW1lbnRcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0Y29uc3QgcGF1c2UgPSBmdW5jdGlvbiAoKSB7XG5cdFx0bGl2ZVNrZXRjaGVzLmZvckVhY2goZnVuY3Rpb24gKHNrZXRjaCkge1xuXHRcdFx0c2tldGNoLm5vTG9vcCgpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdGNvbnN0IHJlc3VtZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRsaXZlU2tldGNoZXMuZm9yRWFjaChmdW5jdGlvbiAoc2tldGNoKSB7XG5cdFx0XHRza2V0Y2gubG9vcCgpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdGNvbnN0IHN0ZXAgPSBmdW5jdGlvbiAoKSB7XG5cdFx0bGl2ZVNrZXRjaGVzLmZvckVhY2goZnVuY3Rpb24gKHNrZXRjaCkge1xuXHRcdFx0c2tldGNoLnJlZHJhdygpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdHJldHVybiB7XG5cdFx0cmVjZWl2ZVNlcXVlbmNlOiByZWNlaXZlU2VxdWVuY2UsXG5cdFx0cmVjZWl2ZU1vZHVsZTogcmVjZWl2ZU1vZHVsZSxcblx0XHRsaXZlU2tldGNoZXM6IGxpdmVTa2V0Y2hlcyxcblx0XHRwcmVwYXJlZFNlcXVlbmNlczogcHJlcGFyZWRTZXF1ZW5jZXMsXG5cdFx0cHJlcGFyZWRUb29sczogcHJlcGFyZWRUb29scyxcblx0XHRtb2R1bGVzOiBtb2R1bGVzLFxuXHRcdHZhbGlkT0VJUzogdmFsaWRPRUlTLFxuXHRcdEJ1aWx0SW5TZXFzOiBCdWlsdEluU2Vxcyxcblx0XHRtYWtlSlNPTjogbWFrZUpTT04sXG5cdFx0YmVnaW46IGJlZ2luLFxuXHRcdHBhdXNlOiBwYXVzZSxcblx0XHRyZXN1bWU6IHJlc3VtZSxcblx0XHRzdGVwOiBzdGVwLFxuXHRcdGNsZWFyOiBjbGVhcixcblx0fTtcbn0oKTtcblxuXG5cblxuY29uc3QgTG9nUGFuZWwgPSBmdW5jdGlvbiAoKSB7XG5cdGxvZ0dyZWVuID0gZnVuY3Rpb24gKGxpbmUpIHtcblx0XHQkKFwiI2lubmVyTG9nQXJlYVwiKS5hcHBlbmQoYDxwIHN0eWxlPVwiY29sb3I6IzAwZmYwMFwiPiR7bGluZX08L3A+PGJyPmApO1xuXHR9O1xuXHRsb2dSZWQgPSBmdW5jdGlvbiAobGluZSkge1xuXHRcdCQoXCIjaW5uZXJMb2dBcmVhXCIpLmFwcGVuZChgPHAgc3R5bGU9XCJjb2xvcjpyZWRcIj4ke2xpbmV9PC9wPjxicj5gKTtcblx0fTtcblx0Y2xlYXJsb2cgPSBmdW5jdGlvbiAoKSB7XG5cdFx0JChcIiNpbm5lckxvZ0FyZWFcIikuZW1wdHkoKTtcblx0fTtcblx0aGlkZUxvZyA9IGZ1bmN0aW9uICgpIHtcblx0XHQkKFwiI2xvZ0FyZWFcIikuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcblx0fTtcblx0c2hvd0xvZyA9IGZ1bmN0aW9uICgpIHtcblx0XHQkKFwiI2xvZ0FyZWFcIikuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJyk7XG5cdH07XG5cdHJldHVybiB7XG5cdFx0bG9nR3JlZW46IGxvZ0dyZWVuLFxuXHRcdGxvZ1JlZDogbG9nUmVkLFxuXHRcdGNsZWFybG9nOiBjbGVhcmxvZyxcblx0XHRoaWRlTG9nOiBoaWRlTG9nLFxuXHRcdHNob3dMb2c6IHNob3dMb2csXG5cdH07XG59KCk7XG53aW5kb3cuTlNjb3JlID0gTlNjb3JlO1xud2luZG93LkxvZ1BhbmVsID0gTG9nUGFuZWw7XG4iLCJTRVFVRU5DRSA9IHJlcXVpcmUoJy4vc2VxdWVuY2VzL3NlcXVlbmNlcy5qcycpO1xuVkFMSURPRUlTID0gcmVxdWlyZSgnLi92YWxpZE9FSVMuanMnKTtcbk1PRFVMRVMgPSByZXF1aXJlKCcuL21vZHVsZXMvbW9kdWxlcy5qcycpO1xuXG5cbmNvbnN0IFZhbGlkYXRpb24gPSBmdW5jdGlvbiAoKSB7XG5cblxuXHRjb25zdCBsaXN0RXJyb3IgPSBmdW5jdGlvbiAodGl0bGUpIHtcblx0XHRsZXQgbXNnID0gXCJjYW4ndCBwYXJzZSB0aGUgbGlzdCwgcGxlYXNlIHBhc3MgbnVtYmVycyBzZXBlcmF0ZWQgYnkgY29tbWFzIChleGFtcGxlOiAxLDIsMylcIjtcblx0XHRpZiAodGl0bGUgIT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRtc2cgPSB0aXRsZSArIFwiOiBcIiArIG1zZztcblx0XHR9XG5cdFx0cmV0dXJuIG1zZztcblx0fTtcblxuXHRjb25zdCByZXF1aXJlZEVycm9yID0gZnVuY3Rpb24gKHRpdGxlKSB7XG5cdFx0cmV0dXJuIGAke3RpdGxlfTogdGhpcyBpcyBhIHJlcXVpcmVkIHZhbHVlLCBkb24ndCBsZWF2ZSBpdCBlbXB0eSFgO1xuXHR9O1xuXG5cdGNvbnN0IHR5cGVFcnJvciA9IGZ1bmN0aW9uICh0aXRsZSwgdmFsdWUsIGV4cGVjdGVkVHlwZSkge1xuXHRcdHJldHVybiBgJHt0aXRsZX06ICR7dmFsdWV9IGlzIGEgJHt0eXBlb2YodmFsdWUpfSwgZXhwZWN0ZWQgYSAke2V4cGVjdGVkVHlwZX0uIGA7XG5cdH07XG5cblx0Y29uc3Qgb2Vpc0Vycm9yID0gZnVuY3Rpb24gKGNvZGUpIHtcblx0XHRyZXR1cm4gYCR7Y29kZX06IEVpdGhlciBhbiBpbnZhbGlkIE9FSVMgY29kZSBvciBub3QgZGVmaW5lZCBieSBzYWdlIWA7XG5cdH07XG5cblx0Y29uc3QgYnVpbHRJbiA9IGZ1bmN0aW9uIChzZXFPYmopIHtcblx0XHRsZXQgc2NoZW1hID0gU0VRVUVOQ0UuQnVpbHRJblNlcXNbc2VxT2JqLmlucHV0VmFsdWVdLnBhcmFtc1NjaGVtYTtcblx0XHRsZXQgcmVjZWl2ZWRQYXJhbXMgPSBzZXFPYmoucGFyYW1ldGVycztcblxuXHRcdGxldCB2YWxpZGF0aW9uUmVzdWx0ID0ge1xuXHRcdFx0cGFyc2VkRmllbGRzOiB7fSxcblx0XHRcdGVycm9yczogW11cblx0XHR9O1xuXHRcdE9iamVjdC5rZXlzKHJlY2VpdmVkUGFyYW1zKS5mb3JFYWNoKFxuXHRcdFx0KHBhcmFtZXRlcikgPT4ge1xuXHRcdFx0XHR2YWxpZGF0ZUZyb21TY2hlbWEoc2NoZW1hLCBwYXJhbWV0ZXIsIHJlY2VpdmVkUGFyYW1zW3BhcmFtZXRlcl0sIHZhbGlkYXRpb25SZXN1bHQpO1xuXHRcdFx0fVxuXHRcdCk7XG5cdFx0cmV0dXJuIHZhbGlkYXRpb25SZXN1bHQ7XG5cdH07XG5cblx0Y29uc3Qgb2VpcyA9IGZ1bmN0aW9uIChzZXFPYmopIHtcblx0XHRsZXQgdmFsaWRhdGlvblJlc3VsdCA9IHtcblx0XHRcdHBhcnNlZEZpZWxkczoge30sXG5cdFx0XHRlcnJvcnM6IFtdXG5cdFx0fTtcblx0XHRzZXFPYmouaW5wdXRWYWx1ZSA9IHNlcU9iai5pbnB1dFZhbHVlLnRyaW0oKTtcblx0XHRsZXQgb2Vpc0NvZGUgPSBzZXFPYmouaW5wdXRWYWx1ZTtcblx0XHRpZiAoIVZBTElET0VJUy5pbmNsdWRlcyhvZWlzQ29kZSkpIHtcblx0XHRcdHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzLnB1c2gob2Vpc0Vycm9yKG9laXNDb2RlKSk7XG5cdFx0fVxuXHRcdHJldHVybiB2YWxpZGF0aW9uUmVzdWx0O1xuXHR9O1xuXG5cdGNvbnN0IGxpc3QgPSBmdW5jdGlvbiAoc2VxT2JqKSB7XG5cdFx0bGV0IHZhbGlkYXRpb25SZXN1bHQgPSB7XG5cdFx0XHRwYXJzZWRGaWVsZHM6IHt9LFxuXHRcdFx0ZXJyb3JzOiBbXVxuXHRcdH07XG5cdFx0dHJ5IHtcblx0XHRcdGlmICh0eXBlb2Ygc2VxT2JqLmlucHV0VmFsdWUgPT0gU3RyaW5nKSBzZXFPYmouaW5wdXRWYWx1ZSA9IEpTT04ucGFyc2Uoc2VxT2JqLmlucHV0VmFsdWUpO1xuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0dmFsaWRhdGlvblJlc3VsdC5lcnJvcnMucHVzaChsaXN0RXJyb3IoKSk7XG5cdFx0fVxuXHRcdHJldHVybiB2YWxpZGF0aW9uUmVzdWx0O1xuXHR9O1xuXG5cdGNvbnN0IF9tb2R1bGUgPSBmdW5jdGlvbiAobW9kdWxlT2JqKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJoZXJlXCIpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKG1vZHVsZU9iai5tb2R1bGVLZXkpO1xuXHRcdGxldCBzY2hlbWEgPSBNT0RVTEVTW21vZHVsZU9iai5tb2R1bGVLZXldLmNvbmZpZ1NjaGVtYTtcblx0XHRsZXQgcmVjZWl2ZWRDb25maWcgPSBtb2R1bGVPYmouY29uZmlnO1xuXG5cdFx0bGV0IHZhbGlkYXRpb25SZXN1bHQgPSB7XG5cdFx0XHRwYXJzZWRGaWVsZHM6IHt9LFxuXHRcdFx0ZXJyb3JzOiBbXVxuXHRcdH07XG5cblx0XHRPYmplY3Qua2V5cyhyZWNlaXZlZENvbmZpZykuZm9yRWFjaChcblx0XHRcdChjb25maWdGaWVsZCkgPT4ge1xuXHRcdFx0XHR2YWxpZGF0ZUZyb21TY2hlbWEoc2NoZW1hLCBjb25maWdGaWVsZCwgcmVjZWl2ZWRDb25maWdbY29uZmlnRmllbGRdLCB2YWxpZGF0aW9uUmVzdWx0KTtcblx0XHRcdH1cblx0XHQpO1xuXHRcdHJldHVybiB2YWxpZGF0aW9uUmVzdWx0O1xuXHR9O1xuXG5cdGNvbnN0IHZhbGlkYXRlRnJvbVNjaGVtYSA9IGZ1bmN0aW9uIChzY2hlbWEsIGZpZWxkLCB2YWx1ZSwgdmFsaWRhdGlvblJlc3VsdCkge1xuXHRcdGxldCB0aXRsZSA9IHNjaGVtYVtmaWVsZF0udGl0bGU7XG5cdFx0aWYgKHR5cGVvZiAodmFsdWUpID09IFwic3RyaW5nXCIpIHtcblx0XHRcdHZhbHVlID0gdmFsdWUudHJpbSgpO1xuXHRcdH1cblx0XHRsZXQgZXhwZWN0ZWRUeXBlID0gc2NoZW1hW2ZpZWxkXS50eXBlO1xuXHRcdGxldCByZXF1aXJlZCA9IChzY2hlbWFbZmllbGRdLnJlcXVpcmVkICE9PSB1bmRlZmluZWQpID8gc2NoZW1hW2ZpZWxkXS5yZXF1aXJlZCA6IGZhbHNlO1xuXHRcdGxldCBmb3JtYXQgPSAoc2NoZW1hW2ZpZWxkXS5mb3JtYXQgIT09IHVuZGVmaW5lZCkgPyBzY2hlbWFbZmllbGRdLmZvcm1hdCA6IGZhbHNlO1xuXHRcdGxldCBpc0VtcHR5ID0gKHZhbHVlID09PSAnJyk7XG5cdFx0aWYgKHJlcXVpcmVkICYmIGlzRW1wdHkpIHtcblx0XHRcdHZhbGlkYXRpb25SZXN1bHQuZXJyb3JzLnB1c2gocmVxdWlyZWRFcnJvcih0aXRsZSkpO1xuXHRcdH1cblx0XHRpZiAoaXNFbXB0eSkge1xuXHRcdFx0cGFyc2VkID0gJyc7XG5cdFx0fVxuXHRcdGlmICghaXNFbXB0eSAmJiAoZXhwZWN0ZWRUeXBlID09IFwibnVtYmVyXCIpKSB7XG5cdFx0XHRwYXJzZWQgPSBwYXJzZUludCh2YWx1ZSk7XG5cdFx0XHRpZiAocGFyc2VkICE9IHBhcnNlZCkgeyAvLyBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8zNDI2MTkzOC93aGF0LWlzLXRoZS1kaWZmZXJlbmNlLWJldHdlZW4tbmFuLW5hbi1hbmQtbmFuLW5hblxuXHRcdFx0XHR2YWxpZGF0aW9uUmVzdWx0LmVycm9ycy5wdXNoKHR5cGVFcnJvcih0aXRsZSwgdmFsdWUsIGV4cGVjdGVkVHlwZSkpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAoIWlzRW1wdHkgJiYgKGV4cGVjdGVkVHlwZSA9PSBcInN0cmluZ1wiKSkge1xuXHRcdFx0cGFyc2VkID0gdmFsdWU7XG5cdFx0fVxuXHRcdGlmICghaXNFbXB0eSAmJiAoZXhwZWN0ZWRUeXBlID09IFwiYm9vbGVhblwiKSkge1xuXHRcdFx0aWYgKHZhbHVlID09ICcxJykge1xuXHRcdFx0XHRwYXJzZWQgPSB0cnVlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGFyc2VkID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmIChmb3JtYXQgJiYgKGZvcm1hdCA9PSBcImxpc3RcIikpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHBhcnNlZCA9IEpTT04ucGFyc2UoXCJbXCIgKyB2YWx1ZSArIFwiXVwiKTtcblx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHR2YWxpZGF0aW9uUmVzdWx0LmVycm9ycy5wdXNoKGxpc3RFcnJvcih0aXRsZSkpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAocGFyc2VkICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHZhbGlkYXRpb25SZXN1bHQucGFyc2VkRmllbGRzW2ZpZWxkXSA9IHBhcnNlZDtcblx0XHR9XG5cdH07XG5cblx0cmV0dXJuIHtcblx0XHRidWlsdEluOiBidWlsdEluLFxuXHRcdG9laXM6IG9laXMsXG5cdFx0bGlzdDogbGlzdCxcblx0XHRtb2R1bGU6IF9tb2R1bGVcblx0fTtcbn0oKTtcblxubW9kdWxlLmV4cG9ydHMgPSBWYWxpZGF0aW9uO1xuIiwiLypcbiAgICB2YXIgbGlzdD1bMiwgMywgNSwgNywgMTEsIDEzLCAxNywgMTksIDIzLCAyOSwgMzEsIDM3LCA0MSwgNDMsIDQ3LCA1MywgNTksIDYxLCA2NywgNzEsIDczLCA3OSwgODMsIDg5LCA5NywgMTAxLCAxMDMsIDEwNywgMTA5LCAxMTMsIDEyNywgMTMxLCAxMzcsIDEzOSwgMTQ5LCAxNTEsIDE1NywgMTYzLCAxNjcsIDE3MywgMTc5LCAxODEsIDE5MSwgMTkzLCAxOTcsIDE5OSwgMjExLCAyMjMsIDIyNywgMjI5LCAyMzMsIDIzOSwgMjQxLCAyNTEsIDI1NywgMjYzLCAyNjksIDI3MSwgMjc3LCAyODEsIDI4MywgMjkzLCAzMDcsIDMxMSwgMzEzLCAzMTcsIDMzMSwgMzM3LCAzNDcsIDM0OSwgMzUzLCAzNTksIDM2NywgMzczLCAzNzksIDM4MywgMzg5LCAzOTcsIDQwMSwgNDA5LCA0MTksIDQyMSwgNDMxLCA0MzMsIDQzOSwgNDQzLCA0NDksIDQ1NywgNDYxLCA0NjMsIDQ2NywgNDc5LCA0ODcsIDQ5MSwgNDk5LCA1MDMsIDUwOSwgNTIxLCA1MjMsIDU0MSwgNTQ3LCA1NTcsIDU2MywgNTY5LCA1NzEsIDU3NywgNTg3LCA1OTMsIDU5OSwgNjAxLCA2MDcsIDYxMywgNjE3LCA2MTksIDYzMSwgNjQxLCA2NDMsIDY0NywgNjUzLCA2NTksIDY2MSwgNjczLCA2NzcsIDY4MywgNjkxLCA3MDEsIDcwOSwgNzE5LCA3MjcsIDczMywgNzM5LCA3NDMsIDc1MSwgNzU3LCA3NjEsIDc2OSwgNzczLCA3ODcsIDc5NywgODA5LCA4MTEsIDgyMSwgODIzLCA4MjcsIDgyOSwgODM5LCA4NTMsIDg1NywgODU5LCA4NjMsIDg3NywgODgxLCA4ODMsIDg4NywgOTA3LCA5MTEsIDkxOSwgOTI5LCA5MzcsIDk0MSwgOTQ3LCA5NTMsIDk2NywgOTcxLCA5NzcsIDk4MywgOTkxLCA5OTcsIDEwMDksIDEwMTMsIDEwMTksIDEwMjEsIDEwMzEsIDEwMzMsIDEwMzksIDEwNDksIDEwNTEsIDEwNjEsIDEwNjMsIDEwNjksIDEwODcsIDEwOTEsIDEwOTMsIDEwOTcsIDExMDMsIDExMDksIDExMTcsIDExMjMsIDExMjksIDExNTEsIDExNTMsIDExNjMsIDExNzEsIDExODEsIDExODcsIDExOTMsIDEyMDEsIDEyMTMsIDEyMTcsIDEyMjNdO1xuXG4qL1xuXG5jbGFzcyBWSVpfRGlmZmVyZW5jZXMge1xuXHRjb25zdHJ1Y3RvcihzZXEsIHNrZXRjaCwgY29uZmlnKSB7XG5cblx0XHR0aGlzLm4gPSBjb25maWcubjsgLy9uIGlzIG51bWJlciBvZiB0ZXJtcyBvZiB0b3Agc2VxdWVuY2Vcblx0XHR0aGlzLmxldmVscyA9IGNvbmZpZy5MZXZlbHM7IC8vbGV2ZWxzIGlzIG51bWJlciBvZiBsYXllcnMgb2YgdGhlIHB5cmFtaWQvdHJhcGV6b2lkIGNyZWF0ZWQgYnkgd3JpdGluZyB0aGUgZGlmZmVyZW5jZXMuXG5cdFx0dGhpcy5zZXEgPSBzZXE7XG5cdFx0dGhpcy5za2V0Y2ggPSBza2V0Y2g7XG5cdH1cblxuXHRkcmF3RGlmZmVyZW5jZXMobiwgbGV2ZWxzLCBzZXF1ZW5jZSkge1xuXG5cdFx0Ly9jaGFuZ2VkIGJhY2tncm91bmQgY29sb3IgdG8gZ3JleSBzaW5jZSB5b3UgY2FuJ3Qgc2VlIHdoYXQncyBnb2luZyBvblxuXHRcdHRoaXMuc2tldGNoLmJhY2tncm91bmQoJ2JsYWNrJyk7XG5cblx0XHRuID0gTWF0aC5taW4obiwgc2VxdWVuY2UubGVuZ3RoKTtcblx0XHRsZXZlbHMgPSBNYXRoLm1pbihsZXZlbHMsIG4gLSAxKTtcblx0XHRsZXQgZm9udCwgZm9udFNpemUgPSAyMDtcblx0XHR0aGlzLnNrZXRjaC50ZXh0Rm9udChcIkFyaWFsXCIpO1xuXHRcdHRoaXMuc2tldGNoLnRleHRTaXplKGZvbnRTaXplKTtcblx0XHR0aGlzLnNrZXRjaC50ZXh0U3R5bGUodGhpcy5za2V0Y2guQk9MRCk7XG5cdFx0bGV0IHhEZWx0YSA9IDUwO1xuXHRcdGxldCB5RGVsdGEgPSA1MDtcblx0XHRsZXQgZmlyc3RYID0gMzA7XG5cdFx0bGV0IGZpcnN0WSA9IDMwO1xuXHRcdHRoaXMuc2tldGNoLmNvbG9yTW9kZSh0aGlzLnNrZXRjaC5IU0IsIDI1NSk7XG5cdFx0bGV0IG15Q29sb3IgPSB0aGlzLnNrZXRjaC5jb2xvcigxMDAsIDI1NSwgMTUwKTtcblx0XHRsZXQgaHVlO1xuXG5cdFx0bGV0IHdvcmtpbmdTZXF1ZW5jZSA9IFtdO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm47IGkrKykge1xuXHRcdFx0d29ya2luZ1NlcXVlbmNlLnB1c2goc2VxdWVuY2UuZ2V0RWxlbWVudChpKSk7IC8vd29ya2luZ1NlcXVlbmNlIGNhbm5pYmFsaXplcyBmaXJzdCBuIGVsZW1lbnRzIG9mIHNlcXVlbmNlLlxuXHRcdH1cblxuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmxldmVsczsgaSsrKSB7XG5cdFx0XHRodWUgPSAoaSAqIDI1NSAvIDYpICUgMjU1O1xuXHRcdFx0bXlDb2xvciA9IHRoaXMuc2tldGNoLmNvbG9yKGh1ZSwgMTUwLCAyMDApO1xuXHRcdFx0dGhpcy5za2V0Y2guZmlsbChteUNvbG9yKTtcblx0XHRcdGZvciAobGV0IGogPSAwOyBqIDwgd29ya2luZ1NlcXVlbmNlLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdHRoaXMuc2tldGNoLnRleHQod29ya2luZ1NlcXVlbmNlW2pdLCBmaXJzdFggKyBqICogeERlbHRhLCBmaXJzdFkgKyBpICogeURlbHRhKTsgLy9EcmF3cyBhbmQgdXBkYXRlcyB3b3JraW5nU2VxdWVuY2Ugc2ltdWx0YW5lb3VzbHkuXG5cdFx0XHRcdGlmIChqIDwgd29ya2luZ1NlcXVlbmNlLmxlbmd0aCAtIDEpIHtcblx0XHRcdFx0XHR3b3JraW5nU2VxdWVuY2Vbal0gPSB3b3JraW5nU2VxdWVuY2VbaiArIDFdIC0gd29ya2luZ1NlcXVlbmNlW2pdO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHdvcmtpbmdTZXF1ZW5jZS5sZW5ndGggPSB3b3JraW5nU2VxdWVuY2UubGVuZ3RoIC0gMTsgLy9SZW1vdmVzIGxhc3QgZWxlbWVudC5cblx0XHRcdGZpcnN0WCA9IGZpcnN0WCArICgxIC8gMikgKiB4RGVsdGE7IC8vTW92ZXMgbGluZSBmb3J3YXJkIGhhbGYgZm9yIHB5cmFtaWQgc2hhcGUuXG5cblx0XHR9XG5cblx0fVxuXHRzZXR1cCgpIHt9XG5cdGRyYXcoKSB7XG5cdFx0dGhpcy5kcmF3RGlmZmVyZW5jZXModGhpcy5uLCB0aGlzLmxldmVscywgdGhpcy5zZXEpO1xuXHRcdHRoaXMuc2tldGNoLm5vTG9vcCgpO1xuXHR9XG59XG5cblxuXG5jb25zdCBTQ0hFTUFfRGlmZmVyZW5jZXMgPSB7XG5cdG46IHtcblx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHR0aXRsZTogJ04nLFxuXHRcdGRlc2NyaXB0aW9uOiAnTnVtYmVyIG9mIGVsZW1lbnRzJyxcblx0XHRyZXF1aXJlZDogdHJ1ZVxuXHR9LFxuXHRMZXZlbHM6IHtcblx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHR0aXRsZTogJ0xldmVscycsXG5cdFx0ZGVzY3JpcHRpb246ICdOdW1iZXIgb2YgbGV2ZWxzJyxcblx0XHRyZXF1aXJlZDogdHJ1ZVxuXHR9LFxufTtcblxuY29uc3QgTU9EVUxFX0RpZmZlcmVuY2VzID0ge1xuXHR2aXo6IFZJWl9EaWZmZXJlbmNlcyxcblx0bmFtZTogXCJEaWZmZXJlbmNlc1wiLFxuXHRkZXNjcmlwdGlvbjogXCJcIixcblx0Y29uZmlnU2NoZW1hOiBTQ0hFTUFfRGlmZmVyZW5jZXNcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBNT0RVTEVfRGlmZmVyZW5jZXM7XG4iLCIvL0FuIGV4YW1wbGUgbW9kdWxlXG5cblxuY2xhc3MgVklaX01vZEZpbGwge1xuXHRjb25zdHJ1Y3RvcihzZXEsIHNrZXRjaCwgY29uZmlnKSB7XG5cdFx0dGhpcy5za2V0Y2ggPSBza2V0Y2g7XG5cdFx0dGhpcy5zZXEgPSBzZXE7XG5cdFx0dGhpcy5tb2REaW1lbnNpb24gPSBjb25maWcubW9kRGltZW5zaW9uO1xuXHRcdHRoaXMuaSA9IDA7XG5cdH1cblxuXHRkcmF3TmV3KG51bSwgc2VxKSB7XG5cdFx0bGV0IGJsYWNrID0gdGhpcy5za2V0Y2guY29sb3IoMCk7XG5cdFx0dGhpcy5za2V0Y2guZmlsbChibGFjayk7XG5cdFx0bGV0IGk7XG5cdFx0bGV0IGo7XG5cdFx0Zm9yIChsZXQgbW9kID0gMTsgbW9kIDw9IHRoaXMubW9kRGltZW5zaW9uOyBtb2QrKykge1xuXHRcdFx0aSA9IHNlcS5nZXRFbGVtZW50KG51bSkgJSBtb2Q7XG5cdFx0XHRqID0gbW9kIC0gMTtcblx0XHRcdHRoaXMuc2tldGNoLnJlY3QoaiAqIHRoaXMucmVjdFdpZHRoLCB0aGlzLnNrZXRjaC5oZWlnaHQgLSAoaSArIDEpICogdGhpcy5yZWN0SGVpZ2h0LCB0aGlzLnJlY3RXaWR0aCwgdGhpcy5yZWN0SGVpZ2h0KTtcblx0XHR9XG5cblx0fVxuXG5cdHNldHVwKCkge1xuXHRcdHRoaXMucmVjdFdpZHRoID0gdGhpcy5za2V0Y2gud2lkdGggLyB0aGlzLm1vZERpbWVuc2lvbjtcblx0XHR0aGlzLnJlY3RIZWlnaHQgPSB0aGlzLnNrZXRjaC5oZWlnaHQgLyB0aGlzLm1vZERpbWVuc2lvbjtcblx0XHR0aGlzLnNrZXRjaC5ub1N0cm9rZSgpO1xuXHR9XG5cblx0ZHJhdygpIHtcblx0XHR0aGlzLmRyYXdOZXcodGhpcy5pLCB0aGlzLnNlcSk7XG5cdFx0dGhpcy5pKys7XG5cdFx0aWYgKGkgPT0gMTAwMCkge1xuXHRcdFx0dGhpcy5za2V0Y2gubm9Mb29wKCk7XG5cdFx0fVxuXHR9XG5cbn1cblxuY29uc3QgU0NIRU1BX01vZEZpbGwgPSB7XG5cdG1vZERpbWVuc2lvbjoge1xuXHRcdHR5cGU6IFwibnVtYmVyXCIsXG5cdFx0dGl0bGU6IFwiTW9kIGRpbWVuc2lvblwiLFxuXHRcdGRlc2NyaXB0aW9uOiBcIlwiLFxuXHRcdHJlcXVpcmVkOiB0cnVlXG5cdH1cbn07XG5cblxuY29uc3QgTU9EVUxFX01vZEZpbGwgPSB7XG5cdHZpejogVklaX01vZEZpbGwsXG5cdG5hbWU6IFwiTW9kIEZpbGxcIixcblx0ZGVzY3JpcHRpb246IFwiXCIsXG5cdGNvbmZpZ1NjaGVtYTogU0NIRU1BX01vZEZpbGxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTU9EVUxFX01vZEZpbGw7IiwiY2xhc3MgVklaX3NoaWZ0Q29tcGFyZSB7XG5cdGNvbnN0cnVjdG9yKHNlcSwgc2tldGNoLCBjb25maWcpIHtcblx0XHQvL1NrZXRjaCBpcyB5b3VyIGNhbnZhc1xuXHRcdC8vY29uZmlnIGlzIHRoZSBwYXJhbWV0ZXJzIHlvdSBleHBlY3Rcblx0XHQvL3NlcSBpcyB0aGUgc2VxdWVuY2UgeW91IGFyZSBkcmF3aW5nXG5cdFx0dGhpcy5za2V0Y2ggPSBza2V0Y2g7XG5cdFx0dGhpcy5zZXEgPSBzZXE7XG5cdFx0dGhpcy5NT0QgPSAyO1xuXHRcdC8vIFNldCB1cCB0aGUgaW1hZ2Ugb25jZS5cblx0fVxuXG5cblx0c2V0dXAoKSB7XG5cdFx0Y29uc29sZS5sb2codGhpcy5za2V0Y2guaGVpZ2h0LCB0aGlzLnNrZXRjaC53aWR0aCk7XG5cdFx0dGhpcy5pbWcgPSB0aGlzLnNrZXRjaC5jcmVhdGVJbWFnZSh0aGlzLnNrZXRjaC53aWR0aCwgdGhpcy5za2V0Y2guaGVpZ2h0KTtcblx0XHR0aGlzLmltZy5sb2FkUGl4ZWxzKCk7IC8vIEVuYWJsZXMgcGl4ZWwtbGV2ZWwgZWRpdGluZy5cblx0fVxuXG5cdGNsaXAoYSwgbWluLCBtYXgpIHtcblx0XHRpZiAoYSA8IG1pbikge1xuXHRcdFx0cmV0dXJuIG1pbjtcblx0XHR9IGVsc2UgaWYgKGEgPiBtYXgpIHtcblx0XHRcdHJldHVybiBtYXg7XG5cdFx0fVxuXHRcdHJldHVybiBhO1xuXHR9XG5cblxuXHRkcmF3KCkgeyAvL1RoaXMgd2lsbCBiZSBjYWxsZWQgZXZlcnl0aW1lIHRvIGRyYXdcblx0XHQvLyBFbnN1cmUgbW91c2UgY29vcmRpbmF0ZXMgYXJlIHNhbmUuXG5cdFx0Ly8gTW91c2UgY29vcmRpbmF0ZXMgbG9vayB0aGV5J3JlIGZsb2F0cyBieSBkZWZhdWx0LlxuXG5cdFx0bGV0IGQgPSB0aGlzLnNrZXRjaC5waXhlbERlbnNpdHkoKTtcblx0XHRsZXQgbXggPSB0aGlzLmNsaXAoTWF0aC5yb3VuZCh0aGlzLnNrZXRjaC5tb3VzZVgpLCAwLCB0aGlzLnNrZXRjaC53aWR0aCk7XG5cdFx0bGV0IG15ID0gdGhpcy5jbGlwKE1hdGgucm91bmQodGhpcy5za2V0Y2gubW91c2VZKSwgMCwgdGhpcy5za2V0Y2guaGVpZ2h0KTtcblx0XHRpZiAodGhpcy5za2V0Y2gua2V5ID09ICdBcnJvd1VwJykge1xuXHRcdFx0dGhpcy5NT0QgKz0gMTtcblx0XHRcdHRoaXMuc2tldGNoLmtleSA9IG51bGw7XG5cdFx0XHRjb25zb2xlLmxvZyhcIlVQIFBSRVNTRUQsIE5FVyBNT0Q6IFwiICsgdGhpcy5NT0QpO1xuXHRcdH0gZWxzZSBpZiAodGhpcy5za2V0Y2gua2V5ID09ICdBcnJvd0Rvd24nKSB7XG5cdFx0XHR0aGlzLk1PRCAtPSAxO1xuXHRcdFx0dGhpcy5za2V0Y2gua2V5ID0gbnVsbDtcblx0XHRcdGNvbnNvbGUubG9nKFwiRE9XTiBQUkVTU0VELCBORVcgTU9EOiBcIiArIHRoaXMuTU9EKTtcblx0XHR9IGVsc2UgaWYgKHRoaXMuc2tldGNoLmtleSA9PSAnQXJyb3dSaWdodCcpIHtcblx0XHRcdGNvbnNvbGUubG9nKGNvbnNvbGUubG9nKFwiTVg6IFwiICsgbXggKyBcIiBNWTogXCIgKyBteSkpO1xuXHRcdH1cblx0XHQvLyBXcml0ZSB0byBpbWFnZSwgdGhlbiB0byBzY3JlZW4gZm9yIHNwZWVkLlxuXHRcdGZvciAobGV0IHggPSAwOyB4IDwgdGhpcy5za2V0Y2gud2lkdGg7IHgrKykge1xuXHRcdFx0Zm9yIChsZXQgeSA9IDA7IHkgPCB0aGlzLnNrZXRjaC5oZWlnaHQ7IHkrKykge1xuXHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGQ7IGkrKykge1xuXHRcdFx0XHRcdGZvciAobGV0IGogPSAwOyBqIDwgZDsgaisrKSB7XG5cdFx0XHRcdFx0XHRsZXQgaW5kZXggPSA0ICogKCh5ICogZCArIGopICogdGhpcy5za2V0Y2gud2lkdGggKiBkICsgKHggKiBkICsgaSkpO1xuXHRcdFx0XHRcdFx0aWYgKHRoaXMuc2VxLmdldEVsZW1lbnQoeCkgJSAodGhpcy5NT0QpID09IHRoaXMuc2VxLmdldEVsZW1lbnQoeSkgJSAodGhpcy5NT0QpKSB7XG5cdFx0XHRcdFx0XHRcdHRoaXMuaW1nLnBpeGVsc1tpbmRleF0gPSAyNTU7XG5cdFx0XHRcdFx0XHRcdHRoaXMuaW1nLnBpeGVsc1tpbmRleCArIDFdID0gMjU1O1xuXHRcdFx0XHRcdFx0XHR0aGlzLmltZy5waXhlbHNbaW5kZXggKyAyXSA9IDI1NTtcblx0XHRcdFx0XHRcdFx0dGhpcy5pbWcucGl4ZWxzW2luZGV4ICsgM10gPSAyNTU7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHR0aGlzLmltZy5waXhlbHNbaW5kZXhdID0gMDtcblx0XHRcdFx0XHRcdFx0dGhpcy5pbWcucGl4ZWxzW2luZGV4ICsgMV0gPSAwO1xuXHRcdFx0XHRcdFx0XHR0aGlzLmltZy5waXhlbHNbaW5kZXggKyAyXSA9IDA7XG5cdFx0XHRcdFx0XHRcdHRoaXMuaW1nLnBpeGVsc1tpbmRleCArIDNdID0gMjU1O1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMuaW1nLnVwZGF0ZVBpeGVscygpOyAvLyBDb3BpZXMgb3VyIGVkaXRlZCBwaXhlbHMgdG8gdGhlIGltYWdlLlxuXG5cdFx0dGhpcy5za2V0Y2guaW1hZ2UodGhpcy5pbWcsIDAsIDApOyAvLyBEaXNwbGF5IGltYWdlIHRvIHNjcmVlbi50aGlzLnNrZXRjaC5saW5lKDUwLDUwLDEwMCwxMDApO1xuXHR9XG59XG5cblxuY29uc3QgTU9EVUxFX1NoaWZ0Q29tcGFyZSA9IHtcblx0dml6OiBWSVpfc2hpZnRDb21wYXJlLFxuXHRuYW1lOiBcIlNoaWZ0IENvbXBhcmVcIixcblx0ZGVzY3JpcHRpb246IFwiXCIsXG5cdGNvbmZpZ1NjaGVtYToge31cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTU9EVUxFX1NoaWZ0Q29tcGFyZTsiLCJjbGFzcyBWSVpfVHVydGxlIHtcblx0Y29uc3RydWN0b3Ioc2VxLCBza2V0Y2gsIGNvbmZpZykge1xuXHRcdHZhciBkb21haW4gPSBjb25maWcuZG9tYWluO1xuXHRcdHZhciByYW5nZSA9IGNvbmZpZy5yYW5nZTtcblx0XHR0aGlzLnJvdE1hcCA9IHt9O1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZG9tYWluLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0aGlzLnJvdE1hcFtkb21haW5baV1dID0gKE1hdGguUEkgLyAxODApICogcmFuZ2VbaV07XG5cdFx0fVxuXHRcdHRoaXMuc3RlcFNpemUgPSBjb25maWcuc3RlcFNpemU7XG5cdFx0dGhpcy5iZ0NvbG9yID0gY29uZmlnLmJnQ29sb3I7XG5cdFx0dGhpcy5zdHJva2VDb2xvciA9IGNvbmZpZy5zdHJva2VDb2xvcjtcblx0XHR0aGlzLnN0cm9rZVdpZHRoID0gY29uZmlnLnN0cm9rZVdlaWdodDtcblx0XHR0aGlzLnNlcSA9IHNlcTtcblx0XHR0aGlzLmN1cnJlbnRJbmRleCA9IDA7XG5cdFx0dGhpcy5vcmllbnRhdGlvbiA9IDA7XG5cdFx0dGhpcy5za2V0Y2ggPSBza2V0Y2g7XG5cdFx0aWYgKGNvbmZpZy5zdGFydGluZ1ggIT0gXCJcIikge1xuXHRcdFx0dGhpcy5YID0gY29uZmlnLnN0YXJ0aW5nWDtcblx0XHRcdHRoaXMuWSA9IGNvbmZpZy5zdGFydGluZ1k7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuWCA9IG51bGw7XG5cdFx0XHR0aGlzLlkgPSBudWxsO1xuXHRcdH1cblxuXHR9XG5cdHN0ZXBEcmF3KCkge1xuXHRcdGxldCBvbGRYID0gdGhpcy5YO1xuXHRcdGxldCBvbGRZID0gdGhpcy5ZO1xuXHRcdGxldCBjdXJyRWxlbWVudCA9IHRoaXMuc2VxLmdldEVsZW1lbnQodGhpcy5jdXJyZW50SW5kZXgrKyk7XG5cdFx0bGV0IGFuZ2xlID0gdGhpcy5yb3RNYXBbY3VyckVsZW1lbnRdO1xuXHRcdGlmIChhbmdsZSA9PSB1bmRlZmluZWQpIHtcblx0XHRcdHRocm93ICgnYW5nbGUgdW5kZWZpbmVkIGZvciBlbGVtZW50OiAnICsgY3VyckVsZW1lbnQpO1xuXHRcdH1cblx0XHR0aGlzLm9yaWVudGF0aW9uID0gKHRoaXMub3JpZW50YXRpb24gKyBhbmdsZSk7XG5cdFx0dGhpcy5YICs9IHRoaXMuc3RlcFNpemUgKiBNYXRoLmNvcyh0aGlzLm9yaWVudGF0aW9uKTtcblx0XHR0aGlzLlkgKz0gdGhpcy5zdGVwU2l6ZSAqIE1hdGguc2luKHRoaXMub3JpZW50YXRpb24pO1xuXHRcdHRoaXMuc2tldGNoLmxpbmUob2xkWCwgb2xkWSwgdGhpcy5YLCB0aGlzLlkpO1xuXHR9XG5cdHNldHVwKCkge1xuXHRcdHRoaXMuWCA9IHRoaXMuc2tldGNoLndpZHRoIC8gMjtcblx0XHR0aGlzLlkgPSB0aGlzLnNrZXRjaC5oZWlnaHQgLyAyO1xuXHRcdHRoaXMuc2tldGNoLmJhY2tncm91bmQodGhpcy5iZ0NvbG9yKTtcblx0XHR0aGlzLnNrZXRjaC5zdHJva2UodGhpcy5zdHJva2VDb2xvcik7XG5cdFx0dGhpcy5za2V0Y2guc3Ryb2tlV2VpZ2h0KHRoaXMuc3Ryb2tlV2lkdGgpO1xuXHR9XG5cdGRyYXcoKSB7XG5cdFx0dGhpcy5zdGVwRHJhdygpO1xuXHR9XG59XG5cblxuY29uc3QgU0NIRU1BX1R1cnRsZSA9IHtcblx0ZG9tYWluOiB7XG5cdFx0dHlwZTogJ3N0cmluZycsXG5cdFx0dGl0bGU6ICdTZXF1ZW5jZSBEb21haW4nLFxuXHRcdGRlc2NyaXB0aW9uOiAnQ29tbWEgc2VwZXJhdGVkIG51bWJlcnMnLFxuXHRcdGZvcm1hdDogJ2xpc3QnLFxuXHRcdGRlZmF1bHQ6IFwiMCwxLDIsMyw0XCIsXG5cdFx0cmVxdWlyZWQ6IHRydWVcblx0fSxcblx0cmFuZ2U6IHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHR0aXRsZTogJ0FuZ2xlcycsXG5cdFx0ZGVmYXVsdDogXCIzMCw0NSw2MCw5MCwxMjBcIixcblx0XHRmb3JtYXQ6ICdsaXN0Jyxcblx0XHRkZXNjcmlwdGlvbjogJ0NvbW1hIHNlcGVyYXRlZCBudW1iZXJzJyxcblx0XHRyZXF1aXJlZDogdHJ1ZVxuXHR9LFxuXHRzdGVwU2l6ZToge1xuXHRcdHR5cGU6ICdudW1iZXInLFxuXHRcdHRpdGxlOiAnU3RlcCBTaXplJyxcblx0XHRkZWZhdWx0OiAyMCxcblx0XHRyZXF1aXJlZDogdHJ1ZVxuXHR9LFxuXHRzdHJva2VXZWlnaHQ6IHtcblx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHR0aXRsZTogJ1N0cm9rZSBXaWR0aCcsXG5cdFx0ZGVmYXVsdDogNSxcblx0XHRyZXF1aXJlZDogdHJ1ZVxuXHR9LFxuXHRzdGFydGluZ1g6IHtcblx0XHR0eXBlOiAnbnVtYmVyJyxcblx0XHR0aXRlOiAnWCBzdGFydCdcblx0fSxcblx0c3RhcnRpbmdZOiB7XG5cdFx0dHlwZTogJ251bWJlcicsXG5cdFx0dGl0ZTogJ1kgc3RhcnQnXG5cdH0sXG5cdGJnQ29sb3I6IHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHR0aXRsZTogJ0JhY2tncm91bmQgQ29sb3InLFxuXHRcdGZvcm1hdDogJ2NvbG9yJyxcblx0XHRkZWZhdWx0OiBcIiM2NjY2NjZcIixcblx0XHRyZXF1aXJlZDogZmFsc2Vcblx0fSxcblx0c3Ryb2tlQ29sb3I6IHtcblx0XHR0eXBlOiAnc3RyaW5nJyxcblx0XHR0aXRsZTogJ1N0cm9rZSBDb2xvcicsXG5cdFx0Zm9ybWF0OiAnY29sb3InLFxuXHRcdGRlZmF1bHQ6ICcjZmYwMDAwJyxcblx0XHRyZXF1aXJlZDogZmFsc2Vcblx0fSxcbn07XG5cbmNvbnN0IE1PRFVMRV9UdXJ0bGUgPSB7XG5cdHZpejogVklaX1R1cnRsZSxcblx0bmFtZTogXCJUdXJ0bGVcIixcblx0ZGVzY3JpcHRpb246IFwiXCIsXG5cdGNvbmZpZ1NjaGVtYTogU0NIRU1BX1R1cnRsZVxufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IE1PRFVMRV9UdXJ0bGU7IiwiICAgICAgICBcbi8vIG51bWJlciBvZiBpdGVyYXRpb25zIGZvclxuLy8gdGhlIHJlaW1hbiB6ZXRhIGZ1bmN0aW9uIGNvbXB1dGF0aW9uXG5jb25zdCBudW1faXRlciA9IDEwXG5cbmNsYXNzIFZJWl9aZXRhIHtcbiAgICAgICAgY29uc3RydWN0b3Ioc2VxLCBza2V0Y2gsIGNvbmZpZyl7XG4gICAgICAgICAgICAgICAgLy8gU2VxdWVuY2UgbGFiZWxcbiAgICAgICAgICAgICAgICB0aGlzLnNlcSA9IHNlcVxuICAgICAgICAgICAgICAgIC8vIFA1IHNrZXRjaCBvYmplY3RcbiAgICAgICAgICAgICAgICB0aGlzLnNrZXRjaCA9IHNrZXRjaFxuICAgICAgICB9XG5cbiAgICAgICAgc2V0dXAoKXtcbiAgICAgICAgICAgICAgICB0aGlzLml0ZXIgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMuc2tldGNoLnBpeGVsRGVuc2l0eSgxKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNrZXRjaC5mcmFtZVJhdGUoMSk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIG1hcHBpbmdGdW5jKHhfLCB5XywgaXRlcnMpIHtcbiAgICAgICAgICAgICAgICBsZXQgYSA9IHhfO1xuICAgICAgICAgICAgICAgIGxldCBiID0geV87XG4gICAgICAgICAgICAgICAgbGV0IG5fID0gMDtcbiAgICAgICAgICAgICAgICB3aGlsZShuXyA8IGl0ZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBhYSA9IGEqYTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGJiID0gYipiO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYWIgPSAyLjAgKiBhICogYjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgYSA9IGFhIC0gYmIgKyB4XztcbiAgICAgICAgICAgICAgICAgICAgICAgIGIgPSBhYiArIHlfO1xuICAgICAgICAgICAgICAgICAgICAgICAgbl8rKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2tldGNoLmRpc3QoYSwgYiwgMCwgMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtYXBwaW5nRnVuYyh4XywgeV8sIGl0ZXJzKSB7XG4gICAgICAgIC8vICAgICAgICAgbGV0IGEgPSB4XztcbiAgICAgICAgLy8gICAgICAgICBsZXQgbl8gPSAwO1xuICAgICAgICAvLyAgICAgICAgIGxldCBSID0gMi4wO1xuICAgICAgICAvLyAgICAgICAgIHdoaWxlKG5fIDwgaXRlcnMpIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIGNvbnN0IG5leHQgPSBSICogYSAqICgxIC0gYSk7XG4gICAgICAgIC8vICAgICAgICAgICAgICAgICBhID0gbmV4dDtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIG5fICsrO1xuICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgLy8gICAgICAgICByZXR1cm4gYTtcbiAgICAgICAgLy8gfVxuICAgICAgICAvL1xuXG4gICAgICAgIGRyYXdNYXAobWF4aXRlcmF0aW9ucyl7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnNrZXRjaC5iYWNrZ3JvdW5kKDApO1xuICAgICAgICAgICAgICAgIGNvbnN0IHcgPSA0O1xuICAgICAgICAgICAgICAgIGNvbnN0IGggPSAodyAqIHRoaXMuc2tldGNoLmhlaWdodCkgLyB0aGlzLnNrZXRjaC53aWR0aDtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHhtaW4gPSAtdy8yO1xuICAgICAgICAgICAgICAgIGNvbnN0IHltaW4gPSAtaC8yO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5za2V0Y2gubG9hZFBpeGVscygpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgeG1heCA9IHhtaW4gKyB3O1xuICAgICAgICAgICAgICAgIGNvbnN0IHltYXggPSB5bWluICsgaDtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGR4ID0gKHhtYXggLSB4bWluKSAvICh0aGlzLnNrZXRjaC53aWR0aCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZHkgPSAoeW1heCAtIHltaW4pIC8gKHRoaXMuc2tldGNoLmhlaWdodCk7XG5cbiAgICAgICAgICAgICAgICBsZXQgeSA9IHltaW47XG4gICAgICAgICAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHRoaXMuc2tldGNoLmhlaWdodDsgKytpKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB4ID0geG1pbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcihsZXQgaiA9IDA7IGogPCB0aGlzLnNrZXRjaC53aWR0aDsgKytqKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG4gPSB0aGlzLm1hcHBpbmdGdW5jKHgsIHksIG1heGl0ZXJhdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNdWx0aXBseSBjb21wbGV4IG51bWJlcnMgbWF4aXRlcmF0aW9ucyB0aW1lc1xuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW5kZXggb2YgdGhlIHBpeGVsIGJhc2VkIG9uIGksIGogKDQgc3Bhbm5lZCBhcnJheSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGl4ID0gKGogKyBpKnRoaXMuc2tldGNoLndpZHRoKSAqIDQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJvcG9ydGlvbmFsaXR5IHNvbHZlcjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbWFwcyBuICBcXGluIFswLCBtYXhpdGVyYXRpb25zXSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdG8gICBuJyBcXGluIFswLCAxXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBub3JtID0gdGhpcy5za2V0Y2gubWFwKG4sIDAsIG1heGl0ZXJhdGlvbnMsIDAsIDEpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0cmFpbiBiZXR3ZWVuIDAgYW5kIDI1NVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgY29sbyA9IHRoaXMuc2tldGNoLm1hcChNYXRoLnNxcnQobm9ybSksIDAsIDEsIDAsIDI1NSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG4gPT0gbWF4aXRlcmF0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG8gPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJHQiBjb2xvcmluZyBnZXRzIGluZGV4ZWQgaGVyZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2tldGNoLnBpeGVsc1twaXggKyAwXSA9IGNvbG87XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5za2V0Y2gucGl4ZWxzW3BpeCArIDFdID0gY29sbztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNrZXRjaC5waXhlbHNbcGl4ICsgMl0gPSBjb2xvO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQWxwaGE6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvUkdCQV9jb2xvcl9tb2RlbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgb3BhY2l0eVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2tldGNoLnBpeGVsc1twaXggKyAzXSA9IDI1NTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB4ICs9IGR4O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgeSArPSBkeTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLnNrZXRjaC51cGRhdGVQaXhlbHMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRyYXcoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3TWFwKHRoaXMuaXRlcik7XG4gICAgICAgICAgICAgICAgdGhpcy5pdGVyID0gKHRoaXMuaXRlciArIDEpICUgMjAwO1xuICAgICAgICB9XG5cblxuXG5cbn1cblxuY29uc3QgU0NIRU1BX1pldGEgPSB7XG4gICAgICAgICAgICBuOiB7XG4gICAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgICAgICAgIHRpdGxlOiAnTicsXG4gICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ051bWJlciBvZiBlbGVtZW50cycsXG4gICAgICAgICAgICAgICAgICByZXF1aXJlZDogdHJ1ZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgTGV2ZWxzOiB7XG4gICAgICAgICAgICAgICAgICB0eXBlOiAnbnVtYmVyJyxcbiAgICAgICAgICAgICAgICAgIHRpdGxlOiAnTGV2ZWxzJyxcbiAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnTnVtYmVyIG9mIGxldmVscycsXG4gICAgICAgICAgICAgICAgICByZXF1aXJlZDogdHJ1ZVxuICAgICAgICAgIH0sXG4gIH07XG5cblxuY29uc3QgTU9EVUxFX1pldGEgPSB7XG4gICAgdml6OiBWSVpfWmV0YSxcbiAgICBuYW1lOiAnWmV0YScsXG4gICAgZGVzY3JpcHRpb246ICcnLFxuICAgIGNvbmZpZ1NjaGVtYTogU0NIRU1BX1pldGFcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNT0RVTEVfWmV0YVxuICAgIFxuIiwiLy9BZGQgYW4gaW1wb3J0IGxpbmUgaGVyZSBmb3IgbmV3IG1vZHVsZXNcblxuXG4vL0FkZCBuZXcgbW9kdWxlcyB0byB0aGlzIGNvbnN0YW50LlxuY29uc3QgTU9EVUxFUyA9IHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1PRFVMRVM7XG5cbi8qanNoaW50IGlnbm9yZTpzdGFydCAqL1xuTU9EVUxFU1tcIlR1cnRsZVwiXSA9IHJlcXVpcmUoJy4vbW9kdWxlVHVydGxlLmpzJyk7XG5NT0RVTEVTW1wiU2hpZnRDb21wYXJlXCJdID0gcmVxdWlyZSgnLi9tb2R1bGVTaGlmdENvbXBhcmUuanMnKTtcbk1PRFVMRVNbXCJEaWZmZXJlbmNlc1wiXSA9IHJlcXVpcmUoJy4vbW9kdWxlRGlmZmVyZW5jZXMuanMnKTtcbk1PRFVMRVNbXCJNb2RGaWxsXCJdID0gcmVxdWlyZSgnLi9tb2R1bGVNb2RGaWxsLmpzJyk7XG5NT0RVTEVTWydaZXRhJ10gPSByZXF1aXJlKCcuL21vZHVsZVpldGEuanMnKVxuIiwiU0VRX2xpbmVhclJlY3VycmVuY2UgPSByZXF1aXJlKCcuL3NlcXVlbmNlTGluUmVjLmpzJyk7XG5cbmZ1bmN0aW9uIEdFTl9maWJvbmFjY2koe1xuICAgIG1cbn0pIHtcbiAgICByZXR1cm4gU0VRX2xpbmVhclJlY3VycmVuY2UuZ2VuZXJhdG9yKHtcbiAgICAgICAgY29lZmZpY2llbnRMaXN0OiBbMSwgMV0sXG4gICAgICAgIHNlZWRMaXN0OiBbMSwgMV0sXG4gICAgICAgIG1cbiAgICB9KTtcbn1cblxuY29uc3QgU0NIRU1BX0ZpYm9uYWNjaSA9IHtcbiAgICBtOiB7XG4gICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICB0aXRsZTogJ01vZCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQSBudW1iZXIgdG8gbW9kIHRoZSBzZXF1ZW5jZSBieSBieScsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZVxuICAgIH1cbn07XG5cblxuY29uc3QgU0VRX2ZpYm9uYWNjaSA9IHtcbiAgICBnZW5lcmF0b3I6IEdFTl9maWJvbmFjY2ksXG4gICAgbmFtZTogXCJGaWJvbmFjY2lcIixcbiAgICBkZXNjcmlwdGlvbjogXCJcIixcbiAgICBwYXJhbXNTY2hlbWE6IFNDSEVNQV9GaWJvbmFjY2lcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU0VRX2ZpYm9uYWNjaTsiLCJmdW5jdGlvbiBHRU5fbGluZWFyUmVjdXJyZW5jZSh7XG4gICAgY29lZmZpY2llbnRMaXN0LFxuICAgIHNlZWRMaXN0LFxuICAgIG1cbn0pIHtcbiAgICBpZiAoY29lZmZpY2llbnRMaXN0Lmxlbmd0aCAhPSBzZWVkTGlzdC5sZW5ndGgpIHtcbiAgICAgICAgLy9OdW1iZXIgb2Ygc2VlZHMgc2hvdWxkIG1hdGNoIHRoZSBudW1iZXIgb2YgY29lZmZpY2llbnRzXG4gICAgICAgIGNvbnNvbGUubG9nKFwibnVtYmVyIG9mIGNvZWZmaWNpZW50cyBub3QgZXF1YWwgdG8gbnVtYmVyIG9mIHNlZWRzIFwiKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGxldCBrID0gY29lZmZpY2llbnRMaXN0Lmxlbmd0aDtcbiAgICBsZXQgZ2VuZXJpY0xpblJlYztcbiAgICBpZiAobSAhPSBudWxsKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29lZmZpY2llbnRMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb2VmZmljaWVudExpc3RbaV0gPSBjb2VmZmljaWVudExpc3RbaV0gJSBtO1xuICAgICAgICAgICAgc2VlZExpc3RbaV0gPSBzZWVkTGlzdFtpXSAlIG07XG4gICAgICAgIH1cbiAgICAgICAgZ2VuZXJpY0xpblJlYyA9IGZ1bmN0aW9uIChuLCBjYWNoZSkge1xuICAgICAgICAgICAgaWYgKG4gPCBzZWVkTGlzdC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjYWNoZVtuXSA9IHNlZWRMaXN0W25dO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYWNoZVtuXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBjYWNoZS5sZW5ndGg7IGkgPD0gbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0IHN1bSA9IDA7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBrOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgc3VtICs9IGNhY2hlW2kgLSBqIC0gMV0gKiBjb2VmZmljaWVudExpc3Rbal07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhY2hlW2ldID0gc3VtICUgbTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjYWNoZVtuXTtcbiAgICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBnZW5lcmljTGluUmVjID0gZnVuY3Rpb24gKG4sIGNhY2hlKSB7XG4gICAgICAgICAgICBpZiAobiA8IHNlZWRMaXN0Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNhY2hlW25dID0gc2VlZExpc3Rbbl07XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhY2hlW25dO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gY2FjaGUubGVuZ3RoOyBpIDw9IG47IGkrKykge1xuICAgICAgICAgICAgICAgIGxldCBzdW0gPSAwO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgazsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1bSArPSBjYWNoZVtpIC0gaiAtIDFdICogY29lZmZpY2llbnRMaXN0W2pdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYWNoZVtpXSA9IHN1bTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBjYWNoZVtuXTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIGdlbmVyaWNMaW5SZWM7XG59XG5cbmNvbnN0IFNDSEVNQV9saW5lYXJSZWN1cnJlbmNlID0ge1xuICAgIGNvZWZmaWNpZW50TGlzdDoge1xuICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgdGl0bGU6ICdDb2VmZmljaWVudHMgbGlzdCcsXG4gICAgICAgIGZvcm1hdDogJ2xpc3QnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0NvbW1hIHNlcGVyYXRlZCBudW1iZXJzJyxcbiAgICAgICAgcmVxdWlyZWQ6IHRydWVcbiAgICB9LFxuICAgIHNlZWRMaXN0OiB7XG4gICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICB0aXRsZTogJ1NlZWQgbGlzdCcsXG4gICAgICAgIGZvcm1hdDogJ2xpc3QnLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ0NvbW1hIHNlcGVyYXRlZCBudW1iZXJzJyxcbiAgICAgICAgcmVxdWlyZWQ6IHRydWVcbiAgICB9LFxuICAgIG06IHtcbiAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgIHRpdGxlOiAnTW9kJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBIG51bWJlciB0byBtb2QgdGhlIHNlcXVlbmNlIGJ5IGJ5JyxcbiAgICAgICAgcmVxdWlyZWQ6IGZhbHNlXG4gICAgfVxufTtcblxuXG5jb25zdCBTRVFfbGluZWFyUmVjdXJyZW5jZSA9IHtcbiAgICBnZW5lcmF0b3I6IEdFTl9saW5lYXJSZWN1cnJlbmNlLFxuICAgIG5hbWU6IFwiTGluZWFyIFJlY3VycmVuY2VcIixcbiAgICBkZXNjcmlwdGlvbjogXCJcIixcbiAgICBwYXJhbXNTY2hlbWE6IFNDSEVNQV9saW5lYXJSZWN1cnJlbmNlXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNFUV9saW5lYXJSZWN1cnJlbmNlOyIsImNvbnN0IFNFUV9saW5lYXJSZWN1cnJlbmNlID0gcmVxdWlyZSgnLi9zZXF1ZW5jZUxpblJlYy5qcycpO1xuXG5mdW5jdGlvbiBHRU5fTHVjYXMoe1xuICAgIG1cbn0pIHtcbiAgICByZXR1cm4gU0VRX2xpbmVhclJlY3VycmVuY2UuZ2VuZXJhdG9yKHtcbiAgICAgICAgY29lZmZpY2llbnRMaXN0OiBbMSwgMV0sXG4gICAgICAgIHNlZWRMaXN0OiBbMiwgMV0sXG4gICAgICAgIG1cbiAgICB9KTtcbn1cblxuY29uc3QgU0NIRU1BX0x1Y2FzID0ge1xuICAgIG06IHtcbiAgICAgICAgdHlwZTogJ251bWJlcicsXG4gICAgICAgIHRpdGxlOiAnTW9kJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdBIG51bWJlciB0byBtb2QgdGhlIHNlcXVlbmNlIGJ5IGJ5JyxcbiAgICAgICAgcmVxdWlyZWQ6IGZhbHNlXG4gICAgfVxufTtcblxuXG5jb25zdCBTRVFfTHVjYXMgPSB7XG4gICAgZ2VuZXJhdG9yOiBHRU5fTHVjYXMsXG4gICAgbmFtZTogXCJMdWNhc1wiLFxuICAgIGRlc2NyaXB0aW9uOiBcIlwiLFxuICAgIHBhcmFtc1NjaGVtYTogU0NIRU1BX0x1Y2FzXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNFUV9MdWNhczsiLCJmdW5jdGlvbiBHRU5fTmF0dXJhbHMoe1xuICAgIGluY2x1ZGV6ZXJvXG59KSB7XG4gICAgaWYgKGluY2x1ZGV6ZXJvKSB7XG4gICAgICAgIHJldHVybiAoKG4pID0+IG4pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiAoKG4pID0+IG4gKyAxKTtcbiAgICB9XG59XG5cbmNvbnN0IFNDSEVNQV9OYXR1cmFscyA9IHtcbiAgICBpbmNsdWRlemVybzoge1xuICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIHRpdGxlOiAnSW5jbHVkZSB6ZXJvJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICcnLFxuICAgICAgICBkZWZhdWx0OiAnZmFsc2UnLFxuICAgICAgICByZXF1aXJlZDogZmFsc2VcbiAgICB9XG59O1xuXG5cbmNvbnN0IFNFUV9OYXR1cmFscyA9IHtcbiAgICBnZW5lcmF0b3I6IEdFTl9OYXR1cmFscyxcbiAgICBuYW1lOiBcIk5hdHVyYWxzXCIsXG4gICAgZGVzY3JpcHRpb246IFwiXCIsXG4gICAgcGFyYW1zU2NoZW1hOiBTQ0hFTUFfTmF0dXJhbHNcbn07XG5cbi8vIGV4cG9ydCBkZWZhdWx0IFNFUV9OYXR1cmFsc1xubW9kdWxlLmV4cG9ydHMgPSBTRVFfTmF0dXJhbHM7IiwiZnVuY3Rpb24gR0VOX1ByaW1lcygpIHtcbiAgICBjb25zdCBwcmltZXMgPSBmdW5jdGlvbiAobiwgY2FjaGUpIHtcbiAgICAgICAgaWYgKGNhY2hlLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICBjYWNoZS5wdXNoKDIpO1xuICAgICAgICAgICAgY2FjaGUucHVzaCgzKTtcbiAgICAgICAgICAgIGNhY2hlLnB1c2goNSk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGkgPSBjYWNoZVtjYWNoZS5sZW5ndGggLSAxXSArIDE7XG4gICAgICAgIGxldCBrID0gMDtcbiAgICAgICAgd2hpbGUgKGNhY2hlLmxlbmd0aCA8PSBuKSB7XG4gICAgICAgICAgICBsZXQgaXNQcmltZSA9IHRydWU7XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNhY2hlLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKGkgJSBjYWNoZVtqXSA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzUHJpbWUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzUHJpbWUpIHtcbiAgICAgICAgICAgICAgICBjYWNoZS5wdXNoKGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjYWNoZVtuXTtcbiAgICB9O1xuICAgIHJldHVybiBwcmltZXM7XG59XG5cblxuY29uc3QgU0NIRU1BX1ByaW1lcyA9IHtcbiAgICBtOiB7XG4gICAgICAgIHR5cGU6ICdudW1iZXInLFxuICAgICAgICB0aXRsZTogJ01vZCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQSBudW1iZXIgdG8gbW9kIHRoZSBzZXF1ZW5jZSBieScsXG4gICAgICAgIHJlcXVpcmVkOiBmYWxzZVxuICAgIH1cbn07XG5cblxuY29uc3QgU0VRX1ByaW1lcyA9IHtcbiAgICBnZW5lcmF0b3I6IEdFTl9QcmltZXMsXG4gICAgbmFtZTogXCJQcmltZXNcIixcbiAgICBkZXNjcmlwdGlvbjogXCJcIixcbiAgICBwYXJhbXNTY2hlbWE6IFNDSEVNQV9QcmltZXNcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU0VRX1ByaW1lczsiLCIvKipcbiAqXG4gKiBAY2xhc3MgU2VxdWVuY2VHZW5lcmF0b3JcbiAqL1xuY2xhc3MgU2VxdWVuY2VHZW5lcmF0b3Ige1xuICAgIC8qKlxuICAgICAqQ3JlYXRlcyBhbiBpbnN0YW5jZSBvZiBTZXF1ZW5jZUdlbmVyYXRvci5cbiAgICAgKiBAcGFyYW0geyp9IGdlbmVyYXRvciBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSBuYXR1cmFsIG51bWJlciBhbmQgcmV0dXJucyBhIG51bWJlciwgaXQgY2FuIG9wdGlvbmFsbHkgdGFrZSB0aGUgY2FjaGUgYXMgYSBzZWNvbmQgYXJndW1lbnRcbiAgICAgKiBAcGFyYW0geyp9IElEIHRoZSBJRCBvZiB0aGUgc2VxdWVuY2VcbiAgICAgKiBAbWVtYmVyb2YgU2VxdWVuY2VHZW5lcmF0b3JcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihJRCwgZ2VuZXJhdG9yKSB7XG4gICAgICAgIHRoaXMuZ2VuZXJhdG9yID0gZ2VuZXJhdG9yO1xuICAgICAgICB0aGlzLklEID0gSUQ7XG4gICAgICAgIHRoaXMuY2FjaGUgPSBbXTtcbiAgICAgICAgdGhpcy5uZXdTaXplID0gMTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogaWYgd2UgbmVlZCB0byBnZXQgdGhlIG50aCBlbGVtZW50IGFuZCBpdCdzIG5vdCBwcmVzZW50IGluXG4gICAgICogaW4gdGhlIGNhY2hlLCB0aGVuIHdlIGVpdGhlciBkb3VibGUgdGhlIHNpemUsIG9yIHRoZSBcbiAgICAgKiBuZXcgc2l6ZSBiZWNvbWVzIG4rMVxuICAgICAqIEBwYXJhbSB7Kn0gbiBcbiAgICAgKiBAbWVtYmVyb2YgU2VxdWVuY2VHZW5lcmF0b3JcbiAgICAgKi9cbiAgICByZXNpemVDYWNoZShuKSB7XG4gICAgICAgIHRoaXMubmV3U2l6ZSA9IHRoaXMuY2FjaGUubGVuZ3RoICogMjtcbiAgICAgICAgaWYgKG4gKyAxID4gdGhpcy5uZXdTaXplKSB7XG4gICAgICAgICAgICB0aGlzLm5ld1NpemUgPSBuICsgMTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBQb3B1bGF0ZXMgdGhlIGNhY2hlIHVwIHVudGlsIHRoZSBjdXJyZW50IG5ld1NpemVcbiAgICAgKiB0aGlzIGlzIGNhbGxlZCBhZnRlciByZXNpemVDYWNoZVxuICAgICAqIEBtZW1iZXJvZiBTZXF1ZW5jZUdlbmVyYXRvclxuICAgICAqL1xuICAgIGZpbGxDYWNoZSgpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMuY2FjaGUubGVuZ3RoOyBpIDwgdGhpcy5uZXdTaXplOyBpKyspIHtcbiAgICAgICAgICAgIC8vdGhlIGdlbmVyYXRvciBpcyBnaXZlbiB0aGUgY2FjaGUgc2luY2UgaXQgd291bGQgbWFrZSBjb21wdXRhdGlvbiBtb3JlIGVmZmljaWVudCBzb21ldGltZXNcbiAgICAgICAgICAgIC8vYnV0IHRoZSBnZW5lcmF0b3IgZG9lc24ndCBuZWNlc3NhcmlseSBuZWVkIHRvIHRha2UgbW9yZSB0aGFuIG9uZSBhcmd1bWVudC5cbiAgICAgICAgICAgIHRoaXMuY2FjaGVbaV0gPSB0aGlzLmdlbmVyYXRvcihpLCB0aGlzLmNhY2hlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXQgZWxlbWVudCBpcyB3aGF0IHRoZSBkcmF3aW5nIHRvb2xzIHdpbGwgYmUgY2FsbGluZywgaXQgcmV0cmlldmVzXG4gICAgICogdGhlIG50aCBlbGVtZW50IG9mIHRoZSBzZXF1ZW5jZSBieSBlaXRoZXIgZ2V0dGluZyBpdCBmcm9tIHRoZSBjYWNoZVxuICAgICAqIG9yIGlmIGlzbid0IHByZXNlbnQsIGJ5IGJ1aWxkaW5nIHRoZSBjYWNoZSBhbmQgdGhlbiBnZXR0aW5nIGl0XG4gICAgICogQHBhcmFtIHsqfSBuIHRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgc2VxdWVuY2Ugd2Ugd2FudFxuICAgICAqIEByZXR1cm5zIGEgbnVtYmVyXG4gICAgICogQG1lbWJlcm9mIFNlcXVlbmNlR2VuZXJhdG9yXG4gICAgICovXG4gICAgZ2V0RWxlbWVudChuKSB7XG4gICAgICAgIGlmICh0aGlzLmNhY2hlW25dICE9IHVuZGVmaW5lZCB8fCB0aGlzLmZpbml0ZSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJjYWNoZSBoaXRcIilcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNhY2hlW25dO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJjYWNoZSBtaXNzXCIpXG4gICAgICAgICAgICB0aGlzLnJlc2l6ZUNhY2hlKG4pO1xuICAgICAgICAgICAgdGhpcy5maWxsQ2FjaGUoKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNhY2hlW25dO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5cbi8qKlxuICpcbiAqXG4gKiBAcGFyYW0geyp9IGNvZGUgYXJiaXRyYXJ5IHNhZ2UgY29kZSB0byBiZSBleGVjdXRlZCBvbiBhbGVwaFxuICogQHJldHVybnMgYWpheCByZXNwb25zZSBvYmplY3RcbiAqL1xuZnVuY3Rpb24gc2FnZUV4ZWN1dGUoY29kZSkge1xuICAgIHJldHVybiAkLmFqYXgoe1xuICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgIGFzeW5jOiBmYWxzZSxcbiAgICAgICAgdXJsOiAnaHR0cDovL2FsZXBoLnNhZ2VtYXRoLm9yZy9zZXJ2aWNlJyxcbiAgICAgICAgZGF0YTogXCJjb2RlPVwiICsgY29kZVxuICAgIH0pO1xufVxuXG4vKipcbiAqXG4gKlxuICogQHBhcmFtIHsqfSBjb2RlIGFyYml0cmFyeSBzYWdlIGNvZGUgdG8gYmUgZXhlY3V0ZWQgb24gYWxlcGhcbiAqIEByZXR1cm5zIGFqYXggcmVzcG9uc2Ugb2JqZWN0XG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHNhZ2VFeGVjdXRlQXN5bmMoY29kZSkge1xuICAgIHJldHVybiBhd2FpdCAkLmFqYXgoe1xuICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgIHVybDogJ2h0dHA6Ly9hbGVwaC5zYWdlbWF0aC5vcmcvc2VydmljZScsXG4gICAgICAgIGRhdGE6IFwiY29kZT1cIiArIGNvZGVcbiAgICB9KTtcbn1cblxuXG5jbGFzcyBPRUlTU2VxdWVuY2VHZW5lcmF0b3Ige1xuICAgIGNvbnN0cnVjdG9yKElELCBPRUlTKSB7XG4gICAgICAgIHRoaXMuT0VJUyA9IE9FSVM7XG4gICAgICAgIHRoaXMuSUQgPSBJRDtcbiAgICAgICAgdGhpcy5jYWNoZSA9IFtdO1xuICAgICAgICB0aGlzLm5ld1NpemUgPSAxO1xuICAgICAgICB0aGlzLnByZWZpbGxDYWNoZSgpO1xuICAgIH1cbiAgICBvZWlzRmV0Y2gobikge1xuICAgICAgICBjb25zb2xlLmxvZyhcIkZldGNoaW5nLi5cIik7XG4gICAgICAgIGxldCBjb2RlID0gYHByaW50KHNsb2FuZS4ke3RoaXMuT0VJU30ubGlzdCgke259KSlgO1xuICAgICAgICBsZXQgcmVzcCA9IHNhZ2VFeGVjdXRlKGNvZGUpO1xuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShyZXNwLnJlc3BvbnNlSlNPTi5zdGRvdXQpO1xuICAgIH1cbiAgICBhc3luYyBwcmVmaWxsQ2FjaGUoKSB7XG4gICAgICAgIHRoaXMucmVzaXplQ2FjaGUoMzAwMCk7XG4gICAgICAgIGxldCBjb2RlID0gYHByaW50KHNsb2FuZS4ke3RoaXMuT0VJU30ubGlzdCgke3RoaXMubmV3U2l6ZX0pKWA7XG4gICAgICAgIGxldCByZXNwID0gYXdhaXQgc2FnZUV4ZWN1dGVBc3luYyhjb2RlKTtcbiAgICAgICAgY29uc29sZS5sb2cocmVzcCk7XG4gICAgICAgIHRoaXMuY2FjaGUgPSB0aGlzLmNhY2hlLmNvbmNhdChKU09OLnBhcnNlKHJlc3Auc3Rkb3V0KSk7XG4gICAgfVxuICAgIHJlc2l6ZUNhY2hlKG4pIHtcbiAgICAgICAgdGhpcy5uZXdTaXplID0gdGhpcy5jYWNoZS5sZW5ndGggKiAyO1xuICAgICAgICBpZiAobiArIDEgPiB0aGlzLm5ld1NpemUpIHtcbiAgICAgICAgICAgIHRoaXMubmV3U2l6ZSA9IG4gKyAxO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZpbGxDYWNoZSgpIHtcbiAgICAgICAgbGV0IG5ld0xpc3QgPSB0aGlzLm9laXNGZXRjaCh0aGlzLm5ld1NpemUpO1xuICAgICAgICB0aGlzLmNhY2hlID0gdGhpcy5jYWNoZS5jb25jYXQobmV3TGlzdCk7XG4gICAgfVxuICAgIGdldEVsZW1lbnQobikge1xuICAgICAgICBpZiAodGhpcy5jYWNoZVtuXSAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNhY2hlW25dO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5yZXNpemVDYWNoZSgpO1xuICAgICAgICAgICAgdGhpcy5maWxsQ2FjaGUoKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNhY2hlW25dO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBCdWlsdEluTmFtZVRvU2VxKElELCBzZXFOYW1lLCBzZXFQYXJhbXMpIHtcbiAgICBsZXQgZ2VuZXJhdG9yID0gQnVpbHRJblNlcXNbc2VxTmFtZV0uZ2VuZXJhdG9yKHNlcVBhcmFtcyk7XG4gICAgcmV0dXJuIG5ldyBTZXF1ZW5jZUdlbmVyYXRvcihJRCwgZ2VuZXJhdG9yKTtcbn1cblxuXG5mdW5jdGlvbiBMaXN0VG9TZXEoSUQsIGxpc3QpIHtcbiAgICBsZXQgbGlzdEdlbmVyYXRvciA9IGZ1bmN0aW9uIChuKSB7XG4gICAgICAgIHJldHVybiBsaXN0W25dO1xuICAgIH07XG4gICAgcmV0dXJuIG5ldyBTZXF1ZW5jZUdlbmVyYXRvcihJRCwgbGlzdEdlbmVyYXRvcik7XG59XG5cbmZ1bmN0aW9uIE9FSVNUb1NlcShJRCwgT0VJUykge1xuICAgIHJldHVybiBuZXcgT0VJU1NlcXVlbmNlR2VuZXJhdG9yKElELCBPRUlTKTtcbn1cblxuXG5jb25zdCBCdWlsdEluU2VxcyA9IHt9O1xuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgICdCdWlsdEluTmFtZVRvU2VxJzogQnVpbHRJbk5hbWVUb1NlcSxcbiAgICAnTGlzdFRvU2VxJzogTGlzdFRvU2VxLFxuICAgICdPRUlTVG9TZXEnOiBPRUlTVG9TZXEsXG4gICAgJ0J1aWx0SW5TZXFzJzogQnVpbHRJblNlcXNcbn07XG5cbi8qanNoaW50IGlnbm9yZTogc3RhcnQgKi9cbkJ1aWx0SW5TZXFzW1wiRmlib25hY2NpXCJdID0gcmVxdWlyZSgnLi9zZXF1ZW5jZUZpYm9uYWNjaS5qcycpO1xuQnVpbHRJblNlcXNbXCJMdWNhc1wiXSA9IHJlcXVpcmUoJy4vc2VxdWVuY2VMdWNhcy5qcycpO1xuQnVpbHRJblNlcXNbXCJQcmltZXNcIl0gPSByZXF1aXJlKCcuL3NlcXVlbmNlUHJpbWVzLmpzJyk7XG5CdWlsdEluU2Vxc1tcIk5hdHVyYWxzXCJdID0gcmVxdWlyZSgnLi9zZXF1ZW5jZU5hdHVyYWxzLmpzJyk7XG5CdWlsdEluU2Vxc1tcIkxpblJlY1wiXSA9IHJlcXVpcmUoJy4vc2VxdWVuY2VMaW5SZWMuanMnKTtcbkJ1aWx0SW5TZXFzWydQcmltZXMnXSA9IHJlcXVpcmUoJy4vc2VxdWVuY2VQcmltZXMuanMnKTsiLCJtb2R1bGUuZXhwb3J0cyA9IFtcIkEwMDAwMDFcIiwgXCJBMDAwMDI3XCIsIFwiQTAwMDAwNFwiLCBcIkEwMDAwMDVcIiwgXCJBMDAwMDA4XCIsIFwiQTAwMDAwOVwiLCBcIkEwMDA3OTZcIiwgXCJBMDAzNDE4XCIsIFwiQTAwNzMxOFwiLCBcIkEwMDgyNzVcIiwgXCJBMDA4Mjc3XCIsIFwiQTA0OTMxMFwiLCBcIkEwMDAwMTBcIiwgXCJBMDAwMDA3XCIsIFwiQTAwNTg0M1wiLCBcIkEwMDAwMzVcIiwgXCJBMDAwMTY5XCIsIFwiQTAwMDI3MlwiLCBcIkEwMDAzMTJcIiwgXCJBMDAxNDc3XCIsIFwiQTAwNDUyNlwiLCBcIkEwMDAzMjZcIiwgXCJBMDAyMzc4XCIsIFwiQTAwMjYyMFwiLCBcIkEwMDU0MDhcIiwgXCJBMDAwMDEyXCIsIFwiQTAwMDEyMFwiLCBcIkEwMTAwNjBcIiwgXCJBMDAwMDY5XCIsIFwiQTAwMTk2OVwiLCBcIkEwMDAyOTBcIiwgXCJBMDAwMjI1XCIsIFwiQTAwMDAxNVwiLCBcIkEwMDAwMTZcIiwgXCJBMDAwMDMyXCIsIFwiQTAwNDA4NlwiLCBcIkEwMDIxMTNcIiwgXCJBMDAwMDMwXCIsIFwiQTAwMDA0MFwiLCBcIkEwMDI4MDhcIiwgXCJBMDE4MjUyXCIsIFwiQTAwMDA0M1wiLCBcIkEwMDA2NjhcIiwgXCJBMDAwMzk2XCIsIFwiQTAwNTEwMFwiLCBcIkEwMDUxMDFcIiwgXCJBMDAyMTEwXCIsIFwiQTAwMDcyMFwiLCBcIkEwNjQ1NTNcIiwgXCJBMDAxMDU1XCIsIFwiQTAwNjUzMFwiLCBcIkEwMDA5NjFcIiwgXCJBMDA1MTE3XCIsIFwiQTAyMDYzOVwiLCBcIkEwMDAwNDFcIiwgXCJBMDAwMDQ1XCIsIFwiQTAwMDEwOFwiLCBcIkEwMDEwMDZcIiwgXCJBMDAwMDc5XCIsIFwiQTAwMDU3OFwiLCBcIkEwMDAyNDRcIiwgXCJBMDAwMzAyXCIsIFwiQTAwMDU4M1wiLCBcIkEwMDAxNDJcIiwgXCJBMDAwMDg1XCIsIFwiQTAwMTE4OVwiLCBcIkEwMDA2NzBcIiwgXCJBMDA2MzE4XCIsIFwiQTAwMDE2NVwiLCBcIkEwMDExNDdcIiwgXCJBMDA2ODgyXCIsIFwiQTAwMDk4NFwiLCBcIkEwMDE0MDVcIiwgXCJBMDAwMjkyXCIsIFwiQTAwMDMzMFwiLCBcIkEwMDAxNTNcIiwgXCJBMDAwMjU1XCIsIFwiQTAwMDI2MVwiLCBcIkEwMDE5MDlcIiwgXCJBMDAxOTEwXCIsIFwiQTA5MDAxMFwiLCBcIkEwNTU3OTBcIiwgXCJBMDkwMDEyXCIsIFwiQTA5MDAxM1wiLCBcIkEwOTAwMTRcIiwgXCJBMDkwMDE1XCIsIFwiQTA5MDAxNlwiLCBcIkEwMDAxNjZcIiwgXCJBMDAwMjAzXCIsIFwiQTAwMTE1N1wiLCBcIkEwMDg2ODNcIiwgXCJBMDAwMjA0XCIsIFwiQTAwMDIxN1wiLCBcIkEwMDAxMjRcIiwgXCJBMDAyMjc1XCIsIFwiQTAwMTExMFwiLCBcIkEwNTE5NTlcIiwgXCJBMDAxMjIxXCIsIFwiQTAwMTIyMlwiLCBcIkEwNDY2NjBcIiwgXCJBMDAxMjI3XCIsIFwiQTAwMTM1OFwiLCBcIkEwMDE2OTRcIiwgXCJBMDAxODM2XCIsIFwiQTAwMTkwNlwiLCBcIkEwMDEzMzNcIiwgXCJBMDAxMDQ1XCIsIFwiQTAwMDEyOVwiLCBcIkEwMDExMDlcIiwgXCJBMDE1NTIxXCIsIFwiQTAxNTUyM1wiLCBcIkEwMTU1MzBcIiwgXCJBMDE1NTMxXCIsIFwiQTAxNTU1MVwiLCBcIkEwODI0MTFcIiwgXCJBMDgzMTAzXCIsIFwiQTA4MzEwNFwiLCBcIkEwODMxMDVcIiwgXCJBMDgzMjE2XCIsIFwiQTA2MTA4NFwiLCBcIkEwMDAyMTNcIiwgXCJBMDAwMDczXCIsIFwiQTA3OTkyMlwiLCBcIkEwNzk5MjNcIiwgXCJBMTA5ODE0XCIsIFwiQTExMTc3NFwiLCBcIkExMTE3NzVcIiwgXCJBMTExNzg3XCIsIFwiQTAwMDExMFwiLCBcIkEwMDA1ODdcIiwgXCJBMDAwMTAwXCJdXG4iXX0=
