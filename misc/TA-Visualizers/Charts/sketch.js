let font,fontSize=20;

/*function preload() {
	font=loadFont('arial.ttf');
}
*/
let sequence=[1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,3,3,3,444,4,5,6,7,8,9,9,9];

function setup() {
  createCanvas(720, 600);
  Mod=8;
  myGroup=generateAdditiveGroup(2,Mod);
  for(let i=0; i<myGroup.length; i++)
  {
  	console.log(myGroup[i]);
  }
 
  textFont("Comic Sans MS");
  textSize(fontSize);
  textAlign(CENTER, CENTER);
 
  noStroke();
  noLoop(); // Run once and stop
}

function draw() {
  background(0,100,0);
  fill(0);
  myData=mod(sequence,Mod);
  myDist=distribution(myData,Mod);
  newDist=newOrder(myGroup,myDist);
  pieChart(myGroup,newDist);
  
}




