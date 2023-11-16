# Numerical Geometry: Assignment 2

## 🖱️ Task 1: Build a Mesh Object

For this task, the function `create_mesh` was implemented to get the data from the JSON file and build a **mesh** object with a doubly-connected edge list structure, following the instructions given.

## 📏 Task 2: Point Location in Triangle

To locate the triangle containing the point, it's chosen an arbitrary triangle in the mesh and for implementation purpose, the chosen one is in the border of the mesh to avoid having multiple initial paths. 

The implementation consist in getting an _outside_ edge and getting the midpoint of this edge the reference point to begin the algorithm. Then a line segment is drawn between this reference point and the point given by the user, in this case by clicking on the canvas.

If this segment intersect one of the other two edges of the triangle, it means that the desired point is not inside the current triangle, and the algorithm moves to the next triangle by getting the opposite half-edge of the intersection edge. It's known the entrance edge, so it is just necessary to look for the exit one and, if it does not exist, the triangle contains the point. This is implement in the `find_triangle_location` function.

## 🌐 Task 3: Segment Intersection with Triangulation

In this task, the strategy was to find the location of one of the points of the segment line to have a known starting triangle. Then, use the same strategy from the previous task to locate the location of the other point. As the previous algorithm is based on finding the edges of the triangulation that intersect the line connecting two points, the same strategy is used to save these intersections between the mesh and the segment line.

## 🔮 Extra tasks

There was created a more attractive interface to the right of the canvas to have a more friendly usability. Buttons were added to implement the extra funcionalities: Change Implementation and Clear Canvas.

Some basic visual improvements have also been implemented, such as changing colors, rounded nodes, segment colors. In addition, CSS has been embedded to change margins and alignments, making the program more visually pleasing.
