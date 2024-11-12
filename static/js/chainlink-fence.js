// Chainlink fence calculator functionality
let chainLinkMaterials = null;
let financials = null;
let customRowCount = 0;

console.log('Script starting');

const urlParams = new URLSearchParams(window.location.search);

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Script starting');

    // Add logging to debug URL parameters
    console.log('URL Parameters:', Object.fromEntries(urlParams.entries()));

    // Elements that need initialization
    const elements = {
        'totalLinearFeet': 'totalFeet',
        'totalCornerPosts': 'cornerPosts',
        'totalEndPosts': 'endPosts',
        'totalLinePosts': 'linePosts',
        'totalGates': 'totalGates',
        'height': 'height'
    };

    // Set initial values from URL parameters with fallbacks
    Object.entries(elements).forEach(([elementId, paramName]) => {
        const element = document.getElementById(elementId);
        const paramValue = urlParams.get(paramName);
        if (element && paramValue) {
            console.log(`Setting ${elementId} to ${paramValue}`);
            element.value = paramValue;
        } else {
            console.log(`Element ${elementId} or param ${paramName} not found`);
        }
    });

    // Set initial checkbox states AFTER parameter loading
    document.getElementById('materialsTaxable').checked = false;
    document.getElementById('laborTaxable').checked = false;

    // Add event listener for the main materials tax checkbox
    document.getElementById('materialsTaxable')?.addEventListener('change', function(e) {
        const isChecked = e.target.checked;
        document.querySelectorAll('.tax-checkbox').forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        calculateTotals();
    });

    try {
        // Load materials and financials data
        const [materialsResponse, financialsResponse] = await Promise.all([
            fetch('/materials/chainLinkMaterials.json'),
            fetch('/materials/financials.json')
        ]);

        chainLinkMaterials = await materialsResponse.json();
        financials = await financialsResponse.json();

        // Set default rates from financials
        const selectedHeight = document.getElementById('height').value;
        console.log('Selected height:', selectedHeight);

        if (financials.laborRates && financials.laborRates.chain_link) {
            const laborRate = financials.laborRates.chain_link[selectedHeight] ||
                             financials.laborRates.chain_link['6'] || 7.5;
            console.log('Setting labor rate to:', laborRate);
            document.getElementById('laborRate').value = laborRate;
        } else {
            console.warn('No chain_link labor rates found in financials:', financials.laborRates);
        }

        document.getElementById('taxRate').value =
            (financials.overheadRates.taxRate * 100).toFixed(1);
        document.getElementById('marginPercent').value =
            ((1 - financials.overheadRates.profitMargin) * 100).toFixed(1);

        // Setup materials and calculations
        await populateMaterialsTable();
        calculateInitialQuantities();
        calculateTotals();

        // Initialize the drawing preview
        const drawingDataParam = urlParams.get('drawingData');
        if (drawingDataParam) {
            console.log('Drawing data found in URL');
            loadDrawingPreview();
        }

    } catch (error) {
        console.error('Error during initialization:', error);
    }
});
document.getElementById('addCustomRow')?.addEventListener('click', addCustomRow);
// Add this function to filter materials by fence height
function filterMaterialsByHeight(materialType, height) {
    if (!chainLinkMaterials[materialType]) return [];

    // Materials that need height filtering
    const heightFilteredMaterials = ['mesh', 'linePosts'];

    if (heightFilteredMaterials.includes(materialType)) {
        return chainLinkMaterials[materialType].filter(item =>
            item.fenceHeight === 0 || item.fenceHeight === height
        );
    }

    return chainLinkMaterials[materialType];
}

