import random

# Number of data points
num_points = 10

# Generate random values for nodeData
node_data = [[random.random(), random.random(), 0] for _ in range(num_points)]

json_code = f"var nodeData = {repr(node_data)};"

# Save to a .js file
with open(f'{num_points}_random_data.json', 'w') as file:
    file.write(json_code)
