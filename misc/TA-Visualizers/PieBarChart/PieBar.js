function drawCosetCharts(data,num,modulus,graphType)
{
	data=distribution(data,modulus);
	let cosetList=cosetGenerator(num,modulus);
	let dimension=Math.ceil(Math.sqrt(cosetList.length));
    for(let a=0; a<cosetList.length; a++)
    {
    	i=Math.floor(a/dimension);
    	j=a%dimension;
    	let orderedData=newOrder(cosetList[a],data);
    	pieChart(cosetList[a],orderedData,i,j,dimension);
    }
}



function barChart(indices,data,column,row,n) {
	textAlign(CENTER,BOTTOM);
	let xBuffer=20;
	let yBufferBottom=60;
	let yBufferTop=0;

	max=Math.max(...data);
	firstXPosition=xBuffer+width/n*column;
	lastXPosition=(width/n)*(column+1);
	firstYPosition=yBufferBottom+height/n*row;
	lastYPosition=-yBufferTop+height/n*(row+1);   //Box location.

	Width=lastXPosition-firstXPosition;
	Height=lastYPosition-firstYPosition;
	                                  //Box dimensions.

	//let =100;
	fill(0);
	
	for(let i=0; i<data.length; i++) {
		let rectWidth=map(.5,0,data.length,0,Width);
		let rectHeight=map(data[i],0,max,0,Height);    //Bar dimensions.

		let xPosition=map(i,0,data.length,firstXPosition,lastXPosition);
		let yPosition=lastYPosition-25;   //Bar locations.
		
		rect(xPosition,yPosition-rectHeight,rectWidth,rectHeight);
		text(indices[i],xPosition+rectWidth/2,lastYPosition);    //
	}
}

function pieChart(indices, data,row,column,n) {
	textAlign(CENTER,CENTER);
	let xBuffer=0;
	let yBufferBottom=25;
	let yBufferTop=25;

	firstXPosition=xBuffer+width/n*column;
	lastXPosition=(width/n)*(column+1);
	firstYPosition=yBufferBottom+height/n*row;
	lastYPosition=-yBufferTop+height/n*(row+1);

	xMiddle=1/2*(firstXPosition+lastXPosition);
	yMiddle=1/2*(firstYPosition+lastYPosition);

	Width=lastXPosition-firstXPosition;
	Height=lastYPosition-firstYPosition;
	Diameter=Math.min(Width,Height);

	let total=0;
	for(let i=0; i<indices.length; i++)
	{
		total=total+data[i];
	}
	for(let i=0; i<indices.length; i++)
	{
		data[i]=6.2832*data[i]/total;
	}
  let lastAngle = 0;
  for (let i = 0; i < data.length; i++) {
    let gray = map(i, 0, data.length, 0, 255);
    fill(gray);
    arc(
      xMiddle,
      yMiddle,
      Diameter,
      Diameter,
      lastAngle,
      lastAngle + data[i]
    );
    x=xMiddle+(Diameter/2+10)*cos(lastAngle+data[i]/2);
    y=yMiddle+(Diameter/2+10)*sin(lastAngle+data[i]/2);
    text(indices[i],x,y);
    lastAngle += data[i];
}
}