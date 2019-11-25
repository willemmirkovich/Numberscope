import {
	BuiltInSeqs,
	ListToSeq,
	OEISToSeq
} from './Sequence.js'
import {
	VALIDOEIS
} from './validOEIS.js'
import MODULES from '../modules/modules.js'


function stringToArray(strArr) {
	return JSON.parse("[" + strArr + "]")
}

export const NScore = function () {
	const modules = MODULES //  classes to the drawing modules 
	const validOEIS = VALIDOEIS
	var preparedSequences = []; // sequenceGenerators to be drawn
	var preparedTools = []; // chosen drawing modules 
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
		console.log("divID: " + divID)
		var div = document.createElement('div');
		//The style of the canvases will be "canvasClass"
		div.className = "canvasClass"
		div.id = "liveCanvas" + divID
		console.log(document.getElementById("canvasArea"))
		document.getElementById("canvasArea").appendChild(div);
		//-------------------------------------------
		//Create P5js instance
		let myp5 = new p5(function (sketch) {
			let moduleInstance = new moduleClass(config, seq, sketch)
			sketch.setup = function () {
				sketch.createCanvas(width, height);
				sketch.background("white")
				console.log("divID: " + divID + " WIDTH: " + width + " HEIGHT: " + height)
				moduleInstance.setup();
			};

			sketch.draw = function () {
				moduleInstance.draw()
			}
		}, div.id);
		return myp5;
	}

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
			console.log(moduleObj)
		} else {
			preparedTools[moduleObj.ID] = {
				module: modules[moduleObj.moduleKey],
				config: moduleObj.config,
				ID: moduleObj.ID
			};
		}
	}

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
				if (BuiltInSeqs[seqObj.inputValue].generator == undefined) {
					console.error("undefined or unimplemented sequence: " + seqObj.inputValue);
				} else {
					seqObj.parameters['ID'] = seqObj.ID;
					try {
						// for linRec these two parameters are strings, we have to conver them to arrays
						if (seqObj.inputValue == "linRec") {
							seqObj.parameters['coefficientList'] = stringToArray(seqObj.parameters['coefficientList']);
							seqObj.parameters['seedList'] = stringToArray(seqObj.parameters['seedList']);
						}
						preparedSequences[seqObj.ID] = BuiltInSeqs[seqObj.inputValue].generator(seqObj.parameters);
					} catch (err) {
						console.error("Error initializing built in seq: " + err)
					}
				}
			}
			if (seqObj.inputType == "OEIS") {
				if (NScore.validOEIS.includes(seqObj.inputValue)) {
					preparedSequences[seqObj.ID] = OEISToSeq(seqObj.ID, seqObj.inputValue);
				} else {
					console.error("Not a valid OEIS sequence")
				}
			}
			if (seqObj.inputType == "list") {
				try {
					let list = JSON.parse(seqObj.inputValue)
					preparedSequences[seqObj.ID] = ListToSeq(seqObj.ID, list);
				} catch (err) {
					console.error("Error initializing seq from list: " + err);
				}
			}
			if (seqObj.inputType == "code") {
				console.error("Not implemented")
			}
		}
	}
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

		//Figuring out layout
		//--------------------------------------
		let totalWidth = document.getElementById('canvasArea').offsetWidth;
		let totalHeight = document.getElementById('canvasArea').offsetHeight;
		let canvasCount = seqVizPairs.length
		let gridSize = Math.ceil(Math.sqrt(canvasCount));
		let individualWidth = totalWidth / gridSize - 20
		let individualHeight = totalHeight / gridSize
		//--------------------------------------

		console.log("CANVAS COUNT: " + canvasCount + " GRIDSIZE: " + gridSize + " INDHEIGHT " + individualHeight + " INDWIDTH " + individualWidth)
		for (let pair of seqVizPairs) {
			console.log(preparedSequences)
			let currentSeq = preparedSequences[pair["seqID"]];
			let currentTool = preparedTools[pair["toolID"]];
			if (currentSeq && currentTool == undefined) {
				console.error("undefined ID for tool or sequence");
			}
			liveSketches.push(generateP5(currentTool['module']["viz"], currentTool['config'], currentSeq, liveSketches.length, individualWidth, individualHeight));
		}
	}

	const clear = function () {
		if (liveSketches.length == 0) {
			return;
		} else {
			for (let i = 0; i < liveSketches.length; i++) {
				liveSketches[i].remove() //delete canvas element
			}
		}
	}

	const pause = function () {
		liveSketches.forEach(function (sketch) {
			sketch.noLoop();
		})
	}

	const resume = function () {
		liveSketches.forEach(function (sketch) {
			sketch.loop()
		})
	}

	const step = function () {
		liveSketches.forEach(function (sketch) {
			sketch.redraw();
		})
	}

	return {
		receiveSequence: receiveSequence,
		receiveModule: receiveModule,
		liveSketches: liveSketches,
		preparedSequences: preparedSequences,
		preparedTools: preparedTools,
		modules: modules,
		validOEIS: validOEIS,
		BuiltInSeqs: BuiltInSeqs,
		begin: begin,
		pause: pause,
		resume: resume,
		step: step,
		clear: clear,
	}
}()

window.NScore = NScore