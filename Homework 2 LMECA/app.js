/* NUMERICAL GEOMETRY - Assignment 2
Gabriel de Morais Pires
Gabriela Ishikawa */

function setup_triangle_location(mesh, canvas) {
	console.log("Hello from setup_triangle_location");
	draw_mesh(mesh, canvas);
	
	canvas.addEventListener("mousedown", function(e){
		find_triangle_location(e, mesh, canvas);
	});

    // Clear canvas button
    clear1Button.addEventListener("click", function () {
        clear_canvas(canvas);
        draw_mesh(mesh, canvas);
    });
	/**
	 * Escolher um triangulo e pegar o incidentEdge e pegar o ponto medio desse segmento
	 * Traçar um segmento entre o ponto medio e o ponto desejado
	 * 
	 * Verificar se esse segmento tem intersecção com incidentEdge.next
	 * (1) Se tem -> ir para incidentEdge.next.oppo e verificar se tem intersecção com incidentEdge.next.oppo.next
	 * (2) Se não tem -> verificar se tem intersecção com o incidentEdge.next.next
	 * 		Se tem -> ir para incidentEdge.next.next.oppo e tratar como (1)
	 * 		Se não tem -> verificar se está dentro do triangulo
	 * 			Se não está -> ir para incidentEdge.oppo e tratar como (1)
	 */
}

function setup_segment_location(mesh, canvas) {
	console.log("Hello from setup_segment_location");
	draw_mesh(mesh, canvas);
	// TODO 

	segments = [];
	canvas.addEventListener("mousedown", function(e){
		const rect = canvas.getBoundingClientRect();
		var point = [e.clientX - rect.left, e.clientY - rect.top]
		segments.push(point);
		draw_point(point[0], point[1], canvas, color="midnightblue");

		if (segments.length % 2 == 0){
			console.log("segment");
			idx = segments.length/2 - 1;
			draw_edge(segments[2*idx], segments[2*idx + 1], canvas, color="midnightblue");
			find_segment_location([segments[2*idx], segments[2*idx + 1]], mesh, canvas);
		}
	});

    // Clear canvas button
    clear2Button.addEventListener("click", function () {
        clear_canvas(canvas);
		draw_mesh(mesh, canvas);
    });

	/**
	 * Pegar o primeiro ponto e achar em que triangulo está
	 * Traçar o segmento entre os pontos dados
	 * 
	 * Verificar se este segmento intersecta com incidentEdge
	 * (1) Se não -> verificar se intersecta com o incidentEdge.next
	 * 		Se não -> verificar se intersecta com o incidentEdge.next.next
	 * (2) Se sim -> ir para o incidentEdge.oppo, pintar o triangulo e verificar se tem intersecção com os outros edges do triangulo
	 * 		Se não -> verificar se está dentro do triangulo
	 */
}

