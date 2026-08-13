import os
import json


def get_foreign_keys(tables):
    all_columns = []
    # schema_path = os.path.join(os.getcwd(), "results/schema.json")
    # with open(schema_path, "r") as f:
    #     schema = json.load(f)
    schema = tables
    for current_table in schema:
        current_columns = schema[current_table]["columns"].keys()
        for target_table in schema:
            if current_table != target_table:
                target_pk = schema[target_table]["pk"]
                if target_pk in current_columns and schema[current_table]["columns"][target_pk] == schema[target_table]["columns"][target_pk] and schema[current_table]["pk"] != target_pk:
                    schema[current_table]["fk"][target_pk]=target_table
    print(schema)
    # with open(schema_path, "w") as f:
    #     print("writing schema")
    #     json.dump(schema,f) 
    return schema


if __name__ == "__main__":
    get_foreign_keys()