function populateMaterialsTable() {
    if (!chainLinkMaterials) return;

    const height = parseInt(document.getElementById('height').value) || 6;

const materials = [
    'concrete',
    'hogTies',
    'linePosts',
    'terminalPosts',
    'mesh',
    'tensionBars',
    'tensionBands', // Add this
    'braceBands',   // Add this
    'tensionWire',
    'topRail',
    'linePostCaps',
    'terminalCaps',
    'topRailEnds',
    'trussBars',
    'barbWire',
];
    materials.forEach(materialType => {
        const select = document.getElementById(`${materialType}Select`);
        if (select) {
            // Clear existing options
            select.innerHTML = '';

            // Get materials, filtered by height if necessary
            const materialOptions = filterMaterialsByHeight(materialType, height);

            // Add options based on material data
            materialOptions.forEach(item => {
                if (item.name) {  // Only add items with names
                    const option = document.createElement('option');
                    option.value = item.sku;
                    option.textContent = item.name;
                    option.dataset.price = item.price;

                    // Add specific data attributes
                    if (item.fenceHeight) option.dataset.fenceHeight = item.fenceHeight;
                    if (item.width) option.dataset.width = item.width;
                    if (item.length) option.dataset.length = item.length;

                    select.appendChild(option);
                }
            });

            // Add change event listener
            select.addEventListener('change', function() {
                updateMaterialPrice(materialType);
                calculateTotals();
            });

            // Update initial price display
            updateMaterialPrice(materialType);
        }
    });
}

function updateMaterialPrice(materialType) {
    const select = document.getElementById(`${materialType}Select`);
    const priceCell = document.getElementById(`${materialType}Price`);

    if (select && priceCell && select.options.length > 0) {
        const selectedOption = select.options[select.selectedIndex];
        const price = parseFloat(selectedOption.dataset.price);
        priceCell.textContent = `$${price.toFixed(2)}`;
    }
}

function calculateInitialQuantities() {
    const totalFeet = parseFloat(document.getElementById('totalLinearFeet').value) || 0;
    const cornerPosts = parseInt(document.getElementById('totalCornerPosts').value) || 0;
    const endPosts = parseInt(document.getElementById('totalEndPosts').value) || 0;
    const linePosts = parseInt(document.getElementById('totalLinePosts').value) || 0;
    const totalGates = parseInt(document.getElementById('totalGates').value) || 0;

    const totalTerminalPosts = cornerPosts + endPosts;
    const totalPosts = totalTerminalPosts + linePosts;

    // Get roll/piece lengths from selected materials
    const meshSelect = document.getElementById('meshSelect');
    const topRailSelect = document.getElementById('topRailSelect');
    const tensionWireSelect = document.getElementById('tensionWireSelect');

    const meshLength = meshSelect ?
        parseFloat(meshSelect.options[meshSelect.selectedIndex].dataset.length) || 50 : 50;
    const topRailLength = topRailSelect ?
        parseFloat(topRailSelect.options[topRailSelect.selectedIndex].dataset.length) || 21 : 21;
    const tensionWireLength = tensionWireSelect ?
        parseFloat(tensionWireSelect.options[tensionWireSelect.selectedIndex].dataset.length) || 100 : 100;

    // Calculate quantities based on chainlink fence specifications
const quantities = {
    concrete: totalPosts,
    hogTies: Math.ceil(totalFeet / 1.5),
    linePosts: linePosts,
    terminalPosts: totalTerminalPosts,
    mesh: Math.ceil(totalFeet / meshLength),
    tensionWire: Math.ceil(totalFeet / tensionWireLength),
    tensionBands: totalTerminalPosts * 4,  // Add this (4 per terminal post for 6' fence)
    braceBands: totalTerminalPosts * 2,    // Add this (2 per terminal post)
    topRail: Math.ceil(totalFeet / topRailLength),
    linePostCaps: linePosts,
    terminalCaps: totalTerminalPosts,
    topRailEnds: ((cornerPosts * 2) + endPosts),
    trussBars: Math.ceil((cornerPosts*2) + endPosts),     // Add this (assuming 1 truss bar every 10 feet)
    barbWire: Math.ceil(totalFeet / 100)      // Add this (assuming 100ft rolls)

};
    // Update quantity inputs
    Object.entries(quantities).forEach(([key, value]) => {
        const input = document.getElementById(`${key}Qty`);
        if (input) {
            input.value = value;
        }
    });

    return quantities;
}