function create_mesh(mesh_data) {
	// Initialize data structure of a doubly-connected edge list
	mesh = {
		nodes: [],
		faces: [],
		edges: []
	};

	// Mesh data from json file
	node_data = mesh_data.Nodes[0];			// nodes - Coordinates, Indices
	elem_data = mesh_data.Elements[1];		// triangles - Indices, Name, NodalConnectivity, Type = 2

	// Create nodes
	for (let i = 0; i < node_data.Indices.length; i++){
		// node structure
		node = {
			id: node_data.Indices[i],
			pos: node_data.Coordinates[i]
		};
		// add node to mesh.nodes array
		mesh.nodes.push(node);
	}

	// Create faces
	nodePairToEdge = {};
	for (let i = 0; i < elem_data.Indices.length; i++) {
		// face structure
		face = {
			id: elem_data.Indices[i],
			incidentEdge: null		//TODO
		};
		// add face to mesh.faces array
		mesh.faces.push(face)

		// Create 3 half-edges for each triangle
		face_nodes = elem_data.NodalConnectivity[i];		// triangle nodes
		
		face_edges = [];
		for (let j = 0; j < face_nodes.length; j++){
			edge = {
				orig: mesh.nodes[face_nodes[(j+1)%3]],
				dest: mesh.nodes[face_nodes[j]],
				incidentFace: face,
				next: null,
				oppo: null
			};
			face_edges.push(edge);

			// Determine the connectivity of the half-edges
			if ([edge.dest.id, edge.orig.id] in nodePairToEdge) {
				edge.oppo = nodePairToEdge[[edge.dest.id, edge.orig.id]];
				nodePairToEdge[[edge.dest.id, edge.orig.id]].oppo = edge;
			} else nodePairToEdge[[edge.orig.id, edge.dest.id]] = edge;
		}

		// define incidentEdge
		face.incidentEdge = face_edges[0]

		// define edge.next
		for (let j = 0; j < face_nodes.length; j++){
			face_edges[(j+1)%3].next = face_edges[j];

		}
	}

	// add edges to mesh.edges array
	for (edgeName in nodePairToEdge) {
		if (nodePairToEdge.hasOwnProperty(edgeName)) {
		  edge = nodePairToEdge[edgeName];
		  mesh.edges.push(edge);
		}
	}
	return mesh;
}

function draw_mesh(mesh, canvas) {
	size_adapt(canvas, mesh.nodes, offset=0);

	// Draw triangles
	context = canvas.getContext('2d');
	context.strokeStyle = "steelblue";
	for (face of mesh.faces) {
		edge = face.incidentEdge;
		face_nodes = [edge.orig.pos, edge.dest.pos, edge.next.dest.pos];
		context.beginPath();
		context.lineWidth = 1;
		context.moveTo(face_nodes[0][0], face_nodes[0][1]);
		context.lineTo(face_nodes[1][0], face_nodes[1][1]);
		context.lineTo(face_nodes[2][0], face_nodes[2][1]);
		context.stroke();
	}
}

function size_adapt(canvas, nodes, offset){
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
	const xRange = xMax - xMin;
	const yRange = yMax - yMin;
	const scale = Math.min(canvas.width/xRange, canvas.height/yRange);
    
    for (node of nodes)
        node.pos = transform(node.pos, scale, xMin, yMin, offset);

    return {scale:scale, xMin:xMin, yMin:yMin};
}

function transform(pos, scale, xMin, yMin, offset) {
    return [offset+(pos[0]-xMin)*scale, offset+(pos[1]-yMin)*scale];
}


/**
 * @brief           Clear all elements in the desired canvas
 * @param canvas    selected canvas
 */
function clear_canvas(canvas){
    context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
}


/**
 * @brief			Draw a point in the location of the intersection between AB and DC
 * @param A			xy-coordinate of A
 * @param B			xy-coordinate of B 
 * @param C			xy-coordinate of C 
 * @param D			xy-coordinate of D 
 * @param canvas 	selected canvas
 */
function draw_intersection(A, B, C, D, canvas) {
	let m1 = (B[1] - A[1]) / (B[0] - A[0]);
	let m2 = (D[1] - C[1]) / (D[0] - C[0]);
	let b1 = A[1] - m1*A[0];
	let b2 = C[1] - m2*C[0];

	let x = (b2-b1)/(m1-m2);
	let y = m1*x + b1;

	draw_point(x, y, canvas, "midnightblue");
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
    context = canvas.getContext('2d');
    context.beginPath();
    context.arc(x, y, 3, 0, 2 * Math.PI);
    context.fillStyle = color;
    context.fill();

    // label, if required
    x_text = x + 8;
    y_text = y - 6;
    if (x + 5 >= canvas.width) x_text = x - 18;
    if (y - 5 <= 0) y_text = y + 18;
    context.font = "bold 14px sans-serif";
    context.fillText(label, x_text, y_text);
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
    context = canvas.getContext('2d');
    context.strokeStyle = color;
	context.lineWidth = 2;
    context.beginPath();
    context.moveTo(A[0], A[1]);
    context.lineTo(B[0], B[1]);
    context.stroke();
}


