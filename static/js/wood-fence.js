// Fence calculator functionality
let fenceMaterials = null;
let financials = null;
let customRowCount = 0;

console.log('Script starting');

document.addEventListener('DOMContentLoaded', function() {
    // Get customer ID from localStorage
    const customerId = localStorage.getItem('customer_id');
    if (customerId) {
        document.getElementById('customerId').value = customerId;
    }
});

const urlParams = new URLSearchParams(window.location.search);

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Script starting');

    // Elements that are initialized with default values or values from URL parameters
    const totalLinearFeet = document.getElementById('totalLinearFeet');
    const totalCornerPosts = document.getElementById('totalCornerPosts');
    const totalEndPosts = document.getElementById('totalEndPosts');
    const totalLinePosts = document.getElementById('totalLinePosts');
    const totalGates = document.getElementById('totalGates');
    const height = document.getElementById('height');
    const fenceType = document.getElementById('fenceType');
    const laborRateInput = document.getElementById('laborRate');
    const taxRateInput = document.getElementById('taxRate');
    const marginPercentInput = document.getElementById('marginPercent');

    // URL parameters
    const urlParams = new URLSearchParams(window.location.search);

    // Check and set default values for each field
    if (totalLinearFeet) totalLinearFeet.value = urlParams.get('totalFeet') || '0';
    else console.error("Element with ID 'totalLinearFeet' not found.");

    if (totalCornerPosts) totalCornerPosts.value = urlParams.get('cornerPosts') || '0';
    else console.error("Element with ID 'totalCornerPosts' not found.");

    if (totalEndPosts) totalEndPosts.value = urlParams.get('endPosts') || '0';
    else console.error("Element with ID 'totalEndPosts' not found.");

    if (totalLinePosts) totalLinePosts.value = urlParams.get('linePosts') || '0';
    else console.error("Element with ID 'totalLinePosts' not found.");

    if (totalGates) totalGates.value = urlParams.get('totalGates') || '0';
    else console.error("Element with ID 'totalGates' not found.");

    if (height) height.value = urlParams.get('height') || '6';
    else console.error("Element with ID 'height' not found.");

    if (fenceType) fenceType.value = urlParams.get('fenceType') || 'wood_privacy';
    else console.error("Element with ID 'fenceType' not found.");

    try {
        // Load financials and woodFenceMaterials JSON files
        const [materialsResponse, financialsResponse] = await Promise.all([
            fetch('/materials/woodFenceMaterials.json'),
            fetch('/materials/financials.json')
        ]);

        woodFenceMaterials = await materialsResponse.json();
        financials = await financialsResponse.json();

        // Set default rates from financials, if applicable
        if (laborRateInput && financials.laborRates && financials.laborRates.wood_privacy) {
            laborRateInput.value = financials.laborRates.wood_privacy['6'] || '7.5';
        } else {
            console.error("Labor rate element or financial data not found for 'wood_privacy' 6 ft.");
        }

        if (taxRateInput && financials.overheadRates) {
            taxRateInput.value = (financials.overheadRates.taxRate * 100).toFixed(1);
        } else {
            console.error("Tax rate element or overhead rates data not found.");
        }

        if (marginPercentInput && financials.overheadRates) {
            marginPercentInput.value = ((1 - financials.overheadRates.profitMargin) * 100).toFixed(1);
        } else {
            console.error("Margin percent element or profit margin data not found.");
        }

        // Initialize other parts of the application
        populateMaterialsTable();
        calculateInitialQuantities();
        calculateTotals();
        loadDrawingPreview();

    } catch (error) {
        console.error('Error loading financials or materials data:', error);
    }
});

function initializeFenceTypes() {
    const fenceTypeSelect = document.getElementById('fenceType');
    if (!fenceTypeSelect || !financials) return;

    // Clear existing options
    fenceTypeSelect.innerHTML = '';

    // Add options for each fence type
    Object.keys(financials.laborRates).forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        fenceTypeSelect.appendChild(option);
    });
}

