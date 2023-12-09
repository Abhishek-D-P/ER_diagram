import json
x = {
  "name": "John",
  "age": 30,
  "city": "New York"
}

# convert into JSON:
y = json.dumps(x)
print(y)

with open('test.json','w') as f:
    f.write(y)