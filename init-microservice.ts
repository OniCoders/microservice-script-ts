import fs from 'fs';
import path, { dirname } from 'path';
import { execSync } from 'child_process';
import prompts from 'prompts';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const toPascalCase = (str: string): string =>
  str.replace(/(^\w|-\w)/g, c => c.replace('-', '').toUpperCase());

const toKebabCase = (str: string): string =>
  str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

const toLower = (str: string): string => str.toLowerCase();

const promptUser = async (): Promise<{ modelName: string, includeGateway: boolean }> => {
  return await prompts([
    {
      type: 'text',
      name: 'modelName',
      message: 'Enter the model name (e.g., User, Product):',
      validate: val => val.length ? true : 'Required',
    },
    {
      type: 'toggle',
      name: 'includeGateway',
      message: 'Do you want to create an API Gateway?',
      initial: false,
      active: 'yes',
      inactive: 'no',
    }
  ]);
};

const createFile = (dir: string, fileName: string, content: string) => {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), content);
};

const generateGateway = () => {
  const gatewayDir = path.join(__dirname, 'services', 'gateway');
  const srcDir = path.join(gatewayDir, 'src');

  createFile(gatewayDir, '.env', 'PORT=3000');

  createFile(gatewayDir, 'Dockerfile', `
FROM oven/bun:1
WORKDIR /app
COPY . .
RUN bun install
CMD ["bun", "src/index.ts"]
  `);

  createFile(gatewayDir, 'tsconfig.json', JSON.stringify({
    compilerOptions: {
      target: "ES2022",
      module: "ES2022",
      moduleResolution: "node",
      esModuleInterop: true,
      strict: true,
      resolveJsonModule: true,
      outDir: "./dist",
      rootDir: "./src"
    },
    include: ["src"],
    exclude: ["dist", "node_modules"]
  }, null, 2));

  createFile(srcDir, 'index.ts', `
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

const services = [
  { path: '/users', target: 'http://localhost:3001' },
  { path: '/products', target: 'http://localhost:3002' }
];

services.forEach(({ path, target }) => {
  app.use(path, createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: reqPath => reqPath.replace(path, ''),
    logLevel: 'debug'
  }));
});

app.get('/health', (_, res) => {
  res.json({ status: 'gateway running' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('🚪 Gateway running at http://localhost:' + port));
  `);

  execSync(`cd ${gatewayDir} && bun init -y`, { stdio: 'inherit' });
  execSync(`cd ${gatewayDir} && bun add express dotenv http-proxy-middleware`, { stdio: 'inherit' });
  execSync(`cd ${gatewayDir} && bun add -d @types/express`, { stdio: 'inherit' });

  console.log('✅ Gateway created at /services/gateway');
};

const generateService = async () => {
  const { modelName, includeGateway } = await promptUser();

  const pascal = toPascalCase(modelName);
  const kebab = toKebabCase(modelName);
  const lower = toLower(modelName);

  const base = path.join(__dirname, 'services', kebab);
  const srcBase = path.join(base, 'src');
  const folders = ['controllers', 'services', 'repositories', 'routes', 'models', 'types', 'di', 'dtos'];

  folders.forEach(folder => fs.mkdirSync(path.join(srcBase, folder), { recursive: true }));

  createFile(path.join(srcBase, 'controllers'), `${pascal}.controller.ts`,
    `import { Request, Response } from 'express';\n\nexport class ${pascal}Controller {\n  constructor(private service: ${pascal}Service) {}\n  getAll(req: Request, res: Response) {\n    res.json([]);\n  }\n}`);

  createFile(path.join(srcBase, 'services'), `${pascal}.service.ts`,
    `import type { Create${pascal}Dto } from '../dtos/create-${lower}.dto';\nimport type { Update${pascal}Dto } from '../dtos/update-${lower}.dto';\nimport type { ${pascal} } from '../models/${pascal}.model';\n\nexport class ${pascal}Service {\n  constructor(private repository: ${pascal}Repository) {}\n}`);

  createFile(path.join(srcBase, 'repositories'), `${pascal}.repository.ts`,
    `export class ${pascal}Repository {\n  async findAll() {\n    return [];\n  }\n}`);

  createFile(path.join(srcBase, 'routes'), `${lower}.routes.ts`,
    `import { Router } from 'express';\nimport { ${lower}Controller } from '../di/${lower}.di';\n\nconst router = Router();\nrouter.get('/', (req, res) => ${lower}Controller.getAll(req, res));\nexport default router;`);

  createFile(path.join(srcBase, 'models'), `${pascal}.model.ts`,
    `export interface ${pascal} {\n  id: string;\n}`);

  createFile(path.join(srcBase, 'dtos'), `create-${lower}.dto.ts`,
    `export interface Create${pascal}Dto {\n  // define fields\n}`);

  createFile(path.join(srcBase, 'dtos'), `update-${lower}.dto.ts`,
    `export interface Update${pascal}Dto {\n  // define fields\n}`);

  createFile(path.join(srcBase, 'di'), `${lower}.di.ts`,
    `import { ${pascal}Repository } from '../repositories/${pascal}.repository';\nimport { ${pascal}Service } from '../services/${pascal}.service';\nimport { ${pascal}Controller } from '../controllers/${pascal}.controller';\n\nconst ${lower}Repository = new ${pascal}Repository();\nconst ${lower}Service = new ${pascal}Service(${lower}Repository);\nexport const ${lower}Controller = new ${pascal}Controller(${lower}Service);`);

  createFile(base, '.env', `MONGO_URI=mongodb://mongo-${lower}:27017/${lower}db`);

  createFile(path.join(srcBase), 'index.ts',
    `import express from 'express';\nimport { MongoClient } from "mongodb";\n\nconst app = express();\napp.use(express.json());\n\napp.get('/health', (req, res) => {\n  res.status(200).json({ status: 'ok' });\n});\n\nconst uri = process.env.MONGO_URI || "mongodb://localhost:27017/${lower}db";\nconst client = new MongoClient(uri);\n\nasync function run() {\n  try {\n    await client.connect();\n    console.log("✅ Connected to MongoDB");\n    app.listen(3000, () => console.log("🚀 Server ready on http://localhost:3000"));\n  } catch (err) {\n    console.error("❌ MongoDB error:", err);\n  }\n}\n\nrun();`);

  createFile(base, 'tsconfig.json', JSON.stringify({
    compilerOptions: {
      target: "ES2022",
      module: "ES2022",
      moduleResolution: "node",
      verbatimModuleSyntax: true,
      lib: ["ESNext"],
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      noEmit: true,
      resolveJsonModule: true,
      outDir: "./dist",
      rootDir: "./",
      types: ["node"]
    },
    include: ["src"],
    exclude: ["dist", "node_modules"]
  }, null, 2));

  execSync(`cd ${base} && bun init -y`, { stdio: 'inherit' });
  execSync(`cd ${base} && bun add express mongodb`, { stdio: 'inherit' });
  execSync(`cd ${base} && bun add -d @types/express @types/node`, { stdio: 'inherit' });

  console.log(`✅ Microservice "${modelName}" created at ${base}`);

  const gatewayPath = path.join(__dirname, 'services', 'gateway');
  if (includeGateway && !fs.existsSync(gatewayPath)) {
    generateGateway();
  } else if (includeGateway) {
    console.log('⚠️ Gateway already exists. Skipping gateway creation.');
  }
};

generateService();
