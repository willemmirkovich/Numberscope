function setup() {
	createCanvas(640, 640);
	fill(0);
	setFrameRate(5);
	Index = 0;
	backGroundColor = color(0, 25, 0);
	initialColor = color(50, 255, 0);
	finalColor = color(0, 170, 0);
	transitionFrames = 10.0;
	myList = makeHexList(20);
	fill(backGroundColor);
	for (let a = 0; a < myList.length; a++) {
		coord = new coordinate(300 + 10 * myList[a].x, 250 + 10 * myList[a].y);
		polygon(coord.x, coord.y, 6, 6);
	}
}


function draw() {
	theList = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];
	for (let b = 0; b < theList.length; b++) {
		if (b <= Index) {
			let framesSince = Index - b;
			let inter = (transitionFrames - framesSince) / transitionFrames;
			let theColor = lerpColor(finalColor, initialColor, inter)
			fill(theColor);
		} else {
			fill(backGroundColor);
		}
		coord = new coordinate(300 + 10 * myList[theList[b]].x, 250 + 10 * myList[theList[b]].y);
		polygon(coord.x, coord.y, 6, 6);
	}

	Index++;
	if (Index == myList.length) {
		noLoop();
	}


}