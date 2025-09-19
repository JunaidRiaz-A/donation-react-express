# Act-of-Sharing Platform

A full-stack platform for sharing acts of kindness, featuring user authentication, event management, contributions, messaging, and more.

---

## Project Structure

```
act-of-sharing-backend/   # Node.js/Express backend API
act-of-sharing-frontend/  # React/TypeScript frontend app
```

---

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite, React Router, Stripe, Mailgun
- **Backend:** Node.js, Express, MongoDB (Mongoose), PostgreSQL, Stripe, Mailgun
- **Other:** JWT Authentication, Swagger API Docs

---

## Getting Started

### Prerequisites

- Node.js (v14+ for frontend, v22.15.0 for backend)
- npm (v6+)
- MongoDB (local or cloud)
- PostgreSQL
- Stripe & Mailgun accounts (for payments and emails)

---

## Backend Setup

1. **Clone the repository:**

   ```sh
   git clone https://github.com/your-username/act-of-sharing-backend.git
   cd act-of-sharing-backend
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Configure environment variables:**

   - Copy `.env.example` to `.env` and fill in required values.

4. **Start the server:**
   ```sh
   npm run dev
   ```
   The backend runs at [http://localhost:5000](http://localhost:5000).

---

## Frontend Setup

1. **Clone the repository:**

   ```sh
   git clone https://github.com/your-username/act-of-sharing-frontend.git
   cd act-of-sharing-frontend
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Configure environment variables:**

   - Copy `.env.example` to `.env` and fill in required values.

4. **Start the development server:**
   ```sh
   npm run dev
   ```
   The frontend runs at [http://localhost:5173](http://localhost:5173).

---

## Build & Deployment

- **Frontend:**

  ```sh
  npm run build
  ```

  Deploy the contents of the `dist` folder.

- **Backend:**  
   Deploy using your preferred Node.js hosting (e.g., Vercel, Heroku, DigitalOcean).

---

## Features

- Secure JWT-based authentication
- Event and contribution management
- Stripe payment processing (charges, webhooks)
- Email notifications via Mailgun
- API documentation via Swagger (`/api-docs`)
- Modular and scalable codebase

---

## License

This project is licensed under the MIT License.

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## Contact

For questions or support, please contact the project maintainers.
