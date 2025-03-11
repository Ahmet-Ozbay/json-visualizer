# json-visualizer
This is a simple JavaScript app that can be used to visualize a json file that contains table and relation information of a database.

## Notes
For this to work, the input json file must be in a specific format. 
An example file is given: database_schema.json
This file contains the database schema of Open Quantum Materials Database, which can be accessed from the following link:
https://www.oqmd.org/

## Features
- When clicked on a node, it will be shown in an isolated view alongside with the nodes it has relations. Right clicking will return back to the original state.
- The columns, primary and foreign key of a table can be inspected in the details panel.
- Zoom in - out by using the mouse's scroll button
- Search for a table
- Name based coloring (see next headline)

## Name based coloring
In the very beginning of the file json-visualizer.js: 

                    style: {
                        'background-color': ele => {
                            if (ele.data('id').startsWith('auth_')) return '#FFCC80';
                            if (ele.data('id').startsWith('django_')) return '#80CBC4';
                            if (ele.data('id').startsWith('calculations')) return '#90CAF9';
                            return '#e1f5fe';
                        },

These lines gives colors to tables that start with "auth_", "django_", "calculations".
You can adjust these to suit your own needs.
