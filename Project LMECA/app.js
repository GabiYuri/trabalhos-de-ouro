/* NUMERICAL GEOMETRY - Project
Gabriel de Morais Pires
Gabriela Ishikawa */

// ===========================================
// =============== FLIP EDGE ================
// ===========================================

async function flipAlgorithm() {

	// Insert all the internal edges of the triangulation in a stack
	let stack = [];
	for (edge of mesh.edges) {
		if (edge.oppo != null) {
			stack.push(edge);
		}
	}

	// Do while the stack is not empty
	while (stack.length > 0) {

		console.log("There are", stack.length, "edges in the stack.")

		// Pop the top edge from the stack
		let edge = stack.pop();
		

		draw_mesh(mesh, canvas1);
		// print edge in red
		draw_edge(edge.orig.pos, edge.dest.pos, canvas1, color="red");

		await waitOneSecond();

		// If the edge is not Delaunay, flip it and add the new edges to the stack
		if (!isDelaunay(edge)) {
			console.log("This edge is not Delaunay.")
			clear_canvas(canvas1);
			flipEdge(edge);
			draw_mesh(mesh, canvas1);
			stack.push(edge.next);
			stack.push(edge.next.next);
			stack.push(edge.oppo.next);
			stack.push(edge.oppo.next.next);
		}

		// iF the edge is Delaunay, remove it from the stack
		else {
			console.log("This edge is Delaunay.");
			//stack.splice(stack.indexOf(edge), 1);
		} 

		await waitOneSecond();
	}

	console.log("Done!");
}

function waitOneSecond() {
    return new Promise(resolve => setTimeout(resolve, 500));
}


// Function to check if an edge is Delaunay
async function isDelaunay(edge) {
    const A = edge.orig.pos; // Coordinates of the origin node of the edge
    const B = edge.dest.pos; // Coordinates of the destination node of the edge
    const face1 = edge.incidentFace;
    const face2 = edge.oppo.incidentFace;

    // Check if both faces exist (i.e., edge is on the convex hull)
    if (!face1 || !face2) {
        return true;
    }

    // Get the third vertex of each face (not on the edge)
    const C1 = edge.next.dest.pos;
    const C2 = edge.oppo.next.dest.pos;

    // Calculate circumcenters and circumradii for both triangles
    const [xc1, yc1, rc1] = circumcenter(A, B, C1);
    const [xc2, yc2, rc2] = circumcenter(A, B, C2);

	// plot A, B, C1, C2
	draw_point(A[0], A[1], canvas1, color="red", label="A");
	draw_point(B[0], B[1], canvas1, color="red", label="B");
	draw_point(C1[0], C1[1], canvas1, color="red", label="C1");
	draw_point(C2[0], C2[1], canvas1, color="red", label="C2");
	// plot circumcenters and circles
	draw_point(xc1, yc1, canvas1, color="red");
	draw_point(xc2, yc2, canvas1, color="red");
	draw_circle(xc1, yc1, rc1, canvas1);
	draw_circle(xc2, yc2, rc2, canvas1);

	await waitOneSecond();

    // If any circumcenter is null, the points are collinear and not Delaunay
    if (!xc1 || !yc1 || !rc1 || !xc2 || !yc2 || !rc2) {
        return false;
    }

    // Check if C1 is inside the circumcircle of triangle A, B, C2
	if (distance([xc2, yc2], C1) <= rc2) {
		return false;
	}

	// Check if C2 is inside the circumcircle of triangle A, B, C1
	if (distance([xc1, yc1], C2) <= rc1) {
		return false;
	}

	return true;
}

