#!/usr/bin/python

import sys
import json

if len(sys.argv) < 2:
    print "No input file supplied."
    sys.exit()

input_file = sys.argv[1]

EXPANDCOLUMNS = [ 'attributes' ]

columns = [ '' ]
rows = []

with open(input_file, "r") as f:
    data = json.load(f)

    for k in data:
        row = [ k ]

        for kk in data[k]:
            if kk in EXPANDCOLUMNS:
                for subk in data[k][kk]:
                    if not kk + "." + subk in columns:
                        columns.append(kk + "." + subk)
            elif not kk in columns:
                columns.append(kk)

        for c in columns:
            col = c
            subcol = ''
            if "." in c:
                (col,subcol) = c.split('.')

            if col == '':
                continue
            elif not col in data[k]:
                row.append('')
            elif col in EXPANDCOLUMNS:
                row.append(json.dumps(data[k][col][subcol]))
            else:
                row.append(json.dumps(data[k][col]))

        rows.append(row)

print '\t'.join(columns)
for row in rows:
    print '\t'.join(row)
