import type { Node, Edge } from 'reactflow';

export type TemplateKey = 'todo' | 'cart' | 'blog';

export interface AnvayaBlueprint {
  version: string;
  nodes: Node[];
  edges: Edge[];
}

export interface TemplateMeta {
  key: TemplateKey;
  name: string;
  description: string;
}

export const TEMPLATE_LIST: TemplateMeta[] = [
  {
    key: 'todo',
    name: 'Todo API',
    description: 'GET / POST / DELETE /todos with auth + DB',
  },
  {
    key: 'cart',
    name: 'E-commerce cart',
    description: 'Products, cart, checkout flow',
  },
  {
    key: 'blog',
    name: 'Blog API',
    description: 'Posts list, create (auth), read',
  },
];

// Layout helpers — keep nodes spaced left→right.
const COL = (i: number) => 100 + i * 280;
const ROW = (i: number) => 100 + i * 200;

function edge(id: string, source: string, target: string): Edge {
  return { id, source, target, animated: true };
}

// ---------- TODO ----------
const todoBlueprint: AnvayaBlueprint = {
  version: '1.0.0',
  nodes: [
    // Row 1: GET /todos
    {
      id: 'route_get_todos',
      type: 'route',
      position: { x: COL(0), y: ROW(0) },
      data: { method: 'GET', path: '/todos', description: 'List todos' },
    },
    {
      id: 'auth_get_todos',
      type: 'auth',
      position: { x: COL(1), y: ROW(0) },
      data: { strategy: 'jwt', secret_env_var: 'JWT_SECRET' },
    },
    {
      id: 'db_todo_findall',
      type: 'database',
      position: { x: COL(2), y: ROW(0) },
      data: { provider: 'postgres', model: 'Todo', action: 'findAll' },
    },
    {
      id: 'response_get_todos',
      type: 'response',
      position: { x: COL(3), y: ROW(0) },
      data: { status_code: 200, body: 'todos' },
    },
    // Row 2: POST /todos
    {
      id: 'route_post_todos',
      type: 'route',
      position: { x: COL(0), y: ROW(1) },
      data: { method: 'POST', path: '/todos', description: 'Create todo' },
    },
    {
      id: 'auth_post_todos',
      type: 'auth',
      position: { x: COL(1), y: ROW(1) },
      data: { strategy: 'jwt', secret_env_var: 'JWT_SECRET' },
    },
    {
      id: 'db_todo_create',
      type: 'database',
      position: { x: COL(2), y: ROW(1) },
      data: { provider: 'postgres', model: 'Todo', action: 'create' },
    },
    {
      id: 'response_post_todos',
      type: 'response',
      position: { x: COL(3), y: ROW(1) },
      data: { status_code: 201, body: 'todo' },
    },
    // Row 3: DELETE /todos/:id
    {
      id: 'route_delete_todo',
      type: 'route',
      position: { x: COL(0), y: ROW(2) },
      data: { method: 'DELETE', path: '/todos/:id', description: 'Delete todo' },
    },
    {
      id: 'auth_delete_todo',
      type: 'auth',
      position: { x: COL(1), y: ROW(2) },
      data: { strategy: 'jwt', secret_env_var: 'JWT_SECRET' },
    },
    {
      id: 'db_todo_delete',
      type: 'database',
      position: { x: COL(2), y: ROW(2) },
      data: { provider: 'postgres', model: 'Todo', action: 'delete' },
    },
    {
      id: 'response_delete_todo',
      type: 'response',
      position: { x: COL(3), y: ROW(2) },
      data: { status_code: 204, body: 'null' },
    },
  ],
  edges: [
    edge('e_todo_get_1', 'route_get_todos', 'auth_get_todos'),
    edge('e_todo_get_2', 'auth_get_todos', 'db_todo_findall'),
    edge('e_todo_get_3', 'db_todo_findall', 'response_get_todos'),
    edge('e_todo_post_1', 'route_post_todos', 'auth_post_todos'),
    edge('e_todo_post_2', 'auth_post_todos', 'db_todo_create'),
    edge('e_todo_post_3', 'db_todo_create', 'response_post_todos'),
    edge('e_todo_del_1', 'route_delete_todo', 'auth_delete_todo'),
    edge('e_todo_del_2', 'auth_delete_todo', 'db_todo_delete'),
    edge('e_todo_del_3', 'db_todo_delete', 'response_delete_todo'),
  ],
};

