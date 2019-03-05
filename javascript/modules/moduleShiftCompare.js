class ShiftCompare_MODULE{
	constructor(config, seq, sketch){
	    //Sketch is your canvas
	    //config is the parameters you expect
	    //seq is the sequence you are drawing
		this.sketch = sketch;
		this.seq = seq;
	}

	setup(){
		// Set up the image once.
        this.img = p.createImage(this.sketch.width(), this.sketch.height());
        this.img.loadPixels(); // Enables pixel-level editing.
	}
	
	clip(a, min, max)
	{
	    if (a < min)
		{
			return min;
		}
		else if (a > max)
		{
		    return max;
		}
		return a;
	}
	
	draw(){		//This will be called everytime to draw
	    // Ensure mouse coordinates are sane.
        // Mouse coordinates look they're floats by default.
        mx = clip(Math.round(p.mouseX), 0, this.sketch.width());
        my = clip(Math.round(p.mouseY), 0, this.sketch.height());
	
		// Write to image, then to screen for speed.
        for (let x = 0; x < this.sketch.width(); x++) {
            for (let y = 0; y < this.sketch.height(); y++) {
                let index = (x + y * this.sketch.height()) * 4;
                if (this.seq.getElement(x) % (mx + my) == this.seq.getElement(y) % (mx + my) ) {
                    img.pixels[index    ] = 255;
                    img.pixels[index + 1] = 255;
                    img.pixels[index + 2] = 255;
                    img.pixels[index + 3] = 255;
                }
                else {
                    img.pixels[index    ] = 0x41;
                    img.pixels[index + 1] = 0x67;
                    img.pixels[index + 2] = 0x88;
                    img.pixels[index + 3] = 255;
                }
            }
        }
        
        img.updatePixels(); // Copies our edited pixels to the image.
        
        p.image(img, 0, 0); // Display image to screen.this.sketch.line(50,50,100,100);
	}
}