function updateFenceOptions() {
    if (!financials) return;

    const fenceType = document.getElementById('fenceType').value;
    const height = document.getElementById('height').value;
    const heightSelect = document.getElementById('height');

    // Update available heights for the selected fence type
    if (heightSelect) {
        const availableHeights = Object.keys(financials.laborRates[fenceType]);
        heightSelect.innerHTML = '';
        availableHeights.forEach(h => {
            const option = document.createElement('option');
            option.value = h;
            option.textContent = `${h} ft`;
            heightSelect.appendChild(option);
        });

        // Set height to first available if current is not valid
        if (!availableHeights.includes(height)) {
            heightSelect.value = availableHeights[0];
        } else {
            heightSelect.value = height;
        }
    }

    // Update labor rate
    const laborRate = financials.laborRates[height][fenceType];
    if (laborRate) {
        document.getElementById('laborRate').value = laborRate;
    }

    // Update tax and margin rates
    document.getElementById('taxRate').value = (financials.overheadRates.taxRate * 100).toFixed(1);
    document.getElementById('marginPercent').value = ((1 - financials.overheadRates.profitMargin) * 100).toFixed(1);

    // Update materials for the selected fence type
    populateMaterialsTable();
    calculateInitialQuantities();
    calculateTotals();
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

function calculateTotals() {
    let materialTotal = 0;
    let taxableMaterialTotal = 0;

    // Calculate material totals
    ['concrete', 'posts', 'rails', 'pickets', 'fasteners', 'gates'].forEach(type => {
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

    // Calculate labor and overhead
    const totalFeet = parseFloat(document.getElementById('totalLinearFeet').value) || 0;
    const laborRate = parseFloat(document.getElementById('laborRate').value) || 7.5;
    const marginPercent = parseFloat(document.getElementById('marginPercent').value) || 23;
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 8;

    const laborTotal = totalFeet * laborRate;
    const subtotal = materialTotal + laborTotal;

    // Calculate taxable amount
    let taxableAmount = 0;

    console.log('--- Tax Calculation Debug ---');
    console.log('Material Total:', materialTotal);
    console.log('Labor Total:', laborTotal);
    console.log('Materials Taxable:', document.getElementById('materialsTaxable')?.checked);
    console.log('Labor Taxable:', document.getElementById('laborTaxable')?.checked);

    if (document.getElementById('materialsTaxable')?.checked) {
        taxableAmount += taxableMaterialTotal;
        console.log('Taxable Materials Amount:', taxableMaterialTotal);
    }
    const laborTaxCheckbox = document.getElementById('laborTaxable');
    if (laborTaxCheckbox && laborTaxCheckbox.checked) {
        taxableAmount += laborTotal;
        console.log('Taxable Labor Amount:', laborTotal);
    }

    // Apply overhead first
    const totalBeforeTax = subtotal / (1 - marginPercent / 100);
    const overheadAmount = totalBeforeTax - subtotal;

    console.log('Total Taxable Amount:', taxableAmount);
    console.log('Margin Percent:', marginPercent);
    console.log('Tax Rate:', taxRate);

    // Calculate tax
    const tax = taxableAmount > 0 ?
        ((taxableAmount * (1 / (1 - marginPercent / 100))) * (taxRate / 100)) : 0;

    console.log('Calculated Tax:', tax);

    // Final total includes overhead and tax
    const finalTotal = totalBeforeTax + tax;

    // Update display
    document.getElementById('materialCost').textContent = materialTotal.toFixed(2);
    document.getElementById('laborCost').textContent = laborTotal.toFixed(2);
    document.getElementById('taxCost').textContent = tax.toFixed(2);
    document.getElementById('profitAmount').textContent = overheadAmount.toFixed(2);
    document.getElementById('totalCost').textContent = finalTotal.toFixed(2);
}

function calculateInitialQuantities() {
    const totalFeet = parseFloat(document.getElementById('totalLinearFeet').value) || 0;
    const cornerPosts = parseInt(document.getElementById('totalCornerPosts').value) || 0;
    const endPosts = parseInt(document.getElementById('totalEndPosts').value) || 0;
    const linePosts = parseInt(document.getElementById('totalLinePosts').value) || 0;
    const totalGates = parseInt(document.getElementById('totalGates').value) || 0;
    const numRails = parseInt(urlParams.get('numRails')) || 3;
    const height = parseInt(document.getElementById('height').value) || 6;

    const totalPosts = cornerPosts + endPosts + linePosts;

    const picketSelect = document.getElementById('picketsSelect');
    const selectedOption = picketSelect ? picketSelect.options[picketSelect.selectedIndex] : null;
    const picketWidth = selectedOption ? parseFloat(selectedOption.dataset.width) : 5.5;

    // Calculate quantities
    const quantities = {
        concrete: totalPosts,
        posts: totalPosts,
        rails: totalPosts * numRails,
        pickets: Math.ceil((((totalFeet * 12) / picketWidth) + totalPosts)),
        fasteners: Math.ceil((totalFeet * 12) / picketWidth * 6 / 700), // 700 screws per box
        gates: totalGates
    };

    // Set the quantities in the inputs
    Object.entries(quantities).forEach(([key, value]) => {
        const input = document.getElementById(`${key}Qty`);
        if (input) {
            input.value = value;
        }
    });

    return quantities;
}

function populateMaterialsTable() {
    if (!woodFenceMaterials) return;

    const tbody = document.querySelector('#materialsTable tbody');
    tbody.innerHTML = '';

    // Define the materials to populate based on the `woodFenceMaterials` structure
    const materials = [
        { name: 'Concrete', data: woodFenceMaterials.concrete },
        { name: 'Posts', data: woodFenceMaterials.posts },
        { name: 'Rails', data: woodFenceMaterials.rails },
        { name: 'Pickets', data: woodFenceMaterials.pickets },
        { name: 'Fasteners', data: woodFenceMaterials.fasteners },
        { name: 'Gates', data: woodFenceMaterials.gates }
    ];

    materials.forEach(material => {
        const row = tbody.insertRow();

        // Quantity cell
        const qtyCell = row.insertCell();
        const qtyInput = document.createElement('input');
        qtyInput.type = 'number';
        qtyInput.id = `${material.name.toLowerCase()}Qty`;
        qtyInput.className = 'quantity-input';
        qtyInput.min = '0';
        qtyInput.value = '0';
        qtyInput.addEventListener('input', calculateTotals);
        qtyCell.appendChild(qtyInput);

        // Item cell
        const itemCell = row.insertCell();
        itemCell.textContent = material.name;

        // Style/Type dropdown
        const styleCell = row.insertCell();
        const select = document.createElement('select');
        select.id = `${material.name.toLowerCase()}Select`;

        material.data.forEach(item => {
            const option = document.createElement('option');
            option.value = item.sku;
            option.textContent = item.name;
            option.dataset.price = item.price;
            if (material.name === 'Posts') {
                option.dataset.fenceHeight = item.fenceHeight || 0;
            }
            if (material.name === 'Pickets') {
                option.dataset.width = item.width || 5.5;
            }
            select.appendChild(option);
        });
        styleCell.appendChild(select);

        // Unit Price cell
        const priceCell = row.insertCell();
        priceCell.id = `${material.name.toLowerCase()}Price`;
        priceCell.textContent = `$${material.data[0].price.toFixed(2)}`;

        // Tax checkbox cell
        const taxCell = row.insertCell();
        const taxCheckbox = document.createElement('input');
        taxCheckbox.type = 'checkbox';
        taxCheckbox.id = `${material.name.toLowerCase()}Tax`;
        taxCheckbox.className = 'tax-checkbox';
        taxCheckbox.checked = true;
        taxCheckbox.addEventListener('change', calculateTotals);
        taxCell.appendChild(taxCheckbox);

        // Total Price cell
        const totalCell = row.insertCell();
        totalCell.id = `${material.name.toLowerCase()}Total`;
        totalCell.textContent = '$0.00';

        // Update price and quantity based on selection
        select.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            priceCell.textContent = `$${parseFloat(selectedOption.dataset.price).toFixed(2)}`;

            if (material.name === 'Pickets') {
                const totalFeet = parseFloat(document.getElementById('totalLinearFeet').value) || 0;
                const picketWidth = parseFloat(selectedOption.dataset.width) || 5.5;
                const totalPosts = (parseInt(document.getElementById('totalCornerPosts').value) || 0) +
                                 (parseInt(document.getElementById('totalEndPosts').value) || 0) +
                                 (parseInt(document.getElementById('totalLinePosts').value) || 0);

                const newQuantity = Math.ceil((((totalFeet * 12) / picketWidth) + totalPosts));
                qtyInput.value = newQuantity;
            }

            if (material.name === 'Fasteners') {
                const picketQty = parseInt(document.getElementById('picketsQty').value) || 0;
                const newQuantity = Math.ceil((picketQty * 6) / 700);
                qtyInput.value = newQuantity;
            }

            calculateTotals();
        });
    });

    // Set initial quantities and load preview
    const quantities = calculateInitialQuantities();
    Object.entries(quantities).forEach(([key, value]) => {
        const input = document.getElementById(`${key}Qty`);
        if (input) {
            input.value = value;
        }
    });

    calculateTotals();
    loadDrawingPreview();
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

// Add event listeners for rate inputs
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

document.getElementById('convertToProposal').addEventListener('click', function () {
    const customerId = document.getElementById('customerId').value;
    const height = document.getElementById('height').value;
    const stylePickets = document.getElementById('picketsSelect')?.options[document.getElementById('picketsSelect').selectedIndex]?.text || '';
    const stylePosts = document.getElementById('postsSelect')?.options[document.getElementById('postsSelect').selectedIndex]?.text || '';
    const styleRails = document.getElementById('railsSelect')?.options[document.getElementById('railsSelect').selectedIndex]?.text || '';
    const styleFasteners = document.getElementById('fastenersSelect')?.options[document.getElementById('fastenersSelect').selectedIndex]?.text || '';
    const styleGates = document.getElementById('gatesSelect')?.options[document.getElementById('gatesSelect').selectedIndex]?.text || '';

    const gates = document.getElementById('totalGates').value;
    const totalLinearFeet = document.getElementById('totalLinearFeet').value;
    const cornerPosts = document.getElementById('totalCornerPosts').value;
    const endPosts = document.getElementById('totalEndPosts').value;
    const linePosts = document.getElementById('totalLinePosts').value;
    const materialCost = document.getElementById('materialCost').textContent;
    const laborCost = document.getElementById('laborCost').textContent;
    const profitAmount = document.getElementById('profitAmount').textContent;
    const taxCost = document.getElementById('taxCost').textContent;
    const totalCost = document.getElementById('totalCost').textContent;

    const canvas = document.getElementById('drawing-preview');
    const drawingDataUrl = canvas.toDataURL('image/png');

    const totalCostNum = parseFloat(document.getElementById('totalCost').textContent);
    const taxCostNum = parseFloat(document.getElementById('taxCost').textContent);

    const data = {
        customer_id: customerId,
        height,
        style: {
            pickets: stylePickets,
            posts: stylePosts,
            rails: styleRails,
            fasteners: styleFasteners,
            gates: styleGates
        },
        gates,
        totalLinearFeet,
        cornerPosts,
        endPosts,
        linePosts,
        materialCost: parseFloat(materialCost).toFixed(2),
        laborCost: parseFloat(laborCost).toFixed(2),
        subtotal: (totalCostNum - taxCostNum).toFixed(2),
        tax: parseFloat(taxCost).toFixed(2),
        total: parseFloat(totalCost).toFixed(2),
        drawing: drawingDataUrl
    };

    fetch('/create_proposal', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(responseData => {
            if (responseData.proposal_id) {
                window.location.href = `/proposal/${responseData.proposal_id}`;
            } else {
                console.error('No proposal ID received:', responseData);
                alert('Error creating proposal');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error creating proposal: ' + error.message);
        });
});
