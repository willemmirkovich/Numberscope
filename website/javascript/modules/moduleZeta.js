        
// number of iterations for
// the reiman zeta function computation
const num_iter = 10

class VIZ_Zeta {
        constructor(seq, sketch, config){
                // Sequence label
                this.seq = seq
                // P5 sketch object
                this.sketch = sketch
        }

        setup(){
                this.iter = 0;
                this.sketch.pixelDensity(1);
                this.sketch.frameRate(1);
        }

        drawMandelbrot(maxiterations){
                
                // Reset sketch
                this.sketch.background(0);
                const w = 4;
                const h = (w * this.sketch.height) / this.sketch.width;
  
                const xmin = -w/2;
                const ymin = -h/2;

                this.sketch.loadPixels();

                const xmax = xmin + w;
                const ymax = ymin + h;

                const dx = (xmax - xmin) / (this.sketch.width);
                const dy = (ymax - ymin) / (this.sketch.height);

                let y = ymin;
                for(let i = 0; i < this.sketch.height; ++i) {

                        let x = xmin;
                        for(let j = 0; j < this.sketch.width; ++j) {

                                let a = x;
                                let b = y;
                                let n = 0;

                                // Multiply complex numbers maxiterations times
                                while(n < maxiterations) {
                                        const aa = a * a;
                                        const bb = b * b;
                                        const twoab = 2.0 * a * b;

                                        a = aa - bb + x;
                                        b = twoab + y;
                                        n++;
                                }

                                n = this.sketch.dist(a, b, 0, 0);

                                /*
                                * This is the heaviest part of the mandelbrot set
                                * M set defines the set of complex n's while the orbit
                                * under the quadratic map 
                                *
                                * z_(n+1) = z_(n)^2 + c
                                *
                                * remains bounded
                                *
                                * here, z = x + iy
                                */
                                // while (n < maxiterations) {
                                //         const aa = a * a;
                                //         const bb = b * b;
                                //         const twoab = 2.0 * a * b;
                                //
                                //         a = aa - bb + x;
                                //         b = twoab + y;
                                //
                                //         // magnitude of vector
                                //         // 16 is infinity
                                //         if (dist(aa, bb, 0, 0) > 16) {
                                //                 break;
                                //         }
                                //         n++;
                                // }

                                // index of the pixel based on i, j (4 spanned array)
                                const pix = (j + i*this.sketch.width) * 4;

                                // Proportionality solver:
                                // maps n  \in [0, maxiterations] 
                                // to   n' \in [0, 1]
                                const norm = this.sketch.map(n, 0, maxiterations, 0, 1);

                                // constrain between 0 and 255
                                let colo = this.sketch.map(Math.sqrt(norm), 0, 1, 0, 255);

                                if (n == maxiterations) {
                                        colo = 0;
                                } else {
                                        // RGB coloring gets indexed here
                                        this.sketch.pixels[pix + 0] = colo;
                                        this.sketch.pixels[pix + 1] = colo;
                                        this.sketch.pixels[pix + 2] = colo;

                                        // Alpha:
                                        // https://en.wikipedia.org/wiki/RGBA_color_model
                                        // This is opacity
                                        this.sketch.pixels[pix + 3] = 255;
                                }
                                x += dx;
                        }
                        y += dy;
                }

                this.sketch.updatePixels();
        }

        draw() {
                this.drawMandelbrot(this.iter);
                this.iter = (this.iter + 1) % 20;
        }




}

const SCHEMA_Zeta = {
            n: {
                  type: 'number',
                  title: 'N',
                  description: 'Number of elements',
                  required: true
          },
          Levels: {
                  type: 'number',
                  title: 'Levels',
                  description: 'Number of levels',
                  required: true
          },
  };


const MODULE_Zeta = {
    viz: VIZ_Zeta,
    name: 'Zeta',
    description: '',
    configSchema: SCHEMA_Zeta
}

module.exports = MODULE_Zeta
    
