import os
import pandas as pd
import columns as cl
import json
dir=os.path.join(os.getcwd(),"data")
files=os.listdir(dir)
table_dict={}
print("Writing the column names for the following tables:\n")

for i in files:
    file=os.path.join(dir,i)
    print(f"{i}\n")
    col_names=cl.get_col_names(file)
    print(col_names)
    table_dict[i]=col_names

final_schema=json.dumps(table_dict)
    
with open('schema_json.json',"w") as f:
    f.write(final_schema)
print("JSON file created!") 