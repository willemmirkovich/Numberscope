function barChart(indices, data) {
	max=Math.max(...data);
	firstXPosition=50;
	lastXPosition=600;
	yPosition=400;

	for(let i=0; i<data.length; i++) {
		let xPosition=map(i,0,data.length,firstXPosition,lastXPosition);
		let gray = 100;//map(i,0,data.length,0,255);
		fill(gray);
		let Width=(lastXPosition-firstXPosition)/(2*data.length);
		let Height=map(data[i],0,max,0,300);
		rect(xPosition,yPosition-Height,Width,Height);
		text(indices[i],xPosition+Width/2,yPosition+20);
	}
}

function pieChart(indices, data) {
	diameter=300;
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
      width/2,
      height/2,
      diameter,
      diameter,
      lastAngle,
      lastAngle + data[i]
    );
    x=width/2+(diameter/2+10)*cos(lastAngle+data[i]/2);
    y=height/2+(diameter/2+10)*sin(lastAngle+data[i]/2);
    text(indices[i],x,y);
    lastAngle += data[i];
  }
}