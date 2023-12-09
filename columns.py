import pandas as pd

def get_col_names(path):
    
    data=pd.read_csv(path)
    col=data.columns
    col_names=[]
    for i in col:
        col_names.append(i)
    return (col_names)

