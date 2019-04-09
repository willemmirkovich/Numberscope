
import {SequenceGenerator,BuiltInSeqs} from './Sequence.js'
import MODULES_JSON from '../modules/modules.js'


const NScore = function () {
	var modules = MODULES_JSON
	var preparedSequences = [];
	var preparedTools = [];
	var liveSketches = [];

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
				console.log("divID: " + divID + " WIDTH: " + width + " HEIGHT: " + height)
				moduleInstance.setup();
			};

			sketch.draw = function () {
				moduleInstance.draw()
			}
		}, div.id);
		return myp5;
	}

	const receiveModule = function (moduleObj) {
		if ((moduleObj.ID && moduleObj.moduleName && moduleObj.config && modules[moduleObj.moduleName]) == undefined) {
			console.error("One or more undefined module properties received in NScore");
			console.log(moduleObj)
		} else {
			preparedTools[moduleObj.ID] = {
				module: modules[moduleObj.moduleName],
				config: moduleObj.config,
				ID: moduleObj.ID
			};
		}
	}

	const receiveSequence = function (seqObj) {
		if ((seqObj.ID && seqObj.inputType && seqObj.inputValue && seqObj.parameters) == undefined) {
			console.error("One or more undefined module properties received in NScore");
		} else {
			if (seqObj.inputType == "builtIn") {
				if (BuiltInSeqs[seqObj.inputValue] == undefined) {
					console.error("undefined or unimplemented sequence: " + seqObj.inputValue);
				} else {
					seqObj.parameters['ID'] = seqObj.ID;
					console.log(seqObj.parameters)
					preparedSequences[seqObj.ID] = BuiltInSeqs[seqObj.inputValue](seqObj.parameters);
				}
			}
			if (seqObj.inputType == "OEIS") {
				console.error("Not Implemented");
			}
			if (seqObj.inputType == "list") {
				console.error("Not Implemented");
			}
			if (seqObj.inputType == "code") {
				console.error("Not Implemented");
			}
		}
	}
	const beginDraw = function (seqVizPairs) {
		//Determining each canvas gets
		let totalWidth = document.getElementById('canvasArea').offsetWidth;
		let totalHeight = document.getElementById('canvasArea').offsetHeight;
		let canvasCount = seqVizPairs.length
		let gridSize = Math.ceil(Math.sqrt(canvasCount));
		let individualWidth = totalWidth / gridSize - 20
		let individualHeight = totalHeight / gridSize
		console.log("CANVAS COUNT: " + canvasCount + " GRIDSIZE: " + gridSize + " INDHEIGHT " + individualHeight + " INDWIDTH " + individualWidth)
		for (let pair of seqVizPairs) {
			let currentSeq = preparedSequences[pair["seqID"]];
			let currentTool = preparedTools[pair["toolID"]];
			if (currentSeq && currentTool == undefined) {
				console.error("undefined ID for tool or sequence");
			}
			liveSketches.push(generateP5(currentTool['module'], currentTool['config'], currentSeq, liveSketches.length, individualWidth, individualHeight));
		}
	}

	const clearCanvasArea = function () {
		if (liveSketches.length == 0) {
			return;
		} else {
			for (let i = 0; i < liveSketches.length; i++) {
				liveSketches[i].remove() //delete canvas element
			}
		}
	}
	return {
		receiveSequence: receiveSequence,
		receiveModule: receiveModule,
		beginDraw: beginDraw,
		clearCanvasArea: clearCanvasArea,
		liveSketches: liveSketches,
		preparedSequences: preparedSequences,
		preparedTools: preparedTools,
		modules: modules
	}
}()

window.NScore = NScore
export default NScore


//1 OEIS input working
//2 make it easy modules
//3 make it easy to add builtincon