function flipEdge(edgeToFlip) {

    if (!edgeToFlip || !edgeToFlip.oppo) {
        console.log("Edge cannot be flipped.");
        return;
    }

    let originalEdge = edgeToFlip;
	let originalnext = originalEdge.next;
	let originalnextnext = originalEdge.next.next;

    let oppositeEdge = edgeToFlip.oppo;
	let oppositenext = oppositeEdge.next;
	let oppositenextnext = oppositeEdge.next.next;

    let FaceA = originalEdge.incidentFace;
    let FaceB = oppositeEdge.incidentFace;

    // Identify the four involved vertices
    let leftVertex = originalEdge.next.dest;
    let rightVertex = oppositeEdge.next.dest;

	let topVertex = originalEdge.dest;
    let bottomVertex = oppositeEdge.dest;

	if (check_intersection(leftVertex.pos, rightVertex.pos, topVertex.pos, bottomVertex.pos) != 1) {
        console.log("Edge on concave polygon.");
        return;
    }
	
    // Update the edge connectivity
    originalEdge.orig = leftVertex;
    originalEdge.dest = rightVertex;

    oppositeEdge.orig = rightVertex;
    oppositeEdge.dest = leftVertex;	

    // Update next pointers for all edges of both triangles
    originalEdge.next = oppositenextnext;
    oppositeEdge.next = originalnextnext;
	
    originalEdge.next.next = originalnext;
	oppositeEdge.next.next = oppositenext;

	originalEdge.next.next.next = originalEdge;
	oppositeEdge.next.next.next = oppositeEdge;

	// Update face connectivity
    FaceA.incidentEdge = originalEdge;
    FaceB.incidentEdge = oppositeEdge;

	originalEdge.next.incidentFace = FaceA;
	oppositeEdge.next.incidentFace = FaceB;
}

// ===========================================
// =========== SWEEP LINE ====================
// ===========================================

function create_mesh2(nodeData) {
	// Initialize data structure of a doubly-connected edge list
	mesh = {
		nodes: [],
		faces: [],
		edges: []
	};


	// Mesh data from json file
	node_data = nodeData;			// nodes - Coordinates, Indices

	// Create nodes
	for (let i = 0; i < node_data.length; i++){
		// node structure
		node = {
			id: i,
			pos: node_data[i]
		};
		// add node to mesh.nodes array
		mesh.nodes.push(node);
	}
	return mesh;
}

function draw_mesh2(mesh, canvas) {
	size_adapt(canvas, mesh.nodes, offset=0);

	context = canvas.getContext('2d');
	context.strokeStyle = "steelblue";
	
	// Draw nodes
	for (node of mesh.nodes) {
		draw_point(node.pos[0], node.pos[1], canvas, color="midnightblue", label=node.id.toString());
	}
}

// Create a function that, for three points, returns the circumcenter and the circumradius
function circumcenter(A, B, C) {
	// check if the points are collinear
	if (get_orientation(A, B, C) == 0) return null;
	
	// get the coordinates of the circumcenter
	const x = ((A[0]**2 + A[1]**2)*(B[1] - C[1]) + (B[0]**2 + B[1]**2)*(C[1] - A[1]) + (C[0]**2 + C[1]**2)*(A[1] - B[1])) / (2*(A[0]*(B[1] - C[1]) - A[1]*(B[0] - C[0]) + B[0]*C[1] - B[1]*C[0]));
	const y = ((A[0]**2 + A[1]**2)*(C[0] - B[0]) + (B[0]**2 + B[1]**2)*(A[0] - C[0]) + (C[0]**2 + C[1]**2)*(B[0] - A[0])) / (2*(A[0]*(B[1] - C[1]) - A[1]*(B[0] - C[0]) + B[0]*C[1] - B[1]*C[0]));
	
	// get the circumradius
	const r = Math.sqrt((x - A[0])**2 + (y - A[1])**2);
	return [x, y, r];
}

// Create a function that, for the circumcenter and the circumradius, plot the circumcircle
function draw_circle(x, y, r, canvas) {

	// draw the circumcircle
	context = canvas.getContext('2d');
	context.beginPath();
	context.arc(x, y, r, 0, 2 * Math.PI);
	context.stroke();
}

// Create a function to get the extreme points of the mesh
function extreme_points(mesh) {
	let xMin = Number.MAX_VALUE;
	let yMin = Number.MAX_VALUE;
	let xMax = Number.MIN_VALUE;
	let yMax = Number.MIN_VALUE;

	for (node of mesh.nodes) {
		xMax = Math.max(xMax, node.pos[0]);
		xMin = Math.min(xMin, node.pos[0]);
		yMax = Math.max(yMax, node.pos[1]);
		yMin = Math.min(yMin, node.pos[1]);
	}

	return [xMin, yMin, xMax, yMax];
}

