class Turtle_MODULE{
	constructor(config, seq, sketch){
		this.config = config;
		this.rotMap = config.rotMap;
        this.stepSize = config.stepSize;
        this.bgColor = config.bgColor;
		this.seq = seq;
		this.currentIndex = 0;
        this.orientation = 0;
        this.sketch = sketch
	}
	stepDraw(){
	    let oldX = this.X;
	    let oldY = this.Y;
	    let angle = this.rotMap[this.seq.getElement(this.currentIndex++)];
	    this.orientation = (this.orientation + angle);
	    this.X += this.stepSize*Math.cos(this.orientation);
	    this.Y += this.stepSize*Math.sin(this.orientation);
	    this.sketch.line(oldX, oldY, this.X,this.Y);
	}
	setup(){ //Module's setup function will be called by the controller
		this.X = this.sketch.width/2;
		this.Y = this.sketch.height/2;
		this.sketch.background(this.bgColor);
	}
	draw(){ //Module's draw function will be called by the controller 
		this.stepDraw();
		if(this.seq.cache.length > 4000){
			this.sketch.noLoop()
		}
	}
}