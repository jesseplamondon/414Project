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

var pointsArray = [];
var colorArray = [
    [0.078, 0.56, 0.164]
]; //initialized with petry dish
var killedBacteria = 0;

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
	var gl = canvas.getContext('webgl', {preserveDrawingBuffer: true});

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

	var program = gl.createProgram();
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
    for(j=0; j<=12; j++){
        aj = j*Math.PI/12;
        sj = Math.sin(aj);
        cj = Math.cos(aj);
        for(i=0;i<=12;i++){
            ai = i*2*Math.PI/12;
            si=Math.sin(ai);
            ci = Math.cos(ai);
            sphereVertices.push(si*sj);
            sphereVertices.push(cj);
            sphereVertices.push(ci*sj);
        }
    }

     // Indices
     var SPHERE_DIV = 12;
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
	  	var colors = [];
         for(var i = 0; i<(sphereVertices.length/3); i++){
			colors.push(0,0,i/(sphereVertices.length/3));
		 }
         
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
         gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);


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
	//////////////////////////////////
	//            Draw              //
	//////////////////////////////////
	canvas.onmousedown = function (e) {
        var mx = e.clientX,
            my = e.clientY;
        let rect = canvas.getBoundingClientRect();
        x = (mx - rect.left) / dimension;
        y = (my - rect.top) / dimension;
        var newCoords = numToNDC(x, y);
        x = newCoords[0];
        y = newCoords[1];
        for (let i = 0; i < bacteriaVertices.length; i++) {
            if (isInBacteria(x, y, i)) {
                if (bacteriaVertices[i].length >= 62) {
                    if (gamePoints > 0) {
                        gamePoints--;
                    }
                }
                bacteriaVertices.splice(i, 1);
                colorArray.splice(i, 1);
                randAngleArray.splice(i, 1);
                pointsArray.splice(i, 1);
                killedBacteria++;
                bacteriaCountDisplay.innerHTML = killedBacteria;
               
            }
        }
    }

    var x = 0;
    var y = 0;

	var loop = function(time = 0){
		/* if (gamePoints > 1) {
            playerLoses();
        } else if (bacteriaVertices.length == 0 && killedBacteria > 0) {
            playerWins();
        } else { */
            
            loopCount++;
            //checking if there are touching bacteria and joining them if there are
            for (let i = 0; i < bacteriaVertices.length; i++) {
                isTouchingAny(i);
            }
            gameScoreHeader.innerHTML = gameScore;
    
			angle = 185;
			mat4.fromRotation(rotx,angle,[1,0,0]);
			mat4.fromRotation(rotz,angle,[0,0,1]);
			mat4.multiply(world,rotz,rotx);
			gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, world);
			gl.clearColor(0.5,0.8,0.8,1.0);
			//gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
			gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
            if(loopCount%10==0)
                drawBacteria(gl, program, loopCount); 
			requestAnimationFrame(loop);
		//}
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
        drag = true;
        beginX = ev.pageX; 
        beginY = ev.pageY;
        ev.preventDefault();
        return false;
    };

    canvas.onmouseup = function(ev){
        drag = false;
    };

    canvas.onmousemove = function(ev){
        if (!drag) return false;
        oldX = ev.pageX;
        oldY = ev.pageY;
        ev.preventDefault();
        mat4.fromRotation(rotx, (oldX - beginX)/100, [1,0,0]);
        mat4.fromRotation(rotz, (oldY - beginY)/100, [0,0,1]);
        mat4.multiply(world, rotz, rotx);
        gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, world);
		gl.clearColor(0.5,0.8,0.8,1.0);
		gl.clear(gl.COLOR_BUFFER_BIT| gl.DEPTH_BUFFER_BIT);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
	    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    };

};
function drawBacteria(gl, program, loopCount) {
    if (loopCount % 52 == 0 && loopCount != 0 && bacteriaVertices.length < 10) {
        addBacteria(bacteriaVertices.length);
        console.log(bacteriaVertices);
    }
    if (loopCount % 28 == 0 && loopCount != 0) {
        spreadBacteria();
    }
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
        gl.vertexAttrib4f(bacteriaAttribLocation, colorArray[i][0], colorArray[i][1], colorArray[i][2], 1.0);
        //gl.uniform3fv(u_FragColor, new Float32Array(colorArray[i][0], colorArray[i][1], colorArray[i][2]), 0);
        gl.useProgram(program);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, bacteriaVertices[i].length / 2);
    }
}
function spreadBacteria() {
    var radius = dishRad + bacteriaWidth;
    var maxLength = 62;
    if (bacteriaVertices.length > 0) {
        for (let i = 0; i < bacteriaVertices.length; i++) {
            if (bacteriaVertices[i].length <= maxLength) {
                gameScore += 1;
                bacteriaVertices[i].push(
                    center[0] + radius * Math.cos((randAngleArray[i] + bacteriaVertices[i].length / 2) * Math.PI / 180),
                    center[1] + radius * Math.sin((randAngleArray[i] + (bacteriaVertices[i].length) / 2) * Math.PI / 180)
                )
                if (bacteriaVertices[i].length <= maxLength) {
                    bacteriaVertices[i].splice(2, 0,
                        center[0] + radius * Math.cos((randAngleArray[i] - bacteriaVertices[i].length / 4) * Math.PI / 180)
                    );
                    bacteriaVertices[i].splice(3, 0,
                        center[1] + radius * Math.sin((randAngleArray[i] - (bacteriaVertices[i].length) / 4) * Math.PI / 180)
                    );

                    //setting game score text bar based on time bacteria is allowed to spread
                }
            } else if (!pointsArray[i]) {
                pointsArray[i] = true;
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
    do {
        var onTop = false;
        randAngle = Math.random() * 360;
		randPhi = Math.random()*180;
    } while (onTop)
    randAngleArray.push(randAngle);
	randAnglePhiArray.push(randPhi);
    var cx = dishRad*Math.sin(randPhi)*Math.cos(randAngle);
    var cy = dishRad*Math.sin(randPhi)*Math.sin(randAngle);
    var cz = dishRad*Math.cos(randAngle);
    var bactOrig = [cx,cy,cz];
    console.log(bactOrig);

		var i, ai, si, ci;
		var j, aj, sj, cj;
		var p1,p2;
        var SPHERE_DIV = 12;
		for(j=0; j<=SPHERE_DIV; j++){
			aj = j*Math.PI/SPHERE_DIV;
			sj = Math.sin(aj);
			cj = Math.cos(aj);
			for(i=0;i<=SPHERE_DIV;i++){
				ai = i*2*Math.PI/SPHERE_DIV;
				si=Math.sin(ai);
				ci = Math.cos(ai);
				bact.push((si*sj)+cx,cj+cy,(ci*sj)+cz);
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
        colors = [Math.random(), Math.random(), Math.random()];
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

function isInDish(x, y) {
    var d = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    return d <= dishRad;
}

function getAngle(x, y) {

    var angle = Math.atan2(y, x) * 180 / Math.PI;
    if (y < 0) {
        angle = 360 + angle;
    }
    return angle;
}

function isInBacteria(x, y, i) {
    var len = bacteriaVertices[i].length;
    var leftAngle = getAngle(bacteriaVertices[i][len - 2], bacteriaVertices[i][len - 1]);
    var rightAngle = getAngle(bacteriaVertices[i][2], bacteriaVertices[i][3]);
    var d = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    let angle = 0;
    angle = getAngle(x, y);
    if (angle >= rightAngle && angle <= leftAngle && d < bacteriaWidth + dishRad && !isInDish(x, y)) {
        return true;
    } else if (rightAngle > 100 + leftAngle) {
        if (angle < leftAngle || angle > rightAngle) {
            return true;
        }
    }
    return false;
}

function numToNDC(x, y) {
    var coords = [x, y];
    var oldRange = [
        [0, 1],
        [1, 0]
    ];
    var newRange = [
        [-1, 1],
        [-1, 1]
    ];
    var newCoords = [];
    for (let i = 0; i < coords.length; i++) {
        var newValue = (coords[i] - oldRange[i][0]) * (newRange[i][1] - newRange[i][0]) / (oldRange[i][1] - oldRange[i][0]) + newRange[i][0];
        newCoords[i] = Math.min(Math.max(newValue, newRange[i][0]), newRange[i][1]);
    }
    return newCoords;
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