/**
 * @brief           Fill in the triangle with the desired colour
 * @param A         coordinates (x, y) of A
 * @param B         coordinates (x, y) of B
 * @param C         coordinates (x, y) of C
 * @param canvas    selected canvas
 * @param color     fill color
 */
function fill_triangle(A, B, C, canvas, color="lightblue") {
    // fill the background of the triangle ABC
    context = canvas.getContext('2d');
    context.fillStyle = color;
    context.globalAlpha = 0.5;
    context.beginPath();
    context.moveTo(A[0], A[1]);
    context.lineTo(B[0], B[1]);
    context.lineTo(C[0], C[1]);
    context.closePath();
    context.fill();
    context.globalAlpha = 1;
}


/**
 * @brief           Write down the label of the triangle ABC
 * @param A         coordinates (x, y) of A
 * @param B         coordinates (x, y) of B
 * @param C         coordinates (x, y) of C
 * @param number    number/label of the triangle
 * @param canvas    selected canvas
 * @param color     text color
 */
function label_triangle(A, B, C, number, canvas, color="black"){
    // identify the number of the triangle ABC
    context = canvas.getContext('2d');
    x_label = (A[0] + B[0] + C[0])/3;
    y_label = (A[1] + B[1] + C[1])/3;
    context.fillStyle = color;
    context.font = "bold 12px sans-serif";
    context.fillText(number, x_label, y_label);
}


/**
 * @brief				Get the point location and find the triangle that contains it
 * @param e 			event by the client
 * @param mesh 			mesh structure as doubly-connected edge list
 * @param canvas 		selected canvas
 */
function find_triangle_location(e, mesh, canvas) {
	// get point coordinates
	const rect = canvas.getBoundingClientRect();
	var point = [e.clientX - rect.left, e.clientY - rect.top];

	// get midpoint of a reference edge
	referenceFace = mesh.faces[39];
	var midPoint = [(referenceFace.incidentEdge.orig.pos[0]+referenceFace.incidentEdge.dest.pos[0])/2, (referenceFace.incidentEdge.orig.pos[1]+referenceFace.incidentEdge.dest.pos[1])/2];
	
	// get segment between reference edge and point
	referenceSegment = [midPoint, point];
	
	// search for the triangle that contains the point
	containerFace = find_triangle(referenceFace, referenceSegment);

	// fill the triangle and display the point with face.id
	fill_triangle(containerFace.incidentEdge.orig.pos, containerFace.incidentEdge.dest.pos, containerFace.incidentEdge.next.dest.pos, canvas);
	var string = "Triangle " + containerFace.id.toString();
	draw_point(point[0], point[1], canvas, color="midnightblue", label=string);
	//label_triangle(containerFace.incidentEdge.orig.pos, containerFace.incidentEdge.dest.pos, containerFace.incidentEdge.next.dest.pos, containerFace.id, canvas, "black");
}


/**
 * @brief				Given a starting triangle, search for the face that has only one intersection with the segment
 * @param startFace 	starting face
 * @param segment 		segment to find intersection with edges
 * @returns 			face with only one intersection with segment
 */
function find_triangle(startFace, segment) {
	intersectionEdge = startFace.incidentEdge;
	while(true) {
		nextEdge = intersectionEdge;
		intersectionEdge = check_inside_triangle(segment, nextEdge);
		if (intersectionEdge == null) {
			// triangle that contains the point
			return (nextEdge.incidentFace);
		}
	}
}


/**
 * @brief				Given the edge that the segment enters the triangle, search for the exit one
 * @param segment 		selected segment
 * @param currentEdge 	edge that segment enters the triangle
 * @returns 			the opposite of exit edge, if it exists, otherwise, null
 */
