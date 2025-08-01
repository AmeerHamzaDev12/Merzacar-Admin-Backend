# 🚗 Merzacar Admin Backend

Merzacar Admin Backend is a powerful Node.js + Express backend for managing car listings, including image uploads, features, attachments, pagination, and secure authentication. It is designed to support a car dealership admin panel with seamless integration for a frontend client.

---

## 🚀 Features

- JWT-based Authentication (Register/Login)
- Cloudinary integration for image & file uploads
- Car listing with:
  - Gallery Images
  - Attachments (PDFs, docs, etc.)
  - Features & Safety features
- Pagination & Sorting
- Secure Error Handling & Logging (Winston)
- Prisma ORM with PostgreSQL or MySQL
- Multer file handling middleware

---

## 🧰 Tech Stack

| Layer          | Technology                  |
|----------------|-----------------------------|
| Runtime        | Node.js                     |
| Framework      | Express.js                  |
| ORM            | Prisma                      |
| Database       | PostgreSQL / MySQL          |
| Authentication| JWT, bcryptjs               |
| File Uploads   | Multer + Cloudinary         |
| Logging        | Winston                     |
| Environment    | dotenv                      |

---

## 📦 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/AmeerHamzaDev12/Merzacar-Admin-Backend.git
cd Merzacar-Admin-Backend
