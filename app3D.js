const { vec2, vec3, mat3, mat4 } = glMatrix;

var vertexShaderText = [
'precision mediump float;',

'attribute vec3 position;',
'attribute vec3 color;',
'uniform mat4 world;',
'uniform mat4 view;',
'uniform mat4 proj;',
'varying vec3 fragColor;',

'void main()',
'{',
'   mat4 mvp = proj*view*world;',
'	fragColor = color;',
'	gl_Position = mvp*vec4(position,1.0);',
'	gl_PointSize = 10.0;',
'}'
].join('\n');

var fragmentShaderText =
[
'precision mediump float;',

'varying vec3 fragColor;',

'void main()',
'{',
	
'	gl_FragColor = vec4(fragColor,1.0);',
'}',
].join('\n')

var bacteriaVertices = [];
var bacteriaIndices = [];
var loopCount = 0;
var dimension = 0;
var dishRad = 1;
var bacteriaWidth = 0.06;
var randAngleArray = [];
var randAnglePhiArray = [];
var center = [0, 0];
var gamePoints = 0;
var gameScore = 0;
var program, gl;
var prevLoopAdd = 0;
var pointsArray = [];
var colorArray = [
]; //initialized with petry dish
var killedBacteria = 0;
var radiusArray = [];
var downClickTime;

// UI Elements
var bacteriaCountDisplay = document.getElementById("bacteria-count");
var gameScoreHeader = document.getElementById("game-score");
var messageDisplay = document.getElementById("message-display");
bacteriaCountDisplay.innerHTML = killedBacteria;
gameScoreHeader.innerHTML = gamePoints;

