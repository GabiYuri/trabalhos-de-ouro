# Numerical Geometry: Assignment 1

## 📌 Introduction

This assignment focuses on implementing a simple intersection algorithm between two segments and visualizing a provided mesh using JavaScript and HTML canvas.

## 📋 Task Overview

### Part 1: Segment Intersection Algorithm

1. **Detecting User Clicks for Segment Creation**: Implement logic to detect user clicks for creating line segments and display them on a canvas.
   
2. **Computing Segment Intersection**: Implement the algorithm to compute the intersection of the segments and display it if it exists.

### Part 2: Mesh Visualization

3. **Displaying Provided Mesh**: Load and display the provided mesh from a JSON file on a canvas.

4. **Triangle Detection**: Implement the logic to determine in which triangle a point (corresponding to a mouse click) is located.

## 🖱️ Task 1: Detecting User Clicks for Segment Creation

For this task, we implemented an `EventListener` to take the coordinates of the points clicked by the user. For each point clicked, the `nodes` list is updated. For every two points clicked, an edge is drawn between them. The maximum number of points allowed is four and if a fifth point is attempted, the canvas will be reset.

You can also reset the canvas at any time by pressing the 'Clear Canvas' button.

## 📏 Task 2: Computing Segment Intersection

Moving forward into finding the intersection between the nodes, the code is implemented to look for the intersection when two segments are created - when there are 4 coordinates stored in `nodes`. We use Rotational Directions to check whether the two segments created intersect. A brief explanation of the algorithm would be:

1. Representing Line Segments: the visual representation is made using the user clicks saved in the `nodes` list and the `draw_point` and `draw_edge` functions (Taks 1).

2. Computing the Orientation: the determinant (or cross-product) between the vectors formed by each endpoint of one line segment and the endpoints of the other line segment is computed. The function `get_orientation` performs this task.

3. Sign-Analysis: this step is carried out in the `check_intersection` function. Based on the sign of the determinants, the following relationship can be established: 
- if the determinant is positive, the three points are ordered in one direction; 
- if the determinant is negative, the three points are ordered in the opposite direction; 
- if the determinant is zero, the three points are collinear.

4. Compute intersections: depending on whether there are intersections or not, the program calculates them using the fundamental equations of the lines. This approach was chosen because it is the most immediate. This last step is implemented in the `find_intersection` function.

## 🌐 Task 3: Displaying Provided Mesh

To display the mesh provided, the information regarding the nodes, coordinates and connections is extracted from the json file. The `draw_mesh` function then uses the `draw_nodes` and `draw_points` functions to display the mesh defined in the file. 

## 🚩 Task 4: Triangle Detection

To detect where a user has clicked, we use an `EventListener` that captures the position of the click. We then check which triangle the point is in. To do this, we check the orientation of the three triangles formed from the new edges created between the point created and the vertices of the triangle. Then, the `get_orientation` function is used again, within the `triangle_interior` function, which checks whether a point is inside any triangle. Next, the `find_tri_in_mesh` function searches within the triangles of the mesh to find the correct one, and additionally fills the triangle with a color using the `fill_triangle` function.

## 🔮 Extra tasks

The bonus tasks completed were:

1. Display the node/triangle numbers
2. Adding nodes to the mesh: it is currently possible to add nodes inside triangles. Three edges are drawn connecting the new node to the edges of the triangles, thus creating 3 new triangles.
3. Degenerated cases where the intersection of two line segments is a line segment has also been implemented via a hard-coded test case.

We also created a more attractive interface to the left of the canvas to explain the program's possibilities to the user. Buttons were added to implement the extra functionalities. A specific button (Change Implementation) allows you to switch between the intersection of segments and the mesh. Some basic visual improvements have also been implemented, such as changing colors, rounded nodes, segment colors. In addition, CSS has been embedded to change margins and alignments, making the program more visually pleasing.
