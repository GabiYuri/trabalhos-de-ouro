// ===============================================
// =============== POINT LOCATION ================
// ===============================================


/**
 * @brief				Get the point location and find the triangle that contains it
 * @param node 			event by the client
 * @param mesh 			mesh structure as doubly-connected edge list
 * @returns 			triangle that contains the point
 */
function point_location(node, mesh) {
	// get point coordinates
	var point = node.pos;

	// get a reference edge and point
	var refFace = mesh.faces[0];
	A = refFace.incidentEdge.orig.pos;
	B = refFace.incidentEdge.dest.pos;
	var refPoint = [ A[0] + (1/3) * (B[0] - A[0]), A[1] + (1/3) * (B[1] - A[1]) ];
	
	// get segment between reference edge and point
	var refSegment = [refPoint, point];
	
	// search for the triangle that contains the point
	var inTriangle = find_triangle(refFace, refSegment);
	//label_triangle(containerFace.incidentEdge.orig.pos, containerFace.incidentEdge.dest.pos, containerFace.incidentEdge.next.dest.pos, containerFace.id, canvas, "black");

	return inTriangle;
}


/**
 * @brief				Given a starting triangle, search for the face that has only one intersection with the segment
 * @param startFace 	starting face
 * @param segment 		segment to find intersection with edges
 * @returns 			face with only one intersection with segment
 */
function find_triangle(startFace, segment) {
	var intersectionEdge = startFace.incidentEdge;
	while(true) {
		var nextEdge = intersectionEdge;
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
	var nextEdge = currentEdge.next;
	var intersection = check_intersection(segment[0], segment[1], nextEdge.orig.pos, nextEdge.dest.pos);
	if (intersection) {
		return nextEdge.oppo;
	} 
	else {
		var intersectionNext = check_intersection(segment[0], segment[1], nextEdge.next.orig.pos, nextEdge.next.dest.pos);
		if (intersectionNext) {
			return nextEdge.next.oppo;
		}
		else {
			return null;
		}
	}
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

    var overlap = check_overlap(A, B, C, D);

    // colinear lines without overlap
    if ((d1 == d2) && (d3 == d4) && (d4 == 0)){
        if (overlap == 0) return 0;
        // colinear lines without overlap
        return -1;
    } 
    // concurrent lines
    return ((d1 != d2) && (d3 != d4));
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