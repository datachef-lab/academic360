# academic360

Welcome to **academic360** – a Student Management App built as a **monorepo** using **Turborepo**. This project includes both the **backend** and **frontend** apps for managing student data, academic records, attendance, and more.

## Table of Contents
- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Installation](#installation)
  - [Running the Development Server](#running-the-development-server)
  - [Building the Apps](#building-the-apps)
  - [Adding Libraries](#adding-libraries)
- [Technologies](#technologies)
- [Contributing](#contributing)

## Overview

**academic360** is designed to simplify the management of student data. It includes a backend for API interactions and a frontend for a smooth user interface. The project leverages **Turborepo** to manage both backend and frontend in a monorepo setup.

### What's Inside?

This Turborepo includes the following apps and packages:

#### Apps and Packages
- **`backend`**: The backend API, responsible for handling student data, authentication, and business logic.
- **`frontend`**: The frontend application, built with React or Next.js, providing the user interface for interacting with the backend.
- **`@repo/ui`**: A shared React component library used across both the frontend and backend apps.
- **`@repo/eslint-config`**: ESLint configurations to enforce code style, including `eslint-config-next` and `eslint-config-prettier`.
- **`@repo/typescript-config`**: TypeScript configurations (`tsconfig.json`) used throughout the monorepo.

Each app/package is written in **TypeScript**.

#### Utilities
- **TypeScript**: Static type checking for better developer experience and fewer bugs.
- **ESLint**: For code linting and ensuring code quality.
- **Prettier**: To keep the code formatted consistently.

## Getting Started

### Installation

To get started with **academic360**, clone the repository and install the dependencies:

```bash
git clone https://github.com/datachef-lab/academic360.git
cd academic360
npm install
```
This will install all the necessary dependencies for both the backend and frontend applications.

### Running the Development Server

To run all apps in **development mode**, execute the following command:

```bash
npm run dev
```

This will start both the frontend and backend applications simultaneously, allowing you to work with them in real time.

#### Running a Specific App
If you want to run only the frontend or backend separately, you can use the --workspace flag like this:

```bash
npm run dev --workspace=frontend  # Runs the frontend app only
npm run dev --workspace=backend   # Runs the backend app only
```

### Building the Apps

To build both the frontend and backend apps for production, run the following:

```bash
npm run build
```

This will compile all apps into optimized production code.

#### Building a Specific App
If you only want to build the frontend or backend, use the --workspace flag as shown below:

```bash
npm run build --workspace=frontend  # Builds only the frontend app
npm run build --workspace=backend   # Builds only the backend app
```

### Adding Libraries
To add a new library to either the frontend or backend, you can install it using the following command:
```bash
npm install <library-name> --workspace=frontend  # Installs the library for the frontend
npm install <library-name> --workspace=backend   # Installs the library for the backend
```

## Remote Caching
Turborepo supports remote caching, which helps in speeding up builds by sharing cache artifacts across different machines. You can set up remote caching with Vercel.

## Technologies
- Backend: Node.js, Express, or similar backend framework.
- Frontend: React.js (or Next.js for SSR support).
- TypeScript: For static typing and better developer experience.
- ESLint: For linting to ensure clean and consistent code.
- Prettier: For automatic code formatting to maintain a consistent code style.
- Turborepo: A tool for managing monorepos, helping streamline development, and managing the frontend and backend in a single repository.

## Contributing
We welcome contributions to academic360! If you'd like to contribute, follow these steps:
- Fork the repository.
- Create a new branch for your changes: git checkout -b feature/your-feature.
- Make your changes and commit them: git commit -am 'Add new feature'.
- Push to your fork: git push origin feature/your-feature.
- Open a Pull Request with a detailed description of the changes.
- Please ensure that your code follows the project's coding standards and passes all tests before submitting a pull request.