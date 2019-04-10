let font,fontSize=20;

/*function preload() {
	font=loadFont('arial.ttf');
}
*/
let sequence=[1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,3,3,3,8,4,5,6,7,8,9,9,9,10,11,12,13,14,15,15];

function setup() {
  createCanvas(720, 600);
  background(255);
  Mod=7;
  myGroup=generateMultiplicativeGroup(3,Mod);
  myDistribution=distribution(sequence,Mod);
  textFont("Arial");
  textSize(fontSize);
  //textAlign(CENTER, BOTTOM);
  //the=newOrder(myGroup,myDistribution);
  //pieChart(myGroup,the,1,1,2)
  drawCosetCharts(sequence,7,19,"piechart");
  noStroke();
  noLoop(); // Run once and stop
}

function draw() {
 /* for(let i=0; i<cosetGenerator(2,7)[1].length; i++)
  {
console.log(cosetGenerator(2,7)[1][i]);
  }*/
 // console.log(cosetGenerator(2,7).length);
//drawCosetCharts(sequence,3,7,"pie");
//let cosetList = cosetGenerator(3,7);
}




