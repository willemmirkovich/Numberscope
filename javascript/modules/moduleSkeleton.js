

//An example module


class Example_MODULE{
	constructor(config, seq, sketch){
	//Sketch is your canvas
	//config is the parameters you expect
	//seq is the sequence you are drawing

	//you can define what you want here
	this.myVar1 = undefined
	this.myVar2 = undefined
	this.myVar3 = undefined
	}
	//define whatever functions you want
	helpFunc(){ 
		return undefined
	}
	hlepfunc2(){
		return undefined
	}
	setup(){	//This will be called once
		this.sketch.noLoop();
	}
	draw(){		//This will be called everytime to draw
		this.sketch.line(50,50,100,100);
	}
}