// Create a function to get the bounding box of the mesh
function bounding_box(mesh, canvas) {
	// get the extreme points of the mesh
	let [xMin, yMin, xMax, yMax] = extreme_points(mesh);

	// get the size of the diagonal of the bounding box
	const diagonal = Math.sqrt((xMax - xMin)**2 + (yMax - yMin)**2);
	return diagonal;
}

// Get the coordinates of the midpoint of the bounding box 
function midpoint(mesh) {
	// get the extreme points of the mesh
	let [xMin, yMin, xMax, yMax] = extreme_points(mesh);

	// get the coordinates of the midpoint
	const x = (xMin + xMax)/2;
	const y = (yMin + yMax)/2;

	return [x, y];
}

function super_triangle(mesh, canvas) {
	// get midpoint of the mesh
	const [x, y] = midpoint(mesh);

	// get the size of the diagonal of the bounding box
	const diagonal = bounding_box(mesh, canvas);

	const new_diagonal = diagonal*2;

	// draw a circle at the midpoint of the mesh with the radius of the diagonal of the bounding box
	draw_circle(x, y, new_diagonal, canvas);

	// get a point at 0, 90, 225 degrees of the circle
	const A = [x + new_diagonal, y];
	const B = [x, y + new_diagonal];
	const C = [x - new_diagonal/Math.sqrt(2), y - new_diagonal/Math.sqrt(2)];

	// draw the points A, B and C
	draw_point(A[0], A[1], canvas, color="midnightblue", label="A");
	draw_point(B[0], B[1], canvas, color="midnightblue", label="B");
	draw_point(C[0], C[1], canvas, color="midnightblue", label="C");

	// draw the edges AB, BC and CA
	draw_edge(A, B, canvas, color="midnightblue");
	draw_edge(B, C, canvas, color="midnightblue");
	draw_edge(C, A, canvas, color="midnightblue");


}

// for finding the convex hull
function orientation(p, q, r) {
    var r = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
    if (r == 0) return 0;
    return (r > 0) ? 1 : -1;
}

function distance(a, b) {
    var res = ((b[0] - a[0]) ** 2) + ((b[1] - a[1]) ** 2);
    res = Math.sqrt(res);
    return res; 
}

function compare(a, b) { 
    var p = bottomMost;
    var o = get_orientation(p, a, b); 
    if (o == 0) 
        return (distance(p, b) >= distance(p, a))? -1 : 1; 
   return (o == -1)? -1: 1; 
}

function findConvex(mesh) {
	
	points = mesh.nodes.map(node => node.pos);

	// sort by y-axis values
	points.sort(function(a, b) {return a[1] - b[1]});
    bottomMost = points[0];
    points.splice(0, 1);

	// separates from bottom and top half
	points.sort(compare);
    points.unshift(bottomMost);

    // get 2 points to start comparing
    var stack = [points[0], points[1]];
    var tracker = 2;
    var count = 2;
    while(true) {
        var check = false;
        if (tracker == (points.length)) {
            break;
        }
        if (get_orientation(stack[count - 2], stack[count - 1], points[tracker]) == -1) {
            stack.push(points[tracker]);
            count++;
        } else {
            count--;
            stack.pop();
            check = true;
        }
        var s = stack.slice();
        
        if (!check) {
            tracker++;
        }
    }

	var convexVertex = [];
	for (let i = 0; i < stack.length; i++) {
		id = mesh.nodes.map(node => node.pos).findIndex(element => element === stack[i]);
		convexVertex.push(mesh.nodes[id]);
	}

	// make it counterclockwise
	convexVertex.reverse();
    return convexVertex;
}

function drawConvex(convexVertex, canvas) {
	for (let i = 0; i < convexVertex.length - 1; i++) {
		draw_edge(convexVertex[i].pos, convexVertex[i+1].pos, canvas);
	}
	draw_edge(convexVertex[convexVertex.length-1].pos, convexVertex[0].pos, canvas);
}

function create_big_triangles(mesh, convexVertex) {
	// get first node to triangulate
	missingNodes = mesh.nodes.filter(element => !convexVertex.includes(element));

	middleCanvas = [canvas1.width/2, canvas1.height/2];

	// sort by distance to the middle of the canvas
	missingNodes.sort(function(a, b) {return distance(middleCanvas, a.pos) - distance(middleCanvas, b.pos)});

	node = missingNodes[0];

	for (let i = 0; i < convexVertex.length; i++) {
		// create edges of convex hull
		face = {
			id: i,
			incidentEdge: null
		};

		edge = {
			orig: convexVertex[i],
			dest: convexVertex[(i+1)%convexVertex.length],
			incidentFace: face,
			next: null,
			oppo: null
		};

		face.incidentEdge = edge;

		mesh.edges.push(edge);
		mesh.faces.push(face);
	}

	edge = {
		orig: node,
		dest: mesh.edges[0].orig,
		incidentFace: mesh.faces[0],
		next: mesh.edges[0],
		oppo: null
	};

	edge_oppo = {
		orig: mesh.edges[0].orig,
		dest: node,
		incidentFace: mesh.faces[mesh.faces.length-1],
		next: null,
		oppo: edge
	};

	edge.oppo = edge_oppo;
	mesh.faces[mesh.faces.length-1].incidentEdge.next = edge_oppo;
	mesh.edges.push(edge);


	for (let i = convexVertex.length - 1; i > 0; i--) {

		last_oppo = edge.oppo

		edge = {
			orig: node,
			dest: convexVertex[i],
			incidentFace: mesh.faces[i],
			next: mesh.edges[i],
			oppo: null
		};
		last_oppo.next = edge;

		edge_oppo = {
			orig: convexVertex[i],
			dest: node,
			incidentFace: mesh.faces[i-1],
			next: null,
			oppo: edge
		};
		edge.oppo = edge_oppo;
		mesh.faces[i-1].incidentEdge.next = edge_oppo;
		mesh.edges.push(edge);
		mesh.edges.push(last_oppo);
	}

	edge_oppo.next = mesh.edges[convexVertex.length];
	mesh.edges.push(edge_oppo);

}

// for finding the convex hull
function orientation(p, q, r) {
    var r = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1]);
    if (r == 0) return 0;
    return (r > 0) ? 1 : -1;
}

function distance(a, b) {
    var res = ((b[0] - a[0]) ** 2) + ((b[1] - a[1]) ** 2);
    res = Math.sqrt(res);
    return res; 
}

function compare(a, b) { 
    var p = bottomMost;
    var o = orientation(p, a, b); 
    if (o == 0) 
        return (distance(p, b) >= distance(p, a))? -1 : 1; 
   return (o == -1)? -1: 1; 
}

function findConvex(mesh) {
	
	points = mesh.nodes.map(node => node.pos);

	// sort by y-axis values
	points.sort(function(a, b) {return a[1] - b[1]});
    bottomMost = points[0];
    points.splice(0, 1);

	// separates from bottom and top half
	points.sort(compare);
    points.unshift(bottomMost);

    // get 2 points to start comparing
    var stack = [points[0], points[1]];
    var tracker = 2;
    var count = 2;
    while(true) {
        var check = false;
        if (tracker == (points.length)) {
            break;
        }
        if (orientation(stack[count - 2], stack[count - 1], points[tracker]) == -1) {
            stack.push(points[tracker]);
            count++;
        } else {
            count--;
            stack.pop();
            check = true;
        }
        var s = stack.slice();
        
        if (!check) {
            tracker++;
        }
    }

	var convexVertex = [];
	for (let i = 0; i < stack.length; i++) {
		id = mesh.nodes.map(node => node.pos).findIndex(element => element === stack[i]);
		convexVertex.push(mesh.nodes[id]);
	}

	// make it counterclockwise
	convexVertex.reverse();
    return convexVertex;
}

function drawConvex(convexVertex, canvas) {
	for (let i = 0; i < convexVertex.length - 1; i++) {
		draw_edge(convexVertex[i].pos, convexVertex[i+1].pos, canvas);
	}
	draw_edge(convexVertex[convexVertex.length-1].pos, convexVertex[0].pos, canvas);
}

