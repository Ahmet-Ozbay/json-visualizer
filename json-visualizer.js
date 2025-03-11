let tableDetails = {};
        const cy = cytoscape({
            container: document.getElementById('graph-container'),
            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': ele => {
                            if (ele.data('id').startsWith('auth_')) return '#FFCC80';
                            if (ele.data('id').startsWith('django_')) return '#80CBC4';
                            if (ele.data('id').startsWith('calculations')) return '#90CAF9';
                            return '#e1f5fe';
                        },
                        'border-color': '#03a9f4',
                        'border-width': 2,
                        'width': 180,
                        'height': 60,
                        'shape': 'rectangle',
                        'content': 'data(label)',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'font-size': '12px'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': '#9e9e9e',
                        'target-arrow-color': '#9e9e9e',
                        'target-arrow-shape': 'triangle'
                    }
                },
                {
                    selector: '.highlighted',
                    style: {
                        'background-color': '#ffeb3b',
                        'border-color': '#fbc02d',
                        'border-width': 3
                    }
                },
                {
                    selector: '.highlighted-edge',
                    style: {
                        'line-color': '#f57c00',
                        'target-arrow-color': '#f57c00',
                        'width': 3
                    }
                }
            ]
        });

        document.getElementById('file-input').addEventListener('change', function (event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const data = JSON.parse(e.target.result);
                    renderDatabaseSchema(data);
                } catch (error) {
                    alert('Error parsing the JSON file: ' + error.message);
                }
            };
            reader.readAsText(file);
        });

        function loadDefaultFile() {
            fetch('database_schema.json') // Adjust filename if needed
                .then(response => {
                    if (!response.ok) throw new Error('Failed to load default JSON');
                    return response.json();
                })
                .then(data => {
                    renderDatabaseSchema(data);
                    document.getElementById('file-name').textContent = "database_schema.json (Auto-loaded)";
                })
                .catch(error => console.error("Error loading default JSON:", error));
        }
        function renderDatabaseSchema(data) {
            cy.elements().remove();
            if (!data.tables) {
                alert("Invalid JSON: There is no 'tables' field.");
                return;
            }

            let tables = Object.entries(data.tables).map(([tableName, tableData]) => ({
                name: tableName,
                columns: tableData.columns || [],
                primary_keys: tableData.primary_keys || [],
                foreign_keys: tableData.foreign_keys || []
            }));

            tables.forEach(table => {
                cy.add({
                    group: 'nodes',
                    data: {
                        id: table.name,
                        label: table.name
                    }
                });
            });
            tables.forEach(table => {
                tableDetails[table.name] = {
                    columns: table.columns.map(col => col.name), // Extract only the column names
                    primary_keys: table.primary_keys,
                    foreign_keys: table.foreign_keys
                };
            });
            tables.forEach(table => {
                table.foreign_keys.forEach(fk => {
                    cy.add({
                        group: 'edges',
                        data: {
                            id: `${table.name}->${fk.referred_table}->${fk.constrained_columns.join('_')}`,
                            source: table.name,
                            target: fk.referred_table
                        }
                    });
                });
            });

            cy.layout({ name: 'dagre', rankDir: 'TB', nodeSep: 50, edgeSep: 10, rankSep: 100 }).run();
        }

        cy.on('tap', 'node', function (evt) {
            const node = evt.target;
            const details = tableDetails[node.data('label')];
            document.getElementById('details-title').textContent = node.data('label');
            document.getElementById('details-content').innerHTML = `
        <h3>Columns</h3>
        <ul>
            ${details.columns.map(col => `<li>${col}</li>`).join('')}
        </ul>
        <h3>Primary Keys</h3>
        <ul>
            ${details.primary_keys.map(pk => `<li>${pk}</li>`).join('')}
        </ul>
        <h3>Foreign Keys</h3>
        <ul>
            ${details.foreign_keys.map(fk => `<li>${fk.referred_table} (${fk.constrained_columns.join(', ')})</li>`).join('')}
        </ul>
    `;

            // Reset previous highlights
            cy.elements().removeClass('highlighted').removeClass('highlighted-edge');

            // Highlight the tapped node
            node.addClass('highlighted');

            // Highlight related nodes and edges
            const relatedEdges = node.connectedEdges();
            relatedEdges.addClass('highlighted-edge');

            const relatedNodes = relatedEdges.connectedNodes().filter(n => n !== node);
            relatedNodes.addClass('highlighted');

            // Isolate highlighted nodes and edges
            cy.elements().forEach(ele => {
                if (!ele.hasClass('highlighted') && !ele.hasClass('highlighted-edge')) {
                    ele.style('display', 'none');
                } else {
                    ele.style('display', 'element');
                }
            });

            // Run layout on visible nodes
            cy.layout({
                name: 'breadthfirst',
                directed: true,
                roots: `#${evt.target.id()}`, // Set the tapped node as the root
                spacingFactor: 1.5, // Adjust spacing
                eles: cy.nodes().filter(node => node.style('display') === 'element')
            }).run();

            cy.fit();
        });
        document.getElementById('graph-container').addEventListener('contextmenu', function (event) {
            event.preventDefault(); // Prevent the default context menu
            cy.nodes().forEach(node => node.style('display', 'element'));
            cy.edges().forEach(edge => edge.style('display', 'element'));
            cy.elements().removeClass('highlighted').removeClass('highlighted-edge');
            cy.fit(); // Refit the graph to the full view
        });
        document.getElementById('reset-filter').addEventListener('click', function () {
            cy.nodes().forEach(node => node.style('display', 'element'));
            cy.edges().forEach(edge => edge.style('display', 'element'));
            cy.elements().removeClass('highlighted').removeClass('highlighted-edge');
            cy.fit();
        });
        document.getElementById('apply-filter').addEventListener('click', function () {
            let query = document.getElementById('filter-input').value.toLowerCase();
            cy.nodes().forEach(node => node.style('display', node.data('id').includes(query) ? 'element' : 'none'));
            cy.edges().forEach(edge => edge.style('display', 'none'));
        });

        document.getElementById('reset-filter').addEventListener('click', function () {
            cy.nodes().forEach(node => node.style('display', 'element'));
            cy.edges().forEach(edge => edge.style('display', 'element'));
        });


        window.addEventListener('DOMContentLoaded', loadDefaultFile);

        document.getElementById('zoom-in').addEventListener('click', () => cy.zoom(cy.zoom() * 1.2));
        document.getElementById('zoom-out').addEventListener('click', () => cy.zoom(cy.zoom() * 0.8));
        document.getElementById('reset-view').addEventListener('click', () => cy.fit());
        const fileInput = document.getElementById('file-input');
        const fileButton = document.getElementById('custom-file-button');
        const fileNameDisplay = document.getElementById('file-name');

        fileButton.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', function (event) {
            const file = event.target.files[0];
            if (file) {
                fileNameDisplay.textContent = file.name;
                const reader = new FileReader();
                reader.onload = function (e) {
                    try {
                        const data = JSON.parse(e.target.result);
                        renderDatabaseSchema(data);
                    } catch (error) {
                        alert('Error parsing JSON file: ' + error.message);
                    }
                };
                reader.readAsText(file);
            } else {
                fileNameDisplay.textContent = "No file has been chosen.";
            }
        });