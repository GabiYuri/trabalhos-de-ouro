// ================================================
// =============== FLIP ALGORITHM =================
// ================================================

async function flip_algorithm(mesh, canvas) {

	// Insert all the internal edges of the triangulation in a stack
	let stack = [];
	for (edge of mesh.edges) {
		if (edge.oppo != null) {
			stack.push(edge);
		}
	}

	// Pop the firsts 59 edge from the stack and forget them 
	//for (let i = 0; i < 59; i++) {stack.pop();} 

	// Do while the stack is not empty
	while (stack.length > 0) {

		console.log("There are", stack.length, "edges in the stack.")
		console.log(stack);
	
		// Pop the top edge from the stack
		let edge = stack.pop();
		console.log("I'm checking the edge between", edge.orig.id, "and", edge.dest.id, ".")
		
		// For visualiation purposes
		clear_canvas(canvas);
		draw_mesh(mesh, canvas);
		draw_edge(edge.orig.pos, edge.dest.pos, canvas, color="red");
		await waitOneSecond();

		
		// If the edge is not Delaunay, flip it and add the new edges to the stack
		if (!isDelaunay(edge, canvas)) {
			await waitOneSecond();
			console.log("This edge is not Delaunay.")
			const wasflipped = flipEdge(edge);
			draw_mesh(mesh, canvas);

			// if was flipped, add the new edges to the end of the stack, but check if they are not already there
			if (wasflipped) {
				if (!stack.includes(edge.next)) {stack.push(edge.next); console.log("Aqui1")};
				if (!stack.includes(edge.oppo.next.next)) {stack.push(edge.oppo.next.next); console.log("Aqui4")}
				if (!stack.includes(edge.oppo.next)) {stack.push(edge.oppo.next); console.log("Aqui3")};	
				if (!stack.includes(edge.next.next)) {stack.push(edge.next.next); console.log("Aqui2")};			
			}
		}

		// iF the edge is Delaunay, remove it from the stack
		else {
			await waitOneSecond();
			console.log("This edge is Delaunay.");
		} 
		
	}

	console.log("Done!");
}

function waitOneSecond() {
    return new Promise(resolve => setTimeout(resolve, 50));
}


// Function to check if an edge is Delaunay
function isDelaunay(edge, canvas) {

	// Check if both faces exist (i.e., edge is on the convex hull)
    if (!edge || !(edge.oppo)) {
		console.log("Edge is on the convex hull.");
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

	// plot A, B, C1, C2
	draw_point(A[0], A[1], canvas, color="red", label="A");
	draw_point(B[0], B[1], canvas, color="red", label="B");
	draw_point(C1[0], C1[1], canvas, color="red", label="C1");
	draw_point(C2[0], C2[1], canvas, color="red", label="C2");
	// plot circumcenters and circles
	draw_point(xc1, yc1, canvas, color="red");
	draw_point(xc2, yc2, canvas, color="red");
	draw_circle(xc1, yc1, rc1, canvas);
	draw_circle(xc2, yc2, rc2, canvas);

    // If any circumcenter is null, the points are collinear and not Delaunay
    if (!xc1 || !yc1 || !rc1 || !xc2 || !yc2 || !rc2) {
		console.log("Collinear points.");
        return false;
    }


	/*
	for (node of mesh.nodes) {

			// Exclude A, B and C1 of the check
			if (node.id == edge.orig.id || node.id == edge.dest.id || node.id == edge.next.dest.id) continue;

			if (distance([xc1, yc1], node.pos) < rc1) {
				console.log("Point", node.id, "is inside the circumcircle of A, B and C1.");
				console.log(distance([xc1, yc1], node.pos), rc1);
				return false;
			}	
	}

	// Check if any point of the mesh is inside the circumcircle of A, B and C2
	for (node of mesh.nodes) {

			// Exclude A, B and C2 of the check
			if (node.id == edge.orig.id || node.id == edge.dest.id || node.id == edge.oppo.next.dest.id) continue;

			if (distance([xc2, yc2], node.pos) < rc2) {
				console.log("Point", node.id, "is inside the circumcircle of A, B and C2.");
				console.log(distance([xc2, yc2], node.pos), rc2);
				return false;
			}
	}*/

	// check if point C1 is inside the circumcircle of A, B and C2
	if (distance([xc2, yc2], C1) < rc2) {
		console.log("Point C1 is inside the circumcircle of A, B and C2.");
		console.log(distance([xc2, yc2], C1), rc2);
		return false;
	}

	// check if point C2 is inside the circumcircle of A, B and C1
	if (distance([xc1, yc1], C2) < rc1) {
		console.log("Point C2 is inside the circumcircle of A, B and C1.");
		console.log(distance([xc1, yc1], C2), rc1);
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