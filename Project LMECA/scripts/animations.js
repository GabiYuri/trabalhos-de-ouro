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
		if (!isDelaunay(edge, canvas, animated=true)) {
			await waitOneSecond();
			console.log("This edge is not Delaunay.")
			const wasflipped = flipEdge(edge);
			draw_mesh(mesh, canvas);

			// if was flipped, add the new edges to the end of the stack, but check if they are not already there
			if (wasflipped) {
				if (!stack.includes(edge.next)) {stack.push(edge.next); console.log("Add1")};
				if (!stack.includes(edge.oppo.next.next)) {stack.push(edge.oppo.next.next); console.log("Add2")}
				if (!stack.includes(edge.oppo.next)) {stack.push(edge.oppo.next); console.log("Add3")};	
				if (!stack.includes(edge.next.next)) {stack.push(edge.next.next); console.log("Add4")};			
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