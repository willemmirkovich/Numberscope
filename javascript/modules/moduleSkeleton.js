

//An example module


class Example_MODULE{
	constructor(config, seq, sketch){
	//Sketch is your canvas
	//config is the parameters you expect
	//seq is the sequence you are drawing

	//you can define what you want here
	this.width = sketch.width
	this.height = sketch.height
	}
	//define whatever functions you want
	setup(){	//This will be called once
		//runs once
	}
	draw(){		//This will be called everytime to draw
		//this runs repeatedly
	}
}