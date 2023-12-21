// ================================================
// =============== FLIP ALGORITHM =================
// ================================================


/**
 * @brief				use the flip algorithm to triangulate a set of points
 * @param mesh 			mesh structure as doubly-connected edge list 			
 * @param canvas 		selected canvas 						
 */
function flip_algorithm(mesh, canvas) {

	// insert all the internal edges of the triangulation in a stack
	let stack = [];
	for (edge of mesh.edges) {
		if (edge.oppo != null) {
			stack.push(edge);
		}
	}

	// do while the stack is not empty
	while (stack.length > 0) {

		// pop the top edge from the stack
		let edge = stack.pop();
				
		// if the edge is not Delaunay, flip it and add the new edges to the stack
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

/**
 * @brief				function that checks if an edge is Delaunay
 * @param edge 			edge to check
 * @param canvas		selected canvas
 * @param animated		if true, the function plots the circumcenters and circumcircles
 * @returns 			true if the edge is Delaunay, false otherwise
 */
function isDelaunay(edge, canvas, animated=false) {

	// check if both faces exist (i.e., edge is on the convex hull)
    if (!edge || !(edge.oppo)) {
		if (animated) console.log("Edge is on the convex hull.");
        return true;
    }

    const A = edge.orig.pos; // coordinates of the origin node of the edge
    const B = edge.dest.pos; // coordinates of the destination node of the edge

    // get the third vertex of each face (not on the edge)
    const C1 = edge.next.dest.pos;
    const C2 = edge.oppo.next.dest.pos;

    // calculate circumcenters and circumradii for both triangles
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

    // if any circumcenter is null, the points are collinear and not Delaunay
    if (!xc1 || !yc1 || !rc1 || !xc2 || !yc2 || !rc2) {
		if (animated) console.log("Collinear points.");
        return false;
    }

	// check if point C1 is inside the circumcircle of A, B and C2
	if (distance([xc2, yc2], C1) < rc2) {
		if (animated) console.log("Point C1 is inside the circumcircle of A, B and C2.");
		return false;
	}

	// check if point C2 is inside the circumcircle of A, B and C1
	if (distance([xc1, yc1], C2) < rc1) {
		if (animated) console.log("Point C2 is inside the circumcircle of A, B and C1.");
		return false;
	} 

	return true;

}

/**
 * @brief				function that flips an edge
 * @param edge 			edge to flip
 * @returns 			1 if the edge was flipped, 0 otherwise
 */
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

/**
 * @brief		function that returmn the slope and y-intercept of the perpendicular bisector of an edge
 * @param edge 	edge to calculate the perpendicular bisector
 * @returns 	slope and y-intercept of the perpendicular bisector
 */
function perpendicular_bisector(edge) {

    // get the coordinates of the two vertices of the edge
    const A = edge.orig.pos;
    const B = edge.dest.pos;

    // calculate the midpoint of the edge
    const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];

    // calculate the slope of the original line
    const originalSlope = (B[1] - A[1]) / (B[0] - A[0]);

    // calculate the slope of the perpendicular line (negative reciprocal)
    const perpendicularSlope = -1 / originalSlope;

    // calculate the y-intercept of the perpendicular line
    const b = mid[1] - perpendicularSlope * mid[0];

    return [perpendicularSlope, b];
}

/**
 * @brief 	    function that calculates the intersection point of two lines
 * @param m1 	slope of the first line
 * @param b1 	y-intercept of the first line
 * @param m2 	slope of the second line
 * @param b2 	y-intercept of the second line
 * @param canvas selected canvas
 * @returns 	coordinates of the intersection point
 */
function intersection_point(m1, b1, m2, b2, canvas) {

	// calculate the x-coordinate of the intersection point
	const x = (b2 - b1) / (m1 - m2);

	// calculate the y-coordinate of the intersection point
	const y = m1 * x + b1;

	draw_point(x, y, canvas, color="red");

	// return the coordinates of the intersection point
	return [x, y];
}

/**
 * @brief				function that print the Voronoi diagram
 * @param mesh 			mesh structure as doubly-connected edge list
 * @param canvas 		selected canvas
 */
function voronoi(mesh, canvas) {

	// the index of this array also represents the id of the delaunay-face related to this vertex
	let vertex = [];

	// for every triangle, draw the perpendicular bisector of each edge
	for (face of mesh.faces) {
		const [m1, b1] = perpendicular_bisector(face.incidentEdge);
		const [m2, b2] = perpendicular_bisector(face.incidentEdge.next);
		
		[x, y] = intersection_point(m1, b1, m2, b2, canvas);
		vertex.push([x, y]);
	}

	for (face of mesh.faces) {

		face_id = face.id;

		// define an adjacent face, if it exists, and draw the edge between adjecent faces
		if (face.incidentEdge.oppo != null) {n1face_id = face.incidentEdge.oppo.incidentFace.id; draw_edge(vertex[face_id], vertex[n1face_id], canvas, color="red");}
		if (face.incidentEdge.next.oppo != null) {n2face_id = face.incidentEdge.next.oppo.incidentFace.id; draw_edge(vertex[face_id], vertex[n2face_id], canvas, color="red");}
		if (face.incidentEdge.next.next.oppo != null) {n3face_id = face.incidentEdge.next.next.oppo.incidentFace.id; draw_edge(vertex[face_id], vertex[n3face_id], canvas, color="red");}
	}
}