var InitDemo = function() {


	//////////////////////////////////
	//       initialize WebGL       //
	//////////////////////////////////
	//console.log('this is working');

	var canvas = document.getElementById('game-surface');
	gl = canvas.getContext('webgl'  /* , {preserveDrawingBuffer: true} */  );

	if (!gl){
		console.log('webgl not supported, falling back on experimental-webgl');
		gl = canvas.getContext('experimental-webgl');
	}
	if (!gl){
		alert('your browser does not support webgl');
	}

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	gl.viewport(0,0,canvas.width,canvas.height);

	gl.clearColor(0.5,0.8,0.8,1.0);
	gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

	//////////////////////////////////
	// create/compile/link shaders  //
	//////////////////////////////////
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

	gl.shaderSource(vertexShader,vertexShaderText);
	gl.shaderSource(fragmentShader,fragmentShaderText);

	gl.compileShader(vertexShader);
	if(!gl.getShaderParameter(vertexShader,gl.COMPILE_STATUS)){
		console.error('Error compiling vertex shader!', gl.getShaderInfoLog(vertexShader))
		return;
	}
	gl.compileShader(fragmentShader);
		if(!gl.getShaderParameter(fragmentShader,gl.COMPILE_STATUS)){
		console.error('Error compiling vertex shader!', gl.getShaderInfoLog(fragmentShader))
		return;
	}

	program = gl.createProgram();
	gl.attachShader(program,vertexShader);
	gl.attachShader(program,fragmentShader);

	gl.linkProgram(program);
	if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
		console.error('Error linking program!', gl.getProgramInfo(program));
		return;
	}

	var sphereVertices = [], indices = [];
    var i, ai, si, ci;
    var j, aj, sj, cj;
    var p1,p2;
    var SPHERE_DIV = 50;
    for(j=0; j<=SPHERE_DIV; j++){
        aj = j*Math.PI/SPHERE_DIV;
        sj = Math.sin(aj);
        cj = Math.cos(aj);
        for(i=0;i<=SPHERE_DIV;i++){
            ai = i*2*Math.PI/SPHERE_DIV;
            si=Math.sin(ai);
            ci = Math.cos(ai);
            sphereVertices.push(si*sj);
            sphereVertices.push(cj);
            sphereVertices.push(ci*sj);
        }
    }
    bacteriaVertices.push(sphereVertices);

     // Indices
     for (j = 0; j < SPHERE_DIV; j++) {
        for (i = 0; i < SPHERE_DIV; i++) {
          p1 = j * (SPHERE_DIV+1) + i;
          p2 = p1 + (SPHERE_DIV+1);

          indices.push(p1);
          indices.push(p2);
          indices.push(p1 + 1);

          indices.push(p1 + 1);
          indices.push(p2);
          indices.push(p2 + 1);
        }
      }
      bacteriaIndices.push(indices);
	  	var colors = [];
         for(var i = 0; i<(sphereVertices.length/3); i++){
			colors.push(0,0,i/(sphereVertices.length/3));
		 }
        colorArray.push(colors);
         // Create and store data into vertex buffer
         var vertex_buffer = gl.createBuffer ();
         gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereVertices), gl.STATIC_DRAW);

         // Create and store data into color buffer
         var color_buffer = gl.createBuffer ();
         gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

         // Create and store data into index buffer
         var index_buffer = gl.createBuffer ();
         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
         gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(bacteriaIndices[0]), gl.STATIC_DRAW);
         gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);
        gl.clearColor(0.5,0.8,0.8,1.0);

	var positionAttribLocation = gl.getAttribLocation(program,'position');
	var colorAttribLocation = gl.getAttribLocation(program,'color');
	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	gl.vertexAttribPointer(
		positionAttribLocation, //attribute location
		3, //number of elements per attribute
		gl.FLOAT, 
		gl.FALSE,
		0,
		0
		);
	gl.enableVertexAttribArray(positionAttribLocation);
    
	gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
	gl.vertexAttribPointer(
		colorAttribLocation, //attribute location
		3, //number of elements per attribute
		gl.FLOAT, 
		gl.FALSE,
		0,
		0
		);
    
	gl.enableVertexAttribArray(colorAttribLocation);

	gl.useProgram(program);
	
	gl.enable(gl.DEPTH_TEST);

	//////////////////////////////////
	//            matrics           //
	//////////////////////////////////
	
	var world = new Float32Array(16);
	mat4.identity(world);
	//var rot = new Float32Array(16);
	//var trans = new Float32Array(16);
	//mat4.identity(rot);
	//mat4.identity(trans);
	//var x = -2;
	//var angle = glMatrix.glMatrix.toRadian(45);
	//mat4.fromRotation(rot,angle,[0,0,1]);
	//mat4.fromTranslation(trans,[x,0,0]);
	//mat4.multiply(world,trans,rot);

	var view = new Float32Array(16);
	mat4.lookAt(view, [0,0,5], [0,0,0],[0,1,0])

	var proj = new Float32Array(16);
	mat4.perspective(proj,glMatrix.glMatrix.toRadian(45),canvas.width/canvas.height,0.1,100);

	//////////////////////////////////
	//    send to vertex shader     //
	//////////////////////////////////
	
	//get the address of each matrix in the vertex shader
	var matWorldUniformLocation = gl.getUniformLocation(program, 'world');
	var matViewUniformLocation = gl.getUniformLocation(program, 'view');
	var matProjUniformLocation = gl.getUniformLocation(program, 'proj');

	//send each matrix to the correct location in vertex shader
	gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, world);
	gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, view);
	gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, proj);

	var angle = 0;
	var rotz = new Float32Array(16);
	var rotx = new Float32Array(16);
	
	mat4.identity(rotx);
	mat4.identity(rotx);
    angle = 185;
			mat4.fromRotation(rotx,angle,[1,0,0]);
			mat4.fromRotation(rotz,angle,[0,0,1]);
			mat4.multiply(world,rotz,rotx);
			gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, world);
	//////////////////////////////////
	//            Draw              //
	//////////////////////////////////

	var loop = function(time = 0){
		if (gamePoints > 1) {
            playerLoses();
        } else if (bacteriaVertices.length == 1 && killedBacteria > 0) {
            playerWins();
        } else { 
           
            loopCount++;
            //checking if there are touching bacteria and joining them if there are
           /*  for (let i = 0; i < bacteriaVertices.length; i++) {
                isTouchingAny(i);
            } */
            gameScoreHeader.innerHTML = gameScore;
    
			
            if(!drag){
                drawBacteria(gl, program, loopCount);
            }
			//gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);
            /* drawBacteria(gl, program, loopCount);  */
            
             
			requestAnimationFrame(loop);
		}
	}		
	requestAnimationFrame(loop);
	//file:///D:/courses/COSC414%20(Graphics)/Lab/index.html
      
      /** Builds the mouse move handler for the canvas.
      
          Returns:
            A function to be used as the mousemove handler on the canvas.
      */
    
    var drag = false;
    var beginX, beginY;
    var oldX, oldY;

    canvas.onmousedown = function(ev){
        downClickTime = new Date();
        let rect = canvas.getBoundingClientRect();
        var x = (ev.clientX - rect.left);
        var y = (ev.clientY - rect.top);
        drag = true;
        beginX = ev.pageX; 
        beginY = ev.pageY;
        gl.clearColor(0.5,0.8,0.8,1.0);
        gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
	    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        drawBacteria(gl, program);
        var pixelValues = new Uint8Array(4);
        y=canvas.height-y;
        gl.readPixels(x, y, 1,1, gl.RGBA, gl.UNSIGNED_BYTE, pixelValues);
        var pix = [0.0,0.0,0.0];
        for(let i = 0; i<3; i++){
            var num = pixelValues[i]/255
            pix[i]=num.toFixed(2);
        }
        //console.log("PixelValues: "+ pix[0]+","+pix[1]+","+pix[2]);
        for(let i = 1; i<colorArray.length;i++){
            //console.log("ColorArray: "+colorArray[i][0]+","+colorArray[i][1]+","+colorArray[i][2]);
            if(colorArray[i][0]==pix[0]&&colorArray[i][1]==pix[1]&&colorArray[i][2]==pix[2]){
                bacteriaVertices.splice(i, 1);
                colorArray.splice(i, 1);
                randAngleArray.splice(i-1, 1);
                randAnglePhiArray.splice(i-1,1);
                radiusArray.splice(i-1,1);
                pointsArray.splice(i-1, 1);
                killedBacteria++;
                bacteriaCountDisplay.innerHTML = killedBacteria;
            }
        }
        ev.preventDefault();
        return false;
    };

    canvas.onmouseup = function(ev){
        drag = false;
    };

    canvas.onmousemove = function(ev){
        if (!drag) return false;
        var currentTime = new Date();
        var timeDiff = currentTime-downClickTime;
        if(timeDiff>100){
            oldX = ev.pageX;
            oldY = ev.pageY;
            ev.preventDefault();
            mat4.fromRotation(rotx, (oldX - beginX)/100, [0,1,0]);
            mat4.fromRotation(rotz, (oldY - beginY)/100, [1,0,0]);
            mat4.multiply(world, rotz, rotx);
            gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, world);
            
            gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);
            gl.clearColor(0.5,0.8,0.8,1.0);
            drawBacteria(gl,program);
        }
		
    };

};
function drawBacteria(gl, program) {
    if (loopCount % 52 == 0 && loopCount != 0 && bacteriaVertices.length <= 10 && prevLoopAdd<loopCount) {
        addBacteria(bacteriaVertices.length);
        prevLoopAdd=loopCount;
    }
    if (loopCount % 52 == 0 && loopCount != 0&&prevLoopAdd<loopCount) {
        spreadBacteria();
    }
    gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);
        gl.clearColor(0.5,0.8,0.8,1.0);
    //drawing all bacteria in bacteriaVertices array
    for (let i = 0; i < bacteriaVertices.length; i++) {
        var bacteriaAttribLocation = gl.getAttribLocation(program, 'color');
        var bacteriaVertexBufferObject = gl.createBuffer();
        //set the active buffer to the triangle buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, bacteriaVertexBufferObject);
        //gl expecting Float32 Array not Float64
        //gl.STATIC_DRAW means we send the data only once (the triangle vertex position
        //will not change over time)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bacteriaVertices[i]), gl.STATIC_DRAW);
        //setup for bacteria color
        // Create and store data into index buffer
        var index_buffer = gl.createBuffer ();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(bacteriaIndices[i]), gl.STATIC_DRAW);

        var positionAttribLocation = gl.getAttribLocation(program, 'position');

        gl.vertexAttribPointer(
            positionAttribLocation, //attribute location
            3, //number of elements per attribute
            gl.FLOAT,
            gl.FALSE,
            3 * Float32Array.BYTES_PER_ELEMENT, //size of an individual vertex
            0 * Float32Array.BYTES_PER_ELEMENT //offset from the beginning of a single vertex to this attribute
        );
        gl.vertexAttribPointer(
            bacteriaAttribLocation, //attributeLocation
            3, //number of elements per attribute
            gl.FLOAT,
            gl.FALSE,
            6 * Float32Array.BYTES_PER_ELEMENT,
            3 * Float32Array.BYTES_PER_ELEMENT
        );
        gl.enableVertexAttribArray(positionAttribLocation);
        gl.disableVertexAttribArray(bacteriaAttribLocation);
        if(i==0){
        // Create and store data into color buffer
         var color_buffer = gl.createBuffer ();
         gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorArray[0]), gl.STATIC_DRAW);
         var colorAttribLocation = gl.getAttribLocation(program,'color');
         gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
         gl.enableVertexAttribArray(colorAttribLocation);
        }
        else{
            gl.vertexAttrib4f(bacteriaAttribLocation, colorArray[i][0], colorArray[i][1], colorArray[i][2], 1.0);
        }
        //gl.uniform3fv(u_FragColor, new Float32Array(colorArray[i][0], colorArray[i][1], colorArray[i][2]), 0);
        gl.useProgram(program);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, bacteriaVertices[i].length / 2);
    }
}
function spreadBacteria() {
    var maxRad = 0.5;
    var incRad = 0.0125;
    if (bacteriaVertices.length > 0) {
        for (let k = 1; k < bacteriaVertices.length; k++) {
            if (radiusArray[k-1] <= maxRad) {
                // replace vertices with increased radius vertices, then save increased radius to radiusArray
                radiusArray[k-1]=radiusArray[k-1]+incRad;
                var bact = [];
                var cx = (dishRad-radiusArray[k-1])*Math.cos(randAngleArray[k-1]);
                var cy = (dishRad-radiusArray[k-1])*Math.sin(randAngleArray[k-1]);
                var cz = (dishRad-radiusArray[k-1])*Math.cos(randAnglePhiArray[k-1]);
                var i, ai, si, ci;
                var j, aj, sj, cj;
                var SPHERE_DIV = 50;
                for(j=0; j<=SPHERE_DIV; j++){
                    aj = j*Math.PI/SPHERE_DIV;
                    sj = Math.sin(aj);
                    cj = Math.cos(aj);
                    for(i=0;i<=SPHERE_DIV;i++){
                        ai = i*2*Math.PI/SPHERE_DIV;
                        si=Math.sin(ai);
                        ci = Math.cos(ai);
                        bact.push(radiusArray[k-1]*(si*sj)+cx,radiusArray[k-1]*cj+cy,radiusArray[k-1]*(ci*sj)+cz);
                    }
                }
                bacteriaVertices.splice(k,1,bact);


                
            } else if (!pointsArray[k-1]) {
                pointsArray[k-1] = true;
                gamePoints++;
                gameScoreHeader.innerHTML = gameScore;
            }else {
                gameScore += 5;
            }
            gameScoreHeader.innerHTML = gameScore;
        }
    } else {
        addBacteria(0);
    }
}

