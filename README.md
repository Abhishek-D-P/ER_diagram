# ER Diagram Generator

This project is a Flask-based web application that helps you turn uploaded CSV files into a semi-automated entity relationship (ER) diagram for a database schema.

An ER diagram visually represents tables as entities and shows how they relate to each other through keys and foreign-key relationships. This app makes that process faster by inferring schema details from uploaded data instead of requiring a developer to hand-build the model.

Demo of the generated ER diagram:
![ER diagram preview](er-diagram.svg)

## Features

### 1. Multi-file CSV upload
- Upload multiple CSV files in one go
- Each file is treated as a database table
- Uploaded schema is stored in memory and persisted to `results/schema.json`

### 2. Automatic schema inference
- Reads the uploaded data with pandas
- Infers column data types such as:
  - `INT` for integer columns
  - `FLOAT` for decimal values
  - `VARCHAR` for text values
  - `DATE` for date/datetime columns
- Stores inferred types per table column in the generated schema

### 3. Primary key detection
- Detects likely primary keys using unique, non-null column heuristics
- Supports overriding detected keys manually in the UI
- Users can set or unset a primary key directly from the rendered table card

### 4. Foreign key detection
- Detects likely foreign-key relationships by matching column names and table relationships
- Uses heuristics to infer references between tables
- Stores the relationships as part of the generated schema

### 5. ER diagram rendering
- Renders each uploaded table as a visual card in the browser
- Draws relationship connectors between tables to represent foreign-key links
- Uses a canvas overlay to show the schema visually as an ER diagram

### 6. User editing and refinement
- Rename columns inline from the UI
- Toggle or update primary keys manually
- Delete table cards from the schema view
- Adjust the generated schema after auto-detection to match the intended database design
- Drag and Move the tables as per need

### 7. Export and persistence
- Saves schema metadata to `results/schema.json`
- Exports the ER diagram as an SVG image
- Stores a browsable generated schema that can be reused or refined later

## Current implementation status

The project already supports the main workflow for generating a schema from uploaded CSV files and visualizing it as an ER diagram. It also includes several refinement features for correcting auto-detected table metadata.

The backlog includes additional enhancements such as:
- stronger primary-key ranking heuristics
- more robust foreign-key validation and matching
- manual connector editing
- SQL export generation
- more complete schema cleanup when tables or columns are deleted

## Tech stack
- Python
- Flask
- pandas
- JavaScript + HTML/CSS
- SVG/canvas-based diagram rendering

## Run the app

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Start the Flask app:
   ```bash
   python app.py
   ```

3. Open the app in your browser:
   ```text
   http://localhost:5000
   ```

4. Upload your CSV files to generate the ER diagram.

## Project structure
- `app.py` — Flask app and routes
- `utils/schema.py` — schema creation and type inference logic
- `utils/foreign_key.py` — foreign-key detection logic
- `templates/er_app/index.html` — UI for the ER diagram editor
- `static/er_app/` — frontend styling and JavaScript
- `results/schema.json` — generated schema output
- `data/` — sample CSV files