function check_inside_triangle(segment, currentEdge) {
	nextEdge = currentEdge.next;
	intersection = check_intersection(segment[0], segment[1], nextEdge.orig.pos, nextEdge.dest.pos);
	if (intersection) {
		return nextEdge.oppo;
	} 
	else {
		intersectionNext = check_intersection(segment[0], segment[1], nextEdge.next.orig.pos, nextEdge.next.dest.pos);
		if (intersectionNext) {
			return nextEdge.next.oppo;
		}
		else {
			return null;
		}
	}
}


/**
 * @brief				Get the segment and find the intersections it has with the mesh
 * @param segment 		segment given by client
 * @param mesh 			mesh structure as doubly-connected edge list
 * @param canvas 		selected canvas
 */
function find_segment_location(segment, mesh, canvas) {
	// get an arbitrary triangle
	referenceFace = mesh.faces[39];

	// get midpoint of the edge
	var midPoint = [(referenceFace.incidentEdge.orig.pos[0]+referenceFace.incidentEdge.dest.pos[0])/2, (referenceFace.incidentEdge.orig.pos[1]+referenceFace.incidentEdge.dest.pos[1])/2];

	// find the triangle one of the segment's vertex is located
	startFace = find_triangle(referenceFace, [midPoint, segment[0]]);
	fill_triangle(startFace.incidentEdge.orig.pos, startFace.incidentEdge.dest.pos, startFace.incidentEdge.next.dest.pos, canvas);
	label_triangle(startFace.incidentEdge.orig.pos, startFace.incidentEdge.dest.pos, startFace.incidentEdge.next.dest.pos, startFace.id, canvas, "steelblue");
	// find the edge and point that intersect in startFace
	startEdge = startFace.incidentEdge;
	intersection = check_intersection(segment[0], segment[1], startEdge.orig.pos, startEdge.dest.pos);

	// in case the incidentEdge is already the intersectionEdge, go to the face of the opposite edge of incidentEdge
	if (intersection) {
		draw_intersection(segment[0], segment[1], startEdge.orig.pos, startEdge.dest.pos, canvas);
		currentFace = startEdge.oppo.incidentFace;
		fill_triangle(currentFace.incidentEdge.orig.pos, currentFace.incidentEdge.dest.pos, currentFace.incidentEdge.next.dest.pos, canvas);
		label_triangle(currentFace.incidentEdge.orig.pos, currentFace.incidentEdge.dest.pos, currentFace.incidentEdge.next.dest.pos, currentFace.id, canvas, "steelblue");
		startEdge = startEdge.oppo;
	}
	lastFace = find_segment(startEdge, segment, canvas);
}


/**
 * @brief						Given the entrance segment, find the triangle does not have an exit one
 * @param intersectionEdge 		entrance segment
 * @param segment 				segment given by the client
 * @param canvas 				selected canvas
 * @returns 					face without the exit segment
 */
function find_segment(intersectionEdge, segment, canvas) {
	while(true) {
		nextEdge = intersectionEdge;
		intersectionEdge = check_intersection_segment(segment, nextEdge, canvas);
		if (intersectionEdge == null) {
			// if there is no intersection, triangle contains the point
			return (nextEdge.incidentFace);
		}
	}
}


/**
 * @brief					Find and display intersection with exit segment inside the given triangle (incidentFace)
 * @param segment 			segment given by the client
 * @param currentEdge 		entrance segment
 * @param canvas 			selected canvas
 * @returns 				the opposite of exit edge, if it exists, otherwise, null
 */