function calculateTotals() {
    let materialTotal = 0;
    let taxableMaterialTotal = 0;

    // Calculate material totals
const materials = [
    'concrete',
    'hogTies',
    'linePosts',
    'terminalPosts',
    'mesh',
    'tensionBars',
    'tensionBands', // Add this
    'braceBands',   // Add this
    'tensionWire',
    'topRail',
    'linePostCaps',
    'terminalCaps',
    'topRailEnds',
    'trussBars',    // Add this
    'barbWire'
];
    materials.forEach(type => {
        const select = document.getElementById(`${type}Select`);
        const qtyInput = document.getElementById(`${type}Qty`);
        const totalCell = document.getElementById(`${type}Total`);
        const taxCheckbox = document.getElementById(`${type}Tax`);

        if (select && qtyInput && totalCell) {
            const price = parseFloat(select.options[select.selectedIndex].dataset.price);
            const qty = parseInt(qtyInput.value) || 0;
            const total = price * qty;
            totalCell.textContent = `$${total.toFixed(2)}`;
            materialTotal += total;

            if (taxCheckbox && taxCheckbox.checked) {
                taxableMaterialTotal += total;
            }
        }
    });

    // Add custom row totals
    document.querySelectorAll('.custom-row').forEach(row => {
        const qtyInput = row.querySelector('.quantity-input');
        const priceInput = row.querySelector('input[type="number"][step="0.01"]');
        const taxCheckbox = row.querySelector('.tax-checkbox');
        const totalCell = row.querySelector('td:last-child');

        if (qtyInput && priceInput && totalCell) {
            const qty = parseFloat(qtyInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            const total = qty * price;
            totalCell.textContent = `$${total.toFixed(2)}`;
            materialTotal += total;

            if (taxCheckbox && taxCheckbox.checked) {
                taxableMaterialTotal += total;
            }
        }
    });

    // Calculate labor cost
    const totalFeet = parseFloat(document.getElementById('totalLinearFeet').value) || 0;
    const laborRate = parseFloat(document.getElementById('laborRate').value) || 0;
    const laborTotal = totalFeet * laborRate;

    // Calculate overhead and tax
    const marginPercent = parseFloat(document.getElementById('marginPercent').value) || 0;
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;

    const subtotal = materialTotal + laborTotal;
    const totalBeforeTax = subtotal / (1 - marginPercent / 100);
    const overheadAmount = totalBeforeTax - subtotal;

    // Calculate tax
    let taxableAmount = 0;
    if (document.getElementById('materialsTaxable').checked) {
        taxableAmount += taxableMaterialTotal;
    }
    if (document.getElementById('laborTaxable').checked) {
        taxableAmount += laborTotal;
    }

    const tax = taxableAmount > 0 ?
        ((taxableAmount * (1 / (1 - marginPercent / 100))) * (taxRate / 100)) : 0;

    // Final total includes overhead and tax
    const finalTotal = totalBeforeTax + tax;

    // Update display
    document.getElementById('materialCost').textContent = materialTotal.toFixed(2);
    document.getElementById('laborCost').textContent = laborTotal.toFixed(2);
    document.getElementById('taxCost').textContent = tax.toFixed(2);
    document.getElementById('profitAmount').textContent = overheadAmount.toFixed(2);
    document.getElementById('totalCost').textContent = finalTotal.toFixed(2);
}
function addCustomRow() {
    const tbody = document.querySelector('#materialsTable tbody');
    if (!tbody) return;

    const row = tbody.insertRow();
    row.className = 'custom-row';
    customRowCount++;

    // Create quantity cell
    const qtyCell = row.insertCell();
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.min = '0';
    qtyInput.value = '0';
    qtyInput.className = 'quantity-input';
    qtyCell.appendChild(qtyInput);

    // Item name input
    const itemCell = row.insertCell();
    const itemInput = document.createElement('input');
    itemInput.type = 'text';
    itemInput.placeholder = 'Custom Item';
    itemCell.appendChild(itemInput);

    // Description/Style input
    const descCell = row.insertCell();
    const descInput = document.createElement('input');
    descInput.type = 'text';
    descInput.placeholder = 'Description';
    descCell.appendChild(descInput);

    // Unit Price input
    const priceCell = row.insertCell();
    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.min = '0';
    priceInput.step = '0.01';
    priceInput.value = '0.00';
    priceInput.addEventListener('input', calculateTotals);
    priceCell.appendChild(priceInput);

    // Tax checkbox cell
    const taxCell = row.insertCell();
    const taxCheckbox = document.createElement('input');
    taxCheckbox.type = 'checkbox';
    taxCheckbox.className = 'tax-checkbox';
    taxCheckbox.checked = document.getElementById('materialsTaxable')?.checked ?? true;
    taxCheckbox.addEventListener('change', calculateTotals);
    taxCell.appendChild(taxCheckbox);

    // Total Price cell
    const totalCell = row.insertCell();
    totalCell.id = `customTotal${customRowCount}`;
    totalCell.textContent = '$0.00';

    // Add event listeners
    qtyInput.addEventListener('input', calculateTotals);
    priceInput.addEventListener('input', calculateTotals);

    calculateTotals();
}


function loadDrawingPreview() {
    const canvas = document.getElementById('drawing-preview');
    const ctx = canvas.getContext('2d');
    const drawingDataParam = urlParams.get('drawingData');

    if (drawingDataParam) {
        try {
            const data = JSON.parse(drawingDataParam);

            // Set canvas size
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;

            // Find bounds of all elements
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;

            // Include segments in bounds
            if (data.segments) {
                data.segments.forEach(segment => {
                    segment.forEach(point => {
                        minX = Math.min(minX, point.x);
                        minY = Math.min(minY, point.y);
                        maxX = Math.max(maxX, point.x);
                        maxY = Math.max(maxY, point.y);
                    });
                });
            }

            // Include gates in bounds
            if (data.gates) {
                data.gates.forEach(gate => {
                    minX = Math.min(minX, gate.x1);
                    minY = Math.min(minY, gate.y1);
                    maxX = Math.max(maxX, gate.x2);
                    maxY = Math.max(maxY, gate.y2);
                });
            }

            // Include structures in bounds
            if (data.structures) {
                data.structures.forEach(structure => {
                    minX = Math.min(minX, structure.x);
                    minY = Math.min(minY, structure.y);
                    maxX = Math.max(maxX, structure.x + structure.width);
                    maxY = Math.max(maxY, structure.y + structure.height);
                });
            }

            // Add padding
            const padding = 40;
            const drawingWidth = maxX - minX + (2 * padding);
            const drawingHeight = maxY - minY + (2 * padding);

            // Calculate scale to fit canvas
            const scaleX = canvas.width / drawingWidth;
            const scaleY = canvas.height / drawingHeight;
            const scale = Math.min(scaleX, scaleY);

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Transform context to center and scale the drawing
            ctx.save();
            ctx.translate(-minX * scale + padding, -minY * scale + padding);
            ctx.scale(scale, scale);

            // Draw structures with dimensions first (background)
            if (data.structures) {
                data.structures.forEach(structure => {
                    ctx.fillStyle = 'rgba(245, 245, 100, 0.7)';
                    ctx.strokeStyle = 'black';
                    ctx.fillRect(structure.x, structure.y, structure.width, structure.height);
                    ctx.strokeRect(structure.x, structure.y, structure.width, structure.height);

                    // Draw dimensions
                    ctx.fillStyle = 'black';
                    ctx.font = '12px Arial';
                    const widthFeet = (structure.width / data.scale).toFixed(1);
                    const heightFeet = (structure.height / data.scale).toFixed(1);
                    ctx.fillText(`${widthFeet}'`, structure.x + structure.width / 2 - 15, structure.y - 5);
                    ctx.fillText(`${heightFeet}'`, structure.x - 20, structure.y + structure.height / 2);
                });
            }

            // Draw gates next
            if (data.gates) {
                data.gates.forEach(gate => {
                    ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
                    ctx.strokeStyle = '#000';
                    ctx.fillRect(gate.x1, gate.y1, gate.width, gate.height);
                    ctx.strokeRect(gate.x1, gate.y1, gate.width, gate.height);

                    // Draw gate label
                    const gateWidth = Math.round(gate.width / data.scale);
                    const swingDir = gate.swing.toUpperCase();
                    const hingeSide = gate.hingeSide === 'left' ? 'L' : 'R';
                    const label = `${gateWidth}'${hingeSide}${swingDir}${gate.postCount === 1 ? '*' : ''}`;

                    ctx.fillStyle = '#000';
                    ctx.font = '12px Arial';
                    const textWidth = ctx.measureText(label).width;
                    ctx.fillText(label, gate.x1 + (gate.width - textWidth) / 2, gate.y1 + gate.height / 2 + 4);
                });
            }

            // Draw post marks first
            if (data.segments) {
                data.segments.forEach(segment => {
                    if (segment.length > 0) {
                        segment.forEach((point, i) => {
                            if (i > 0) {
                                const prevPoint = segment[i - 1];

                                // Draw post marks along segment
                                const dx = point.x - prevPoint.x;
                                const dy = point.y - prevPoint.y;
                                const segmentLength = Math.sqrt(dx * dx + dy * dy);
                                const spacing = data.postSpacing * data.scale;
                                const numPosts = Math.floor(segmentLength / spacing);

                                for (let j = 1; j < numPosts; j++) {
                                    const ratio = j * spacing / segmentLength;
                                    const postX = prevPoint.x + dx * ratio;
                                    const postY = prevPoint.y + dy * ratio;

                                    // Draw X for post mark
                                    ctx.save();
                                    ctx.strokeStyle = '#000';
                                    ctx.beginPath();
                                    ctx.moveTo(postX - 4, postY - 4);
                                    ctx.lineTo(postX + 4, postY + 4);
                                    ctx.moveTo(postX + 4, postY - 4);
                                    ctx.lineTo(postX - 4, postY + 4);
                                    ctx.stroke();
                                    ctx.restore();
                                }
                            }
                        });
                    }
                });
            }

            // Draw segments and length labels last
            if (data.segments) {
                data.segments.forEach(segment => {
                    if (segment.length > 0) {
                        // Draw the line segments
                        ctx.beginPath();
                        ctx.strokeStyle = '#2c3e50';
                        ctx.lineWidth = 2;
                        ctx.moveTo(segment[0].x, segment[0].y);

                        segment.forEach((point, i) => {
                            if (i > 0) {
                                const prevPoint = segment[i - 1];
                                ctx.lineTo(point.x, point.y);

                                // Draw segment length
                                const midX = (prevPoint.x + point.x) / 2;
                                const midY = (prevPoint.y + point.y) / 2;
                                const distance = Math.sqrt(
                                    Math.pow(point.x - prevPoint.x, 2) +
                                    Math.pow(point.y - prevPoint.y, 2)
                                ) / data.scale;

                                ctx.save();
                                ctx.fillStyle = '#000';
                                ctx.font = '12px Arial';
                                ctx.fillText(`${distance.toFixed(1)}'`, midX, midY - 10);
                                ctx.restore();
                            }
                        });
                        ctx.stroke();
                    }
                });
            }

            ctx.restore();
        } catch (error) {
            console.error('Error drawing preview:', error);
        }
    }
}

/// Add event listeners for rate inputs
const laborRateInput = document.getElementById('laborRate');
if (laborRateInput) {
    console.log('Attaching labor rate listener');
    laborRateInput.addEventListener('input', function(e) {
        console.log('Labor rate changed:', e.target.value);
        calculateTotals();
    });
}

// Add event listener for labor tax checkbox
const laborTaxCheckbox = document.getElementById('laborTaxable');
if (laborTaxCheckbox) {
    laborTaxCheckbox.addEventListener('change', calculateTotals);
}

const marginInput = document.getElementById('marginPercent');
if (marginInput) {
    marginInput.addEventListener('input', calculateTotals);
}

document.getElementById('height').addEventListener('change', function(e) {
    const selectedHeight = e.target.value;
    if (financials?.laborRates?.chain_link) {
        const laborRate = financials.laborRates.chain_link[selectedHeight] ||
                         financials.laborRates.chain_link['6'] || 7.5;
        document.getElementById('laborRate').value = laborRate;
    }
    populateMaterialsTable();
    calculateInitialQuantities();
    calculateTotals();
});