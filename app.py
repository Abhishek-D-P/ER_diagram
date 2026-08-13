from flask import Flask,request,render_template,redirect,url_for, jsonify
from utils.schema import schema
from utils.foreign_key import get_foreign_keys
import pandas as pd
import os
import json

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

if not os.path.exists('results'):
    os.makedirs('results')

tables = {}
error = ""
@app.route("/")
def home():
    return render_template("er_app/index.html",tables = tables,error = error)

@app.route("/upload",methods = ["POST"])
def upload():
    try:
        global tables
        global error
        files = request.files.getlist("files")
        for file in files:
            if not file.filename.endswith(".csv"):
                raise ValueError("Please upload a CSV File!")
            filename = file.filename.split(".")[0]
            table = pd.read_csv(file)
            tables[filename] = schema(table,filename)
        error = ""
        tables = get_foreign_keys(tables)
        with open('results/schema.json',"w") as f:
            json.dump(tables , f)
        return redirect("/")
    except ValueError as e:
        error=str(e)
        return redirect("/")


@app.route("/set-pk",methods=["post"])
def set_pk():
    global tables
    data = request.get_json()
    table_name = data['table']
    pk_column = data["pk"]
    print(pk_column)
    if table_name in tables:
        if tables[table_name]["pk"] == pk_column:
            tables[table_name]["pk"] = None
        else:
            tables[table_name]["pk"] = pk_column
    with open("results/schema.json","w") as f:
        json.dump(tables,f)
    return jsonify({"status":"ok"})

@app.route("/rename-column",methods=["post"])
def rename_column():
    global tables
    data = request.get_json()
    table_name = data["table"]
    old_name = data["old_name"]
    new_name = data["new_name"]
    if table_name in tables and old_name in tables[table_name]["columns"]:
        columns = tables[table_name]["columns"]
        tables[table_name]["columns"] = {
            (new_name if k == old_name else k): v for k, v in columns.items()
        }
        if tables[table_name].get("pk") == old_name:
            tables[table_name]["pk"] = new_name
        fk = tables[table_name].get("fk", {})
        if old_name in fk:
            fk[new_name] = fk.pop(old_name)
        with open("results/schema.json","w") as f:
            json.dump(tables,f)
    return jsonify({"status":"ok"})

@app.route("/reset",methods = ["get"])
def reset():
    global tables
    tables = {}
    with open("results/schema.json","w") as f:
        json.dump(tables,f)
    return jsonify({"status":"ok"})


@app.route("/delete-card",methods = ["post"])
def delete_card():
    global tables
    data = request.get_json()
    table_to_delete = data["tableToDelete"]
    tables.pop(table_to_delete)
    return jsonify({"status":"ok"})

if __name__ == "__main__":
    
    app.run(debug=True)