function check_intersection_segment(segment, currentEdge, canvas) {
	nextEdge = currentEdge.next;
	intersection = check_intersection(segment[0], segment[1], nextEdge.orig.pos, nextEdge.dest.pos);
	if (intersection) {
		draw_intersection(segment[0], segment[1], nextEdge.orig.pos, nextEdge.dest.pos, canvas);
		currentFace = nextEdge.oppo.incidentFace;
		fill_triangle(currentFace.incidentEdge.orig.pos, currentFace.incidentEdge.dest.pos, currentFace.incidentEdge.next.dest.pos, canvas);
		label_triangle(currentFace.incidentEdge.orig.pos, currentFace.incidentEdge.dest.pos, currentFace.incidentEdge.next.dest.pos, currentFace.id, canvas, "steelblue");
		return nextEdge.oppo;
	} 
	else {
		intersectionNext = check_intersection(segment[0], segment[1], nextEdge.next.orig.pos, nextEdge.next.dest.pos);
		if (intersectionNext) {
			draw_intersection(segment[0], segment[1], nextEdge.next.orig.pos, nextEdge.next.dest.pos, canvas);
			currentFace = nextEdge.next.oppo.incidentFace;
			fill_triangle(currentFace.incidentEdge.orig.pos, currentFace.incidentEdge.dest.pos, currentFace.incidentEdge.next.dest.pos, canvas);
			label_triangle(currentFace.incidentEdge.orig.pos, currentFace.incidentEdge.dest.pos, currentFace.incidentEdge.next.dest.pos, currentFace.id, canvas, "steelblue");
			return nextEdge.next.oppo;
		}
		else {
			return null;
		}
	}
}


/**
 * @brief           Verify if two line segments intersect (AB and CD)
 * @param A 		xy-coordinate of A
 * @param B 		xy-coordinate of B     
 * @param C 		xy-coordinate of C
 * @param D 		xy-coordinate of D
 * @returns         0: if there is not an overlap 1: if there is an overlap
 */
function check_overlap(A, B, C, D) {
    const xstart_max = Math.max(Math.min(A[0], B[0]), Math.min(C[0], D[0]));
    const xend_min = Math.min(Math.max(A[0], B[0]), Math.max(C[0], D[0]));
  
    const ystart_max = Math.max(Math.min(A[1], B[1]), Math.min(C[1], D[1]));
    const yend_min = Math.min(Math.max(A[1], B[1]), Math.max(C[1], D[1]));
  
    // check for no overlap
    if (xstart_max > xend_min || ystart_max > yend_min) return 0; 
    return 1; // overlap
}


/**
 * @brief           Calculates the cross-product between the vector to get orientation
 * @param A        	xy-coordinate of A
 * @param B        	xy-coordinate of B   
 * @param C        	xy-coordinate of C
 * @returns         1: counterclockwise; 0: collinear; -1: clockwise;
 */
function get_orientation(A, B, C) {
    // positive determinant
    if (((C[1] - A[1])*(B[0] - A[0])) > ((B[1] - A[1])*(C[0] - A[0]))) return 1; 
    // nolinear points
    else if (((C[1] - A[1])*(B[0] - A[0])) == ((B[1] - A[1])*(C[0] - A[0]))) return 0; 
    // negative determinant
    return -1;
}


/**
 * @brief           Verify it there is intersection between two segments
 * @param A        	xy-coordinate of A
 * @param B        	xy-coordinate of B
 * @param C        	xy-coordinate of C
 * @param D        	xy-coordinate of D
 * @returns         1: concurrent lines with intersection; 0: collinear lines without overlap or
 *                  concurrent lines without intersection -1: conllinear lines with intersection;
 */
function check_intersection(A, B, C, D) {
    var d1 = get_orientation(A, B, C);
    var d2 = get_orientation(A, B, D);
    var d3 = get_orientation(A, C, D);
    var d4 = get_orientation(B, C, D);

    overlap = check_overlap(A, B, C, D);

    // colinear lines without overlap
    if ((d1 == d2) && (d3 == d4) && (d4 == 0)){
        if (overlap == 0) return 0;
        // colinear lines without overlap
        return -1;
    } 
    // concurrent lines
    return ((d1 != d2) && (d3 != d4));
}