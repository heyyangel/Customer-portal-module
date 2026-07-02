# Shraddha Impex ERP - Frontend

This is the frontend application for the Shraddha Impex ERP and Customer Portal Module. It is built using React, Vite, and Tailwind CSS.

## Features

- **Dashboard**: High-level overview of orders, pending approvals, and system activity (KPI Stats).
- **Create Booking (Orders)**: Add products to a cart and submit new orders via the Temporary Reservation System which blocks stock. 
- **Bulk Upload**: Upload orders via CSV or Excel spreadsheet with client-side parsing and duplicate resolution for fast data entry.
- **Order History & Approvals**: View past orders, check statuses, view detailed financial summaries (OrderSummaryCard) and manage managerial approvals.
- **Inventory Dashboard**: Real-time mock inventory tracking with SKU search and Low Stock warnings.
- **System Reports**: Visual metrics on revenue, orders processed, and top-selling products.
- **Admin Settings**:
  - **User Management**: View live users from the database, assign roles, and manage activity status.
  - **Permission Matrix**: Visually assign granular permissions (e.g. "Approve Orders", "Manage Inventory") to different roles.

## Tech Stack

- **React 18** (UI Library)
- **Vite** (Build Tool)
- **Tailwind CSS** (Styling)
- **Zustand** (State Management)
- **React Router** (Navigation)
- **Lucide React** (Icons)
- **Axios** (API Requests)
- **Socket.io-client** (Real-time updates)
- **Framer Motion** (Animations)

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository and navigate to this directory.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Development Server

Start the frontend development server:
```bash
npm run dev
```

The application will typically run at `http://localhost:5173`. 
Make sure the backend is also running on `http://localhost:5000` for authentication and data fetching.

## Folder Structure

- `src/components/`: Reusable UI elements (Buttons, Cards, Modals, Navbar, Sidebar).
- `src/pages/`: Main route views (Dashboard, Admin, Inventory, Reports, Settings, Auth).
- `src/store/`: Zustand state stores (`userStore.js`, `adminStore.js`, `cartStore.js`).
- `src/services/`: API clients (`api.js`, `admin.js`, `auth.js`) connecting to the backend.
- `src/routes/`: React Router definitions (`index.jsx`).
- `src/assets/` & `public/`: Static files and images.

## Design Aesthetic
The application strictly follows a "Shadcn-inspired" aesthetic utilizing sleek white cards, slate text, subtle shadows, and a primary brand color (`#1a5b9e`).
