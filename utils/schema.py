import pandas as pd
from .columns import get_col_names
import json

def map_dtype(dtype):
    dtype = str(dtype)
    if "int" in dtype:
        return "INT"
    elif "float" in dtype:
        return "FLOAT"
    elif "datetime" in dtype:
        return "DATE"
    elif "bool" in dtype:
        return "BOOLEAN"
    else:
        return "VARCHAR"
    

table_name={}
schema_json_path = 'results/schema.json'
def schema(data,table_name):
    col_names = get_col_names(data)
    table_name={}
    table_name["columns"]={}
    table_name["fk"]={}
    has_pk = False
    for column in col_names:
        if ((data[column].nunique() == len(data)) and (data[column].isna().sum() == 0) and not has_pk):
            table_name["pk"] = column
            has_pk = True
        elif not has_pk:
            table_name["pk"] = None
        table_name["columns"][column]=map_dtype(str(data[column].dtype))
       
    # with open(schema_json_path,'w') as f:
    #     json.dump(table_dict,f)
    return table_name



