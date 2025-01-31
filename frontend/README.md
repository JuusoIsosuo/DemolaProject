# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Setup & Run the Project

### 1. Clone the Repository

Clone the repository and navigate to `frontend`:
```
git clone <repository-url>
cd DemolaLogistics/frontend
```

### 2. Install Dependencies

Make sure you have [Node.js](https://nodejs.org/en) installed. Then, run:
```
npm install
```

### 3. Add Your API Token as a Local Environment Variable

Make a new file called `.env.local` in the `frontend` directory. This file will be ignored by git. Then add your api token in the file:

```
VITE_API_TOKEN = yourapitoken
```

Vite requires environment variables to start with `VITE_`.

### 4. Start the Development Server

Run the following command to start the app locally:
```
npm run dev
```

This will start a local development server, and you can access the app at:
[http://localhost:5173](http://localhost:5173) (by default)
