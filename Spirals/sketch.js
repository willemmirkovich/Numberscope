function setup() {
	createCanvas(640,640);
	fill(0);
	setFrameRate(10);
}

function draw() {	
    myList=makeSquareList(10);
	for (a=0; a<myList.length; a++)
	{
		if (a==0)
		{
			fill(0);
		}
		else if (onSequence(a))
		{
			fill(255,0,0);
		}
		else
		{
			fill (0,255,0);
		}
		coord=new coordinate(300+10*myList[a].x,250+10*myList[a].y);
		polygon(coord.x,coord.y,5,4);
	}
}