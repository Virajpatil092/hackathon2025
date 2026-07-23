# Green Financing Service

This project is a FastAPI application that provides a service for managing green financing products. It includes endpoints for creating, reading, updating, and deleting products related to green financing.

## Project Structure

```
green-financing-service
├── app
│   ├── main.py                # Entry point of the FastAPI application
│   ├── api                    # API related files
│   │   ├── deps.py            # Dependency functions for API routes
│   │   └── v1                 # Version 1 of the API
│   │       ├── __init__.py    # Initializes the v1 API package
│   │       ├── routes          # API route definitions
│   │       │   ├── __init__.py # Initializes the routes package
│   │       │   └── products.py # Endpoints for managing products
│   │       └── schemas         # Pydantic models for data validation
│   │           └── product.py  # Schema definitions for product data
│   ├── core                   # Core application settings
│   │   ├── config.py          # Configuration settings
│   │   └── security.py        # Security-related functions
│   ├── models                  # SQLAlchemy models
│   │   └── product.py         # Product entity model
│   ├── crud                    # CRUD operations
│   │   └── product.py         # Functions for product database interactions
│   ├── services                # Business logic services
│   │   └── financing.py        # Financing-related business logic
│   └── db                     # Database management
│       ├── base.py            # Base class for SQLAlchemy models
│       └── session.py         # Database session management
├── tests                       # Unit tests
│   └── test_products.py       # Tests for product-related API endpoints
├── alembic                    # Database migrations
│   ├── env.py                 # Migration environment setup
│   └── versions               # Migration scripts
├── alembic.ini                # Alembic configuration file
├── pyproject.toml             # Project metadata and dependencies
├── requirements.txt           # Required Python packages
├── Dockerfile                 # Docker image build instructions
├── .env.example               # Example environment variables
├── .gitignore                 # Git ignore file
└── README.md                  # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd green-financing-service
   ```

2. **Create a virtual environment:**
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install dependencies:**
   ```
   pip install -r requirements.txt
   ```

4. **Set up the database:**
   - Configure your database connection in the `.env` file.
   - Run migrations using Alembic:
     ```
     alembic upgrade head
     ```

5. **Run the application:**
   ```
   uvicorn app.main:app --reload
   ```

## Usage

- The API is accessible at `http://localhost:8000/api/v1/products`.
- Use tools like Postman or curl to interact with the API endpoints.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.