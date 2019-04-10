class ModFillMODULE{
	constructor(config,seq,sketch){
		this.sketch=sketch
		this.seq=seq
		this.dimension=config.dimension
		this.i=0;
	}

	drawNew(num,seq){
	let black=color(0);
	fill(black);
	let i;
	let j;
	for(let mod=1; mod<=length; mod++)
	{
		i=seq[num]%mod;
		j=mod-1;
		rect(j*this.rectWidth,height-(i+1)*this.rectHeight,this.rectWidth,this.rectHeight);
	}

}

	setup(){
		let length=this.dimension;
		this.rectWidth=this.sketch.width/length;
		this.rectHeight=this.sketch.height/length;
		noStroke();
	}

	draw(){
		drawNew(this.i,this.seq);
		this.i++;
		if(this.i>=this.seq.length())
		{
			this.sketch.noLoop();
		}

	}

}