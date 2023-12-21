// ================================================
// =============== FLIP ALGORITHM =================
// ================================================



function flip_algorithm(mesh, canvas) {

	// Insert all the internal edges of the triangulation in a stack
	let stack = [];
	for (edge of mesh.edges) {
		if (edge.oppo != null) {
			stack.push(edge);
		}
	}

	// Do while the stack is not empty
	while (stack.length > 0) {

		// Pop the top edge from the stack
		let edge = stack.pop();
				
		// If the edge is not Delaunay, flip it and add the new edges to the stack
		if (!isDelaunay(edge, canvas)) {
			const wasflipped = flipEdge(edge);

			// if was flipped, add the new edges to the end of the stack, but check if they are not already there
			if (wasflipped) {
				if (!stack.includes(edge.next)) {stack.push(edge.next)};
				if (!stack.includes(edge.oppo.next.next)) {stack.push(edge.oppo.next.next)}
				if (!stack.includes(edge.oppo.next)) {stack.push(edge.oppo.next)};	
				if (!stack.includes(edge.next.next)) {stack.push(edge.next.next)};			
			}
		}	
	}
}

// Function to check if an edge is Delaunay
function isDelaunay(edge, canvas, animated=false) {

	// Check if both faces exist (i.e., edge is on the convex hull)
    if (!edge || !(edge.oppo)) {
		if (animated) console.log("Edge is on the convex hull.");
        return true;
    }

    const A = edge.orig.pos; // Coordinates of the origin node of the edge
    const B = edge.dest.pos; // Coordinates of the destination node of the edge

    // Get the third vertex of each face (not on the edge)
    const C1 = edge.next.dest.pos;
    const C2 = edge.oppo.next.dest.pos;

    // Calculate circumcenters and circumradii for both triangles
    const [xc1, yc1, rc1] = circumcenter(A, B, C1);
    const [xc2, yc2, rc2] = circumcenter(A, B, C2);

	if (animated) {
	// plot A, B, C1, C2
	draw_point(A[0], A[1], canvas, color="red");
	draw_point(B[0], B[1], canvas, color="red");
	draw_point(C1[0], C1[1], canvas, color="red");
	draw_point(C2[0], C2[1], canvas, color="red");
	// plot circumcenters and circles
	draw_point(xc1, yc1, canvas, color="red");
	draw_point(xc2, yc2, canvas, color="red");
	draw_circle(xc1, yc1, rc1, canvas);
	draw_circle(xc2, yc2, rc2, canvas);
	}

    // If any circumcenter is null, the points are collinear and not Delaunay
    if (!xc1 || !yc1 || !rc1 || !xc2 || !yc2 || !rc2) {
		if (animated) console.log("Collinear points.");
        return false;
    }

	// check if point C1 is inside the circumcircle of A, B and C2
	if (distance([xc2, yc2], C1) < rc2) {
		if (animated) console.log("Point C1 is inside the circumcircle of A, B and C2.");
		//console.log(distance([xc2, yc2], C1), rc2);
		return false;
	}

	// check if point C2 is inside the circumcircle of A, B and C1
	if (distance([xc1, yc1], C2) < rc1) {
		if (animated) console.log("Point C2 is inside the circumcircle of A, B and C1.");
		//console.log(distance([xc1, yc1], C2), rc1);
		return false;
	} 

	return true;

}

function flipEdge(edgeToFlip) {

    if (!edgeToFlip || !edgeToFlip.oppo) {
        console.log("Edge cannot be flipped.");
        return 0;
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
        return 0;
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

	return 1;
}

// Function that, given an edge, returns the perpendicular line segment bisector
function perpendicular_bisector(edge) {

    // Get the coordinates of the two vertices of the edge
    const A = edge.orig.pos;
    const B = edge.dest.pos;

    // Calculate the midpoint of the edge
    const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];

    // Calculate the slope of the original line
    const originalSlope = (B[1] - A[1]) / (B[0] - A[0]);

    // Calculate the slope of the perpendicular line (negative reciprocal)
    const perpendicularSlope = -1 / originalSlope;

    // Calculate the y-intercept of the perpendicular line
    const b = mid[1] - perpendicularSlope * mid[0];

	//draw_point(mid[0], mid[1], canvas1, color="red");
	//draw_line(perpendicularSlope, b, canvas1, color="red");

	// Return the slope and y-intercept of the perpendicular line
    return [perpendicularSlope, b];
}

// Function that, given two lines, returns the intersection point
function intersection_point(m1, b1, m2, b2, canvas) {

	// Calculate the x-coordinate of the intersection point
	const x = (b2 - b1) / (m1 - m2);

	// Calculate the y-coordinate of the intersection point
	const y = m1 * x + b1;

	draw_point(x, y, canvas, color="red");

	// Return the coordinates of the intersection point
	return [x, y];
}

function voronoi(mesh, canvas) {

	let vertex = [];

	// For every triangle, draw the perpendicular bisector of each edge
	for (face of mesh.faces) {
		const [m1, b1] = perpendicular_bisector(face.incidentEdge);
		const [m2, b2] = perpendicular_bisector(face.incidentEdge.next);
		
		[x, y] = intersection_point(m1, b1, m2, b2, canvas);
		vertex.push([x, y]);
	}

	//console.log(vertex);

	for (face of mesh.faces) {

		face_id = face.id;

		// define n1_face_id if face.incidentEdge.oppo is not null
		if (face.incidentEdge.oppo != null) {n1face_id = face.incidentEdge.oppo.incidentFace.id; draw_edge(vertex[face_id], vertex[n1face_id], canvas, color="red");}
		if (face.incidentEdge.next.oppo != null) {n2face_id = face.incidentEdge.next.oppo.incidentFace.id; draw_edge(vertex[face_id], vertex[n2face_id], canvas, color="red");}
		if (face.incidentEdge.next.next.oppo != null) {n3face_id = face.incidentEdge.next.next.oppo.incidentFace.id; draw_edge(vertex[face_id], vertex[n3face_id], canvas, color="red");}
	}
}