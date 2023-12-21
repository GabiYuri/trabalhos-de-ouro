async function flip_delaunay_animated(nodes, canvas) {
    var mesh = create_mesh_nodes(nodes);
	clear_canvas(canvas);
	draw_mesh(mesh, canvas);

    console.log("Click to find the Convex Hull");
	await waitForClick(canvas);

    var convexVertex = findConvex(mesh);
	drawConvex(convexVertex, canvas);

    console.log("Click to triangulate the Convex Hull");
	await waitForClick(canvas);

	var points2Triagulate = create_big_triangles(mesh, convexVertex);
	clear_canvas(canvas);
	draw_mesh(mesh, canvas);
	await waitDelay(100);

	for (point of points2Triagulate) {
		mesh = create_new_triangle(point, mesh, canvas);
        console.log("Generating Random Triangulation of the convex hull");
		clear_canvas(canvas);
		draw_mesh(mesh, canvas);
		await waitDelay(100);
	}

    console.log("Click to find the Delaunay Triangulation");
	await waitForClick(canvas);
	flip_algorithm_animated(mesh, canvas);
}

async function flip_algorithm_animated(mesh, canvas) {

	// Insert all the internal edges of the triangulation in a stack
	let stack = [];
	for (edge of mesh.edges) {
		if (edge.oppo != null) {
			stack.push(edge);
		}
	}

	// Do while the stack is not empty
	while (stack.length > 0) {

		//console.log("There are", stack.length, "edges in the stack.")
        //await waitDelay(200);
		//console.log(stack);
	
		// Pop the top edge from the stack
		let edge = stack.pop();
        let msg = "I'm checking the edge between " + edge.orig.id + " and " + edge.dest.id + ".";
		console.log(msg)
        await waitDelay(300);
		
		// For visualiation purposes
		clear_canvas(canvas);
		draw_mesh(mesh, canvas);
		draw_edge(edge.orig.pos, edge.dest.pos, canvas, color="red");
		//await waitDelay(100);

		
		// If the edge is not Delaunay, flip it and add the new edges to the stack
		if (!isDelaunay(edge, canvas, animated=true)) {
			console.log("This edge is not Delaunay.")
            await waitDelay(300);
			const wasflipped = flipEdge(edge);
			draw_mesh(mesh, canvas);

			// if was flipped, add the new edges to the end of the stack, but check if they are not already there
			if (wasflipped) {
				if (!stack.includes(edge.next)) {stack.push(edge.next);};
				if (!stack.includes(edge.oppo.next.next)) {stack.push(edge.oppo.next.next); };
				if (!stack.includes(edge.oppo.next)) {stack.push(edge.oppo.next); };	
				if (!stack.includes(edge.next.next)) {stack.push(edge.next.next); };			
			}
		}

		// iF the edge is Delaunay, remove it from the stack
		else {
			console.log("This edge is Delaunay.");
            await waitDelay(300);
		} 
	}
	console.log("Done!");
    clear_canvas(canvas);
    draw_mesh(mesh, canvas);
}

async function voronoi_animated(nodeData, canvas) {

	var mesh = create_mesh_nodes(nodeData);
	clear_canvas(canvas);
	draw_mesh(mesh, canvas);

    console.log("Click to generate Delaunay Triangulation");
	await waitForClick(canvas);

	var convexVertex = findConvex(mesh);
	var points2Triagulate = create_big_triangles(mesh, convexVertex);

	for (point of points2Triagulate) {
		create_new_triangle(point, mesh);
	}

    flip_algorithm(mesh, voronoi_canvas);
	clear_canvas(voronoi_canvas);
    draw_mesh(mesh, voronoi_canvas);

	console.log("Click to generate Voronoi Diagram");
	await waitForClick(canvas);

	let vertex = [];

	// For every triangle, draw the perpendicular bisector of each edge
	for (face of mesh.faces) {
		const [m1, b1] = perpendicular_bisector(face.incidentEdge);
		const [m2, b2] = perpendicular_bisector(face.incidentEdge.next);
		
		[x, y] = intersection_point(m1, b1, m2, b2, canvas);
		vertex.push([x, y]);
		await waitDelay(100);
	}

	//console.log(vertex);

	for (face of mesh.faces) {

		face_id = face.id;

		// define n1_face_id if face.incidentEdge.oppo is not null
		if (face.incidentEdge.oppo != null) {n1face_id = face.incidentEdge.oppo.incidentFace.id; draw_edge(vertex[face_id], vertex[n1face_id], canvas, color="red");}
		if (face.incidentEdge.next.oppo != null) {n2face_id = face.incidentEdge.next.oppo.incidentFace.id; draw_edge(vertex[face_id], vertex[n2face_id], canvas, color="red");}
		if (face.incidentEdge.next.next.oppo != null) {n3face_id = face.incidentEdge.next.next.oppo.incidentFace.id; draw_edge(vertex[face_id], vertex[n3face_id], canvas, color="red");}
		await waitDelay(100);
	}

	console.log("Done!");
}

function waitForClick(canvas) {
	return new Promise(resolve => {
		canvas.addEventListener('click', resolve);
	});
}

function waitDelay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}