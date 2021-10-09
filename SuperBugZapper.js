function main(){
    
     let canvas = document.getElementById('circle');
     if(!canvas){
         console.log('Failed');
         return;
     }
     let ctx = canvas.getContext('2d');

     let gameFrame = 0;
    // Bacteria
    const bacteriaArray = [];

    setInterval(animate, 1000, ctx);
    animate(ctx)

//     setInterval(spawnBacteria, 3000, ctx);
// }

// function spawnBacteria(ctx) {
//     //generate random color
//     let r = Math.floor(Math.random() * 256);
//     let g = Math.floor(Math.random() * 256);
//     let b = Math.floor(Math.random() * 256);

//     //generate random coordinate on edge
//     let randAngle = Math.random() * 2 * Math.PI;
//     let randX = (225 * Math.cos(randAngle)) + 250;
//     let randY = (225 * Math.sin(randAngle)) + 250;


//     ctx.beginPath();
//     ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1.0)`;
//     ctx.arc(randX, randY, 25, 0, 2 * Math.PI);
//     ctx.fill();


//code for drawing circle in webGL

/* vec2 center = vec2(cX, cY); 
   
points.push(center);
for (i = 0; i <= 100; i++){
    points.push(center + vec2(
        r*Math.cos(i * 2 * Math.PI / 200),
        r*Math.sin(i * 2 * Math.PI / 200) 
    ));
} */
}


class Bacteria {
    constructor() {
        // code for establishing position
        // x,y,radius, color
        let randAngle = Math.random() * 2 * Math.PI;
        this.x = (225 * Math.cos(randAngle)) + 250;
        this.y = (225 * Math.sin(randAngle)) + 250;
        this.subBacteriaArc = 0;
        this.subBacteria = []; //array of sub-bacteria
        this.radius = 25;
        //generate random color for this.color
        let r = Math.floor(Math.random() * 256);
        let g = Math.floor(Math.random() * 256);
        let b = Math.floor(Math.random() * 256);
    }
    spread() {
        if (gameFrame % 10 == 0) {
            subBacteria.push(new subBacteria(this.r,this.g,this.b));
        }
        for (let i = 0; i < subBacteria.length; i++) {
            subBaceteria[i].update();
            subBacteria[i].draw();
        }
    }
    draw() {
        // creates circle for bacteria representation
        ctx.fillStyle = color; //will be different colors, possibly generated from an array
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI2);
        ctx.fill();
        ctx.closePath();
        ctx.stroke();
    }
    
    handleBacteria() {
        if (gameFrame % 10 == 0) {
            bacteriaArray.push(new Bacteria())
        }
        for (let i = 0; i < bacteriaArray.length; i++) {
            bacteriaArray[i].update();
            bacteriaArray[i].draw();
            bacteriaArray[i].spread();
        }
    }
}
class subBacteria {
    constructor() {
        // code for establishing position
        // x,y,radius, color
        //color = parent color
        this.r = r;
        this.g = g;
        this.b = b;
        let randAngle = Math.random() * 2 * Math.PI;
        this.x = (225 * Math.cos(randAngle)) + 250;
        this.y = (225 * Math.sin(randAngle)) + 250;
        this.radius = 25;
    }
    draw() {
        // creates circle for bacteria representation
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1.0)`; 
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI2);
        ctx.fill();
        ctx.closePath();
        ctx.stroke();
    }
}

function animate(ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //Draw a blue circle
    ctx.beginPath();
    ctx.fillStyle = 'rgba(202, 231, 193, 1.0)';
    ctx.arc(250, 250, 250, 0, 2 * Math.PI);
    ctx.fill();
    //draw bacteria
    handleBacteria();
    gameFrame++;
    requestAnimationFrame(animate);
}