function create_random_triangles(mesh, convexVertex) {
	// get first node to triangulate
	missingNodes = mesh.nodes.filter(element => !convexVertex.includes(element));
	node = missingNodes[0];

	for (let i = 0; i < convexVertex.length; i++) {
		// create edges of convex hull
		face = {
			id: i,
			incidentEdge: null
		};

		edge = {
			orig: convexVertex[i],
			dest: convexVertex[(i+1)%convexVertex.length],
			incidentFace: face,
			next: null,
			oppo: null
		};

		face.incidentEdge = edge;

		mesh.edges.push(edge);
		mesh.faces.push(face);
	}

	edge = {
		orig: node,
		dest: mesh.edges[0].orig,
		incidentFace: mesh.faces[0],
		next: mesh.edges[0],
		oppo: null
	};

	edge_oppo = {
		orig: mesh.edges[0].orig,
		dest: node,
		incidentFace: mesh.faces[mesh.faces.length-1],
		next: null,
		oppo: edge
	};

	edge.oppo = edge_oppo;
	mesh.faces[mesh.faces.length-1].incidentEdge.next = edge_oppo;
	mesh.edges.push(edge);


	for (let i = convexVertex.length - 1; i > 0; i--) {

		last_oppo = edge.oppo

		edge = {
			orig: node,
			dest: convexVertex[i],
			incidentFace: mesh.faces[i],
			next: mesh.edges[i],
			oppo: null
		};
		last_oppo.next = edge;

		edge_oppo = {
			orig: convexVertex[i],
			dest: node,
			incidentFace: mesh.faces[i-1],
			next: null,
			oppo: edge
		};
		edge.oppo = edge_oppo;
		mesh.faces[i-1].incidentEdge.next = edge_oppo;
		mesh.edges.push(edge);
		mesh.edges.push(last_oppo);
	}

	edge_oppo.next = mesh.edges[convexVertex.length];
	mesh.edges.push(edge_oppo);

}



// ===========================================
// =========== BASIC FUNCTIONS ===============
// ===========================================



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
	//size_adapt(canvas, mesh.nodes, offset=0);

	// Draw triangles
	context = canvas.getContext('2d');
	context.strokeStyle = "steelblue";
	for (face of mesh.faces) {
		edge = face.incidentEdge;
		face_nodes = [edge.orig.pos, edge.next.orig.pos, edge.next.next.orig.pos, edge.next.next.dest.pos];
		context.beginPath();
		context.lineWidth = 1;
		context.moveTo(face_nodes[0][0], face_nodes[0][1]);
		context.lineTo(face_nodes[1][0], face_nodes[1][1]);
		context.lineTo(face_nodes[2][0], face_nodes[2][1]);
		context.lineTo(face_nodes[3][0], face_nodes[3][1]);
		context.stroke();
	}

	// Draw nodes
	for (node of mesh.nodes) {
		draw_point(node.pos[0], node.pos[1], canvas, color="midnightblue", label=node.id.toString());
	}
}


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
 * @param triangle 	triangle to fill
 * @param canvas    selected canvas
 * @param color     fill color
 */
function fill_triangle(triangle, canvas, color="lightblue") {
    // fill the background of the triangle ABC
	A = triangle.incidentEdge.orig.pos
	B = triangle.incidentEdge.dest.pos
	C = triangle.incidentEdge.next.dest.pos
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
 * @param node 			event by the client
 * @param mesh 			mesh structure as doubly-connected edge list
 * @param canvas 		selected canvas
 */
function find_triangle_location2(node, mesh, canvas) {
	// get point coordinates
	var point = node.pos;

	// get a reference edge and point
	refFace = mesh.faces[0];
	A = refFace.incidentEdge.orig.pos;
	B = refFace.incidentEdge.dest.pos;
	var refPoint = [ A[0] + (1/3) * (B[0] - A[0]), A[1] + (1/3) * (B[1] - A[1]) ];
	
	// get segment between reference edge and point
	refSegment = [refPoint, point];
	
	// search for the triangle that contains the point
	inTriangle = find_triangle(refFace, refSegment);
	//label_triangle(containerFace.incidentEdge.orig.pos, containerFace.incidentEdge.dest.pos, containerFace.incidentEdge.next.dest.pos, containerFace.id, canvas, "black");

	return inTriangle;
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
 *                  concurrent lines without intersection -1: collinear lines with intersection;
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