
const max_flowers = 15;
const min_flowers = 5;
const screen_safe_zone = 150;
const min_flower_size = 90;
const max_flower_size = 200;
const max_petal_length = max_flower_size * 1.5;
const golden_ratio_conjugation = 0.61803;
const golden_ratio = 1.61803398875;

let petal_color = null;
let center_color = null;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSL)

  let bg_value = get_random_int(70, 160)
  background(`hsl(${bg_value}, 70%, 90%)`);
  noLoop();
}

function init_colors() {
  let petal_value = Math.floor(get_random_int(160, 400) % 360);
  petal_color = color(`hsl(${petal_value}, 90%, 90%)`);
  let center_value = get_random_int(30, 60);
  center_color = color(`hsl(${center_value}, 80%, 80%)`);
}


function draw() {
  if (windowWidth < 150 || windowHeight < 300) {
    console.error(`Screen too small (${windowWidth}, ${windowHeight}), minimum set to (300,300)`)
    return;
  }

  var positions = poisson_disk_sampling(max_flower_size * get_random_float(2.3, 3.0), 30);
  for (let i = 0; i < positions.length; ++i) {
    const pos = positions[i];
    if (pos == null) {
      continue;
    }
    if (i % 3 == 0) {
      init_colors();
    }
    let flower_size = get_random_int(min_flower_size, max_flower_size);
    const radius = flower_size / 2;

    const petal_scale = max_flower_size / flower_size;
    let petal_length = flower_size * golden_ratio_conjugation * get_random_int(2, 4);
    let petal_width = petal_length / get_random_float(2.0, 5.0);

    let rotation_origin = 0;
    draw_petal_layer(radius, pos, petal_width, petal_length, rotation_origin)
    petal_length *= golden_ratio_conjugation;
    petal_width *= golden_ratio_conjugation;
    rotation_origin += PI / 2;
    draw_petal_layer(radius, pos, petal_width, petal_length, rotation_origin)

    petal_length *= golden_ratio_conjugation;
    petal_width *= golden_ratio_conjugation;
    rotation_origin += PI / 2;
    draw_petal_layer(radius, pos, petal_width, petal_length, rotation_origin)
    flower_size *= golden_ratio_conjugation;

    draw_flower_center(pos.x, pos.y, flower_size);

  }
}

function draw_petal_layer(radius, center_pos, petal_width, petal_length, rotation_origin) {

  const arc_len = 2 * PI * radius;
  let count = Math.floor(arc_len / petal_width) * 2;
  if (count > 25 + (get_random_int(0, 10))) {
    count /= 2;
  }
  const rotation_step = PI / count * 2;
  for (let j = 0; j < count; ++j) {
    let rotation_variance = get_random_float(-0.02, 0.02);
    const rotation = rotation_origin + (rotation_step * j);
    const pos_x = center_pos.x + Math.cos(rotation - PI / 2) * radius * 0.9;
    const pos_y = center_pos.y + Math.sin(rotation - PI / 2) * radius * 0.9;
    draw_ellipse_petal(pos_x, pos_y, petal_width, petal_length, rotation + rotation_variance)
  }
}

function draw_flower_center(x, y, size) {
  push();
  fill(center_color)
  circle(x, y, size);
  pop();
}

function draw_ellipse_petal(x, y, w, l, rotation) {
  push();
  fill(petal_color)
  translate(x, y);
  rotate(rotation);
  ellipse(0, 0, w, l);
  pop();
}

function get_random_screen_position() {
  return { x: get_random_int(screen_safe_zone, windowWidth - screen_safe_zone), y: get_random_int(screen_safe_zone, windowHeight - screen_safe_zone) };
}

function get_random_int(min, max) {
  return Math.floor(min + Math.random() * (max - min));
}

function get_random_float(min, max) {
  return min + Math.random() * (max - min);
}

function poisson_disk_sampling(radius, sample_limit) {
  const N = 2; // dimension
  const cell_size = Math.floor(radius / Math.sqrt(N));

  const width_cells = ceil(windowWidth / cell_size) + 1;
  const height_cells = ceil(windowHeight / cell_size) + 1;
  const initial_point = get_random_screen_position();

  // Init grid
  let grid = [width_cells];
  for (let w = 0; w < width_cells; ++w) {
    grid[w] = [height_cells]
    for (let h = 0; h < height_cells; ++h) {
      grid[w][h] = null
    }
  }

  let result_points = [];
  let active_points = [];

  insert_point(grid, initial_point, cell_size);
  result_points.push(initial_point);
  active_points.push(initial_point);

  // Iteration
  while (active_points.length > 0) {
    const random_idx = get_random_int(0, active_points.length - 1);
    const point = active_points[random_idx];
    let found = false;
    for (let i = 0; i < sample_limit; ++i) {
      const theta = get_random_float(0, 2 * PI);
      const new_radius = get_random_float(radius, 2 * radius);
      let new_point = { x: point.x + new_radius * Math.cos(theta), y: point.y + new_radius * Math.sin(theta) };

      let valid_point = is_valid_point(grid, cell_size, width_cells, height_cells, new_point, radius);
      if (valid_point) {
        result_points.push(new_point);
        insert_point(grid, new_point, cell_size);
        active_points.push(new_point);
        found = true;
        break;
      }
    }
    if (!found) {
      active_points.splice(random_idx, 1);
    }
  }
  return result_points;
}

function insert_point(grid, point, cell_size) {
  let x = Math.floor(point.x / cell_size);
  let y = Math.floor(point.y / cell_size);
  grid[x][y] = point;
}

function is_valid_point(grid, cell_size, grid_width, grid_height, point, radius) {
  if (point.x < 0 || point.x >= windowWidth || point.y < 0 || point.y >= windowHeight) {
    return false;
  }

  let x_index = Math.floor(point.x / cell_size);
  let y_index = Math.floor(point.y / cell_size);

  let w0 = Math.max(x_index - 1, 0);
  let w1 = Math.min(x_index + 1, grid_width - 1);
  let h0 = Math.max(y_index - 1, 0);
  let h1 = Math.min(y_index + 1, grid_height - 1);

  for (let w = w0; w <= w1; w++) {
    for (let h = h0; h <= h1; h++) {
      if (grid[w][h] != null) {
        if (dist(grid[w][h].x, grid[w][h].y, point.x, point.y) < radius)
          return false;
      }
    }
  }
  return true;
}