function addBacteria(a) {
    pointsArray.push(false);
    let randAngle = 0;
	let randPhi = 0;
    var bact = [];
    var bactRad = 0.2;
    do {
        var onTop = false;
        randAngle = Math.random() * 360;
		randPhi = Math.random()*180;
    } while (onTop)
    randAngleArray.push(randAngle);
	randAnglePhiArray.push(randPhi);
    var cx = (dishRad-bactRad)*Math.cos(randAngle);
    var cy = (dishRad-bactRad)*Math.sin(randAngle);
    var cz = (dishRad-bactRad)*Math.cos(randPhi);
		var i, ai, si, ci;
		var j, aj, sj, cj;
		var p1,p2;
        var SPHERE_DIV = 50;
        bx = bactRad*Math.sin(randAngle);
        by = bactRad*Math.cos(randAngle);
        bz = bactRad*Math.cos(randPhi);
		for(j=0; j<=SPHERE_DIV; j++){
			aj = j*Math.PI/SPHERE_DIV;
			sj = Math.sin(aj);
			cj = Math.cos(aj);
			for(i=0;i<=SPHERE_DIV;i++){
				ai = i*2*Math.PI/SPHERE_DIV;
				si=Math.sin(ai);
				ci = Math.cos(ai);
				bact.push(0.2*(si*sj)+cx,0.2*cj+cy,0.2*(ci*sj)+cz);
			}
		}
        bacteriaVertices.push(bact);
		 // Indices
		
         var ind = [];
		 for (j = 0; j < SPHERE_DIV; j++) {
			for (i = 0; i < SPHERE_DIV; i++) {
			  p1 = j * (SPHERE_DIV+1) + i;
			  p2 = p1 + (SPHERE_DIV+1);
	
			  ind.push(p1);
			  ind.push(p2);
			  ind.push(p1 + 1);
	
			  ind.push(p1 + 1);
			  ind.push(p2);
			  ind.push(p2 + 1);
			}
		  }
          bacteriaIndices.push(ind);
    addColors();
    radiusArray.push(bactRad);
}
function isTouchingAny(a) {
    if (bacteriaVertices[a].length < 62) {
        for (let i = 0; i < bacteriaVertices.length; i++) {
            var overlap = false;
            let centreAngle = getAngle(bacteriaVertices[i][bacteriaVertices[i].length], bacteriaVertices[i][bacteriaVertices[i].length + 1]);
            if (a < i) {
                for (let v = 2; v < bacteriaVertices[i].length; v += 2) {
                    var aLength = bacteriaVertices[a].length;
                    var iLength = bacteriaVertices[i].length;
                    var aLeftAngle = getAngle(bacteriaVertices[a][aLength - 2], bacteriaVertices[a][aLength - 1]);
                    var aRightAngle = getAngle(bacteriaVertices[a][2], bacteriaVertices[a][3]);
                    var iLeftAngle = getAngle(bacteriaVertices[i][iLength - 2], bacteriaVertices[i][iLength - 1]);
                    var iAngle = getAngle(bacteriaVertices[i][v], bacteriaVertices[i][v + 1]);
                    if ((aLeftAngle < iLeftAngle && aLeftAngle > iAngle) || (aRightAngle < iLeftAngle && aRightAngle > iAngle)) {
                        if (iAngle > centreAngle) {
                            bacteriaVertices[a].push(bacteriaVertices[i][v], bacteriaVertices[i][v + 1]);
                        } else {
                            bacteriaVertices[a].splice(2, 0, bacteriaVertices[i][v]);
                            bacteriaVertices[a].splice(3, 0, bacteriaVertices[i][v + 1]);
                            v += 2;
                        }
                        overlap = true;
                    }
                }
            }

            if (overlap) {
                bacteriaVertices.splice(i, 1);
                colorArray.splice(i, 1);
                randAngleArray.splice(i, 1);
                pointsArray.splice(i, 1);
                i--;
            }
        }
    }
}

function addColors() {
    var colors = [];
    do {
        colors = [Math.random().toFixed(2), Math.random().toFixed(2), Math.random().toFixed(2)];
    } while (isInArray(colorArray, colors));
    colorArray.push(colors);
}

function isInArray(arr, item) {
    var item_as_string = JSON.stringify(item);
    var contains = arr.some(function (ele) {
        return JSON.stringify(ele) == item_as_string;
    });
    return contains;
}

function playerWins() {
    messageDisplay.innerHTML = "You Won"
    alert("You won!! You killed " + killedBacteria + " bacteria! Play again?");
    resetGame();
}

function playerLoses() {
    messageDisplay.innerHTML = "You lost";
    alert("Game Over. You killed " + killedBacteria + " bacteria! Try again?");
    resetGame();
}

function resetGame() {
    document.location.reload();
    gamePoints = 0;
    killedBacteria = 0;
}