// ---------- CART ----------
const cartBlueprint: AnvayaBlueprint = {
  version: '1.0.0',
  nodes: [
    // Row 1: GET /products
    {
      id: 'route_get_products',
      type: 'route',
      position: { x: COL(0), y: ROW(0) },
      data: { method: 'GET', path: '/products', description: 'List products' },
    },
    {
      id: 'db_product_findall',
      type: 'database',
      position: { x: COL(1), y: ROW(0) },
      data: { provider: 'postgres', model: 'Product', action: 'findAll' },
    },
    {
      id: 'response_get_products',
      type: 'response',
      position: { x: COL(2), y: ROW(0) },
      data: { status_code: 200, body: 'products' },
    },
    // Row 2: POST /cart
    {
      id: 'route_post_cart',
      type: 'route',
      position: { x: COL(0), y: ROW(1) },
      data: { method: 'POST', path: '/cart', description: 'Add to cart' },
    },
    {
      id: 'auth_post_cart',
      type: 'auth',
      position: { x: COL(1), y: ROW(1) },
      data: { strategy: 'jwt', secret_env_var: 'JWT_SECRET' },
    },
    {
      id: 'db_cart_create',
      type: 'database',
      position: { x: COL(2), y: ROW(1) },
      data: { provider: 'postgres', model: 'Cart', action: 'create' },
    },
    {
      id: 'response_post_cart',
      type: 'response',
      position: { x: COL(3), y: ROW(1) },
      data: { status_code: 201, body: 'cart' },
    },
    // Row 3: GET /cart/:id
    {
      id: 'route_get_cart',
      type: 'route',
      position: { x: COL(0), y: ROW(2) },
      data: { method: 'GET', path: '/cart/:id', description: 'Get cart' },
    },
    {
      id: 'auth_get_cart',
      type: 'auth',
      position: { x: COL(1), y: ROW(2) },
      data: { strategy: 'jwt', secret_env_var: 'JWT_SECRET' },
    },
    {
      id: 'db_cart_findone',
      type: 'database',
      position: { x: COL(2), y: ROW(2) },
      data: { provider: 'postgres', model: 'Cart', action: 'findOne' },
    },
    {
      id: 'response_get_cart',
      type: 'response',
      position: { x: COL(3), y: ROW(2) },
      data: { status_code: 200, body: 'cart' },
    },
    // Row 4: POST /checkout
    {
      id: 'route_post_checkout',
      type: 'route',
      position: { x: COL(0), y: ROW(3) },
      data: { method: 'POST', path: '/checkout', description: 'Checkout cart' },
    },
    {
      id: 'auth_post_checkout',
      type: 'auth',
      position: { x: COL(1), y: ROW(3) },
      data: { strategy: 'jwt', secret_env_var: 'JWT_SECRET' },
    },
    {
      id: 'payment_checkout',
      type: 'payment',
      position: { x: COL(2), y: ROW(3) },
      data: { mode: 'payment', product_id: 'prod_cart_total' },
    },
    {
      id: 'response_checkout',
      type: 'response',
      position: { x: COL(3), y: ROW(3) },
      data: { status_code: 200, body: 'checkout_session' },
    },
  ],
  edges: [
    edge('e_cart_products_1', 'route_get_products', 'db_product_findall'),
    edge('e_cart_products_2', 'db_product_findall', 'response_get_products'),
    edge('e_cart_post_1', 'route_post_cart', 'auth_post_cart'),
    edge('e_cart_post_2', 'auth_post_cart', 'db_cart_create'),
    edge('e_cart_post_3', 'db_cart_create', 'response_post_cart'),
    edge('e_cart_get_1', 'route_get_cart', 'auth_get_cart'),
    edge('e_cart_get_2', 'auth_get_cart', 'db_cart_findone'),
    edge('e_cart_get_3', 'db_cart_findone', 'response_get_cart'),
    edge('e_cart_checkout_1', 'route_post_checkout', 'auth_post_checkout'),
    edge('e_cart_checkout_2', 'auth_post_checkout', 'payment_checkout'),
    edge('e_cart_checkout_3', 'payment_checkout', 'response_checkout'),
  ],
};

// ---------- BLOG ----------
const blogBlueprint: AnvayaBlueprint = {
  version: '1.0.0',
  nodes: [
    // Row 1: GET /posts
    {
      id: 'route_get_posts',
      type: 'route',
      position: { x: COL(0), y: ROW(0) },
      data: { method: 'GET', path: '/posts', description: 'List posts' },
    },
    {
      id: 'db_post_findall',
      type: 'database',
      position: { x: COL(1), y: ROW(0) },
      data: { provider: 'postgres', model: 'Post', action: 'findAll' },
    },
    {
      id: 'response_get_posts',
      type: 'response',
      position: { x: COL(2), y: ROW(0) },
      data: { status_code: 200, body: 'posts' },
    },
    // Row 2: POST /posts (auth)
    {
      id: 'route_post_posts',
      type: 'route',
      position: { x: COL(0), y: ROW(1) },
      data: { method: 'POST', path: '/posts', description: 'Create post' },
    },
    {
      id: 'auth_post_posts',
      type: 'auth',
      position: { x: COL(1), y: ROW(1) },
      data: { strategy: 'jwt', secret_env_var: 'JWT_SECRET' },
    },
    {
      id: 'db_post_create',
      type: 'database',
      position: { x: COL(2), y: ROW(1) },
      data: { provider: 'postgres', model: 'Post', action: 'create' },
    },
    {
      id: 'response_post_posts',
      type: 'response',
      position: { x: COL(3), y: ROW(1) },
      data: { status_code: 201, body: 'post' },
    },
    // Row 3: GET /posts/:id
    {
      id: 'route_get_post',
      type: 'route',
      position: { x: COL(0), y: ROW(2) },
      data: { method: 'GET', path: '/posts/:id', description: 'Get post by id' },
    },
    {
      id: 'db_post_findone',
      type: 'database',
      position: { x: COL(1), y: ROW(2) },
      data: { provider: 'postgres', model: 'Post', action: 'findOne' },
    },
    {
      id: 'response_get_post',
      type: 'response',
      position: { x: COL(2), y: ROW(2) },
      data: { status_code: 200, body: 'post' },
    },
  ],
  edges: [
    edge('e_blog_get_1', 'route_get_posts', 'db_post_findall'),
    edge('e_blog_get_2', 'db_post_findall', 'response_get_posts'),
    edge('e_blog_post_1', 'route_post_posts', 'auth_post_posts'),
    edge('e_blog_post_2', 'auth_post_posts', 'db_post_create'),
    edge('e_blog_post_3', 'db_post_create', 'response_post_posts'),
    edge('e_blog_one_1', 'route_get_post', 'db_post_findone'),
    edge('e_blog_one_2', 'db_post_findone', 'response_get_post'),
  ],
};

export const CANVAS_TEMPLATES: Record<TemplateKey, AnvayaBlueprint> = {
  todo: todoBlueprint,
  cart: cartBlueprint,
  blog: blogBlueprint,
};
