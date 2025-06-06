# 🛠️ Microservice Generator

This script automates the creation of a **modular, Docker-ready microservice** using **Bun**, **Express**, **TypeScript**, and **MongoDB**.

---

## 🚀 Features

- 📁 Clean folder structure with separation of concerns
- 🔁 Hot-reload enabled via `bun --watch`
- 🧪 Includes DI, DTOs, and MongoDB connection stub
- 🐳 Dockerfile and `.env` preconfigured
- 📦 Automatically installs dependencies

---

## ✅ Requirements

### 1. Install [Bun](https://bun.sh)

```bash
curl -fsSL https://bun.sh/install | bash
```

Check if installed:

```bash
bun --version
```

---

### 2. Create a base folder (if you don’t have one)

```bash
mkdir microservice-generator && cd microservice-generator
bun init -y
```

---

### 3. Install the required dependency

```bash
bun add prompts
```

---
### 4. Install TypeScript types for Express and Node

```bash
bun add -d @types/express @types/node @types/prompts
```

### 4. Enable ESM in your `package.json`

```json
{
  "type": "module"
}
```

---

### 5. (Optional) Add a basic `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "resolveJsonModule": true
  }
}
```

---

## 🚀 Run the script

## 📦 Usage

### 1. Run the script

```bash
bun run init-microservice.ts
```

### 2. Enter the model name when prompted

Example:

```bash
Enter the model name (e.g., User, Product): OrderItem
```

This will generate a microservice at:

```
services/order-item/
```

---

## 🧱 Generated Structure

```
services/order-item/
├── controllers/
│   └── OrderItem.controller.ts
├── services/
│   └── OrderItem.service.ts
├── repositories/
│   └── OrderItem.repository.ts
├── routes/
│   └── orderitem.routes.ts
├── models/
│   └── OrderItem.model.ts
├── dtos/
│   ├── create-orderitem.dto.ts
│   └── update-orderitem.dto.ts
├── types/
├── di/
│   └── orderitem.di.ts
├── src/
│   └── index.ts
├── .env
├── Dockerfile
├── tsconfig.json
└── README.md
```

## 📂 Folder Structure


### 📂 controllers/

**Responsibility:** Handle HTTP requests and responses.

- Entry point for routes
- Calls the corresponding service methods
- Does not contain business logic

---

### 📂 services/

**Responsibility:** Business logic layer.

- Contains core logic of the application
- Orchestrates repository and DTO usage
- Stateless and testable

---

### 📂 repositories/

**Responsibility:** Data access abstraction.

- Direct interaction with the database (e.g., MongoDB)
- Provides CRUD and query methods

---

### 📂 routes/

**Responsibility:** Express route definitions.

- Maps endpoints to controller methods
- Uses dependencies from the `di` folder

---

### 📂 models/

**Responsibility:** Domain models or data interfaces.

- Defines the shape of database entities
- Shared across services and repositories

---

### 📂 dtos/

**Responsibility:** Data Transfer Objects.

- Separates transport layer data from domain models
- Includes input (create) and output (update) schemas

---

### 📂 types/

**Responsibility:** Shared types and definitions.

- For common utilities, enums, helper types, etc.
- Example: API responses, error shapes

---

### 📂 di/

**Responsibility:** Manual dependency injection.

- Instantiates classes and connects them
- Injects repository → service → controller
- Used to decouple construction logic

---

### 📂 src/

**Responsibility:** Entry point (`index.ts`).

- Bootstraps the Express server
- Sets up middleware and MongoDB
- Mounts routes

---

## 🧪 Endpoints

- `GET /orderitem` — stub route
- `GET /health` — health check endpoint

---

## 🧰 Script Steps (under the hood)

1. 🧑 Prompt user for model name
2. ✨ Converts to:
   - PascalCase (e.g. `OrderItem`)
   - kebab-case (`order-item`)
   - lowercase (`orderitem`)
3. 🏗️ Creates folders:
   - `controllers`, `services`, `repositories`, `routes`, `models`, `dtos`, `types`, `di`, `src`
4. 🧬 Generates template files using the model name
5. 🐳 Adds `Dockerfile`, `.env`, `README.md`, `tsconfig.json`
6. 🧰 Runs:
   ```bash
   bun init -y
   bun add express mongodb
   bun add -d @types/express @types/node
   ```
7. ✅ Done!

---

## 🧪 Development Tips

- Use `docker-compose` to run with MongoDB
- Modify `src/index.ts` to expand routes
- Extend `services/` and `repositories/` to add real logic

---

## 🧠 Notes

- MongoDB connection string is in `.env`:
  ```
  MONGO_URI=mongodb://mongo-orderitem:27017/orderitemdb
  ```
- TypeScript config:
  - ESM with `verbatimModuleSyntax`
  - Includes strict typing and modern module resolution

---

## 🤝 Contributions

Feel free to fork and improve the script for your stack or add enhancements such as:
- Test suite integration
- GraphQL support
- Redis or RabbitMQ DI container setup

---

## 🧙 Author

  Automated by [juanpredev](juanpre.dev)
