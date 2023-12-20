// ===============================================================
// =============== FUNCTIONS FOR DRAWING ON CANVAS ===============
// ===============================================================

/**
 * @brief               Adapt nodes dimensions to the canvas size
 * @param canvas        selected canvas
 * @param nodes         array of nodes
 * @param offset        offset to the canvas border
 * @param margin        margin to the mesh bounding box
 * @returns 
 */
function size_adapt(canvas, nodes, offset, margin=0) {
    // bounding box of the mesh
    let xMin = Number.MAX_VALUE;
    let yMin = Number.MAX_VALUE;
    let xMax = Number.MIN_VALUE;
    let yMax = Number.MIN_VALUE;

    for (node of nodes) {
        xMax = Math.max(xMax, node.pos[0]);
        xMin = Math.min(xMin, node.pos[0]);
        yMax = Math.max(yMax, node.pos[1]);
        yMin = Math.min(yMin, node.pos[1]);
    }

    // Increase bounding box with a margin
    xMin -= margin;
    yMin -= margin;
    xMax += margin;
    yMax += margin;

    const xRange = xMax - xMin;
    const yRange = yMax - yMin;
    const scale = Math.min(canvas.width / xRange, canvas.height / yRange);

    // Transform node positions based on the adjusted bounding box and the offset
    for (node of nodes)
        node.pos = transform(node.pos, scale, xMin, yMin, offset);

    return { scale: scale, xMin: xMin, yMin: yMin };
}


/**
 * @brief               Transform coordinates to fit the canvas
 * @param pos           position to transform
 * @param scale         scale factor
 * @param xMin          minimum x value
 * @param yMin          minimum y value
 * @param offset        offset to the canvas border
 * @returns             transformed coordinates
 */
function transform(pos, scale, xMin, yMin, offset) {
    return [offset+(pos[0]-xMin)*scale, offset+(pos[1]-yMin)*scale];
}


/**
 * @brief               Draw mesh edges and points
 * @param mesh          mesh structure as doubly-connected edge list
 * @param canvas        selected canvas
 */
function draw_mesh(mesh, canvas) {
	size_adapt(canvas, mesh.nodes, offset=0, margin=0.1);

	// Draw triangles
	var context = canvas.getContext('2d');
	context.strokeStyle = "steelblue";
	for (face of mesh.faces) {
		var edge = face.incidentEdge;
		var face_nodes = [edge.orig.pos, edge.next.orig.pos, edge.next.next.orig.pos];
		context.beginPath();
		context.lineWidth = 1;
		context.moveTo(face_nodes[0][0], face_nodes[0][1]);
		context.lineTo(face_nodes[1][0], face_nodes[1][1]);
		context.lineTo(face_nodes[2][0], face_nodes[2][1]);
        context.lineTo(face_nodes[0][0], face_nodes[0][1]);
		context.stroke();
	}

	// Draw nodes
	for (node of mesh.nodes) {
		draw_point(node.pos[0], node.pos[1], canvas, color="midnightblue", label=node.id.toString());
	}
}


/**
 * @brief           Draw a point given its coordinates
 * @param x         x-coordinate of the point
 * @param y         y-coordinate of the point
 * @param canvas    selected canvas
 * @param color     point and text color
 * @param label     label of the point
 */
function draw_point(x, y, canvas, color="black", label=""){
    // draw a point in the coordinates (x, y)
    var context = canvas.getContext('2d');
    context.beginPath();
    context.arc(x, y, 3, 0, 2 * Math.PI);
    context.fillStyle = color;
    context.fill();

    // label, if required
    var x_text = x + 8;
    var y_text = y - 6;
    if (x + 5 >= canvas.width) x_text = x - 18;
    if (y - 5 <= 0) y_text = y + 18;
    context.font = "bold 14px sans-serif";
    context.fillText(label, x_text, y_text);
}


/**
 * @brief           Clear all elements in the desired canvas
 * @param canvas    selected canvas
 */
function clear_canvas(canvas){
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}


/**
 * @brief           Draw an edge given coordinates of two points
 * @param A         coordinates (x, y) of A
 * @param B         coordinates (x, y) of B
 * @param canvas    selected canvas
 * @param color     edge color
 */
function draw_edge(A, B, canvas, color="black"){
    // draw a segment AB
    var context = canvas.getContext('2d');
    context.strokeStyle = color;
	context.lineWidth = 2;
    context.beginPath();
    context.moveTo(A[0], A[1]);
    context.lineTo(B[0], B[1]);
    context.stroke();
}


// Create a function that, for the circumcenter and the circumradius, plot the circumcircle
/**
 * @brief           Draw a circle given its center and radius
 * @param x         x-coordinate of the center
 * @param y         y-coordinate of the center
 * @param r         radius of the circle
 * @param canvas    selected canvas
 */
function draw_circle(x, y, r, canvas) {

	// draw the circumcircle
	context = canvas.getContext('2d');
	context.beginPath();
	context.arc(x, y, r, 0, 2 * Math.PI);
	context.stroke();
}