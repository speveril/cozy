#!/usr/bin/python

import sys
import json
import re

if len(sys.argv) < 2:
    print "No input file supplied."
    sys.exit()

input_file = sys.argv[1]

data = {}

with open(input_file, 'r') as f:
    def processline(ln):
        return ln.rstrip().split("\t")

    columns = processline(f.readline())
    columns.pop(0)

    for line in f:
        row = processline(line)
        k = row.pop(0)
        data[k] = {}
        for idx,v in enumerate(row):
            if v == '':
                continue
            elif re.match('^\d+$', v):
                v = int(v)

            if '.' in columns[idx]:
                (col,subcol) = columns[idx].split(".")
                if not col in data[k]:
                    data[k][col] = {}
                data[k][col][subcol] = v
            elif v == 'TRUE':
                data[k][columns[idx]] = True
            elif v == 'FALSE':
                data[k][columns[idx]] = False
            elif '"' in str(v) or '[' in str(v) or '{' in str(v):
                data[k][columns[idx]] = json.loads(v)
            else:
                data[k][columns[idx]] = v

print json.dumps(data, indent=4, separators=(',',':'))
