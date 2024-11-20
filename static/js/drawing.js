// Core drawing functionality
class DrawingCanvas {
    constructor() {
        this.canvas = document.getElementById("drawingCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.isDrawing = false;
        this.isDragging = false;
        this.isDraggingGate = false;
        this.dragPoint = null;
        this.dragSegmentIndex = -1;
        this.dragPointIndex = -1;
        this.dragGateIndex = -1;
        this.segments = [];
        this.currentSegment = [];
        this.gates = [];
        this.structures = [];
        this.selectedStructure = null;
        this.isResizing = false;
        this.resizeCorner = null;
        this.lastEndPoint = null;
        this.activeDrawing = false;
        this.currentMousePos = null;
        this.DRAG_THRESHOLD = 10;
        this.CORNER_SIZE = 10;
        this.SNAP_THRESHOLD = 20;

        this.mouseMoveThrottle = 16; // ~60fps
        this.lastMoveTime = 0;
        this.lineSmoothing = true;
        this.smoothingFactor = 0.1;



        this.initializeCanvas();
        this.bindEvents();
        document.getElementById('calculateMaterials').addEventListener('click', () => {
        const fenceType = document.getElementById('fenceType').value;

        const params = new URLSearchParams({
            // customerId: document.getElementById('customer_id').textContent,
            totalFeet: document.getElementById('totalFeet').textContent,
            cornerPosts: document.getElementById('cornerPosts').textContent,
            endPosts: document.getElementById('endPosts').textContent,
            linePosts: document.getElementById('linePosts').textContent,
            totalGates: document.getElementById('totalGates').textContent,
            numRails: document.getElementById('numRails').value,
            height: document.getElementById('height').value,
            drawingData: JSON.stringify({
                segments: this.segments,
                gates: this.gates,
                structures: this.structures,
                scale: parseInt(document.getElementById('scale').value),
                postSpacing: parseInt(document.getElementById('postSpacing').value)
            })
        });

        let redirectUrl;
        if (fenceType === 'chain_link') {
            redirectUrl = '/chainlink_fence';
        } else if (fenceType === 'wood_fence') {
            redirectUrl = '/wood_fence';
        } else if (fenceType === 'iron_fence') {
            redirectUrl = '/iron_fence';
        } else {
            alert("Please select a valid fence type.");
            return;
        }
        console.log(params)
        console.log(params.toString())
        window.location.href = `${redirectUrl}?${params.toString()}`;
    });

    }

    initializeCanvas() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    bindEvents() {
        this.canvas.addEventListener("mousedown", this.startDrawing.bind(this));
        this.canvas.addEventListener("mousemove", this.continueDrawing.bind(this));
        this.canvas.addEventListener("mouseup", this.endDrawing.bind(this));
        this.canvas.addEventListener("dblclick", this.handleDoubleClick.bind(this));
        this.canvas.addEventListener("touchstart", this.startDrawing.bind(this));
        this.canvas.addEventListener("touchmove", this.continueDrawing.bind(this));
        this.canvas.addEventListener("touchend", this.endDrawing.bind(this));

        document.getElementById("resetDrawing").addEventListener("click", this.resetDrawing.bind(this));
        document.getElementById("undoLine").addEventListener("click", this.undoLine.bind(this));
        document.getElementById("undoGate").addEventListener("click", this.undoGate.bind(this));
        document.getElementById("addGate").addEventListener("click", this.addGate.bind(this));
        document.getElementById("addStructure").addEventListener("click", this.addStructure.bind(this));
        document.getElementById("undoStructure").addEventListener("click", this.undoStructure.bind(this));
        document.getElementById("endDrawing").addEventListener("click", this.handleDoubleClick.bind(this));
    }

    getDistance(x1, y1, x2, y2) {
        const scale = document.getElementById("scale").value;
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) / scale;
    }

    drawCircle(x, y, filled) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, Math.PI * 2);
        if (filled) {
            this.ctx.fill();
        } else {
            this.ctx.stroke();
        }
    }

    drawPostMark(x, y) {
        const size = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x - size, y - size);
        this.ctx.lineTo(x + size, y + size);
        this.ctx.moveTo(x + size, y - size);
        this.ctx.lineTo(x - size, y + size);
        this.ctx.stroke();
    }

    drawPostMarks(startX, startY, endX, endY, spacing) {
        const distance = this.getDistance(startX, startY, endX, endY);
        const scale = document.getElementById("scale").value;
        const spacingInPixels = spacing * scale;
        const numPosts = Math.ceil(distance * scale / spacingInPixels);

        for (let i = 1; i < numPosts; i++) {
            const ratio = (i * spacingInPixels) / (distance * scale);
            const x = startX + (endX - startX) * ratio;
            const y = startY + (endY - startY) * ratio;
            this.drawPostMark(x, y);
        }
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    isPointConnected(point, isFirst = false) {
        if (this.segments.length === 0 && isFirst) return false;

        let connections = 0;
        this.segments.forEach(segment => {
            if ((Math.abs(segment[0].x - point.x) < 1 && Math.abs(segment[0].y - point.y) < 1) ||
                (Math.abs(segment[segment.length - 1].x - point.x) < 1 && Math.abs(segment[segment.length - 1].y - point.y) < 1)) {
                connections++;
            }
        });
        return connections > 1;
    }

    findDraggablePoint(x, y) {
        for (let i = 0; i < this.segments.length; i++) {
            for (let j = 0; j < this.segments[i].length; j++) {
                const point = this.segments[i][j];
                if (Math.abs(point.x - x) < this.DRAG_THRESHOLD && Math.abs(point.y - y) < this.DRAG_THRESHOLD) {
                    return { segmentIndex: i, pointIndex: j, point: point };
                }
            }
        }
        return null;
    }

    findDraggableGate(x, y) {
        for (let i = 0; i < this.gates.length; i++) {
            const gate = this.gates[i];
            if (x >= gate.x1 && x <= gate.x2 && y >= gate.y1 && y <= gate.y2) {
                return i;
            }
        }
        return -1;
    }

    drawPreviewLine() {
        if (this.isDrawing && this.currentSegment.length > 0 && this.currentMousePos) {
            const lastPoint = this.currentSegment[this.currentSegment.length - 1];

            this.ctx.save();
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(lastPoint.x, lastPoint.y);
            this.ctx.lineTo(this.currentMousePos.x, this.currentMousePos.y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            const distance = this.getDistance(lastPoint.x, lastPoint.y, this.currentMousePos.x, this.currentMousePos.y);
            this.ctx.fillStyle = '#000';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(
                `${distance.toFixed(1)} ft`,
                (lastPoint.x + this.currentMousePos.x) / 2 + 10,
                (lastPoint.y + this.currentMousePos.y) / 2 - 10
            );
            this.ctx.restore();
        }
    }

    drawGate(gate, index) {
        this.ctx.save();

        if (index === this.selectedGateIndex) {
            this.ctx.fillStyle = 'rgba(173, 216, 230, 0.5)';
        } else {
            this.ctx.fillStyle = 'lightgray';
        }

        const centerX = (gate.x1 + gate.x2) / 2;
        const centerY = (gate.y1 + gate.y2) / 2;

        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(gate.orientation === 'vertical' ? Math.PI / 2 : 0);
        this.ctx.translate(-centerX, -centerY);

        this.ctx.fillRect(gate.x1, gate.y1, gate.width, gate.height);
        this.ctx.strokeStyle = 'black';
        this.ctx.strokeRect(gate.x1, gate.y1, gate.width, gate.height);

        const scale = document.getElementById("scale").value;
        const gateWidthFeet = Math.round(gate.width / scale);
        const postIndicator = gate.postCount === 1 ? '*' : '';
        const swingText = `${gateWidthFeet}${gate.hingeSide === 'left' ? 'L' : 'R'}${gate.swing.toUpperCase()}${postIndicator}`;

        this.ctx.fillStyle = 'black';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(swingText,
            gate.x1 + gate.width / 2 - this.ctx.measureText(swingText).width / 2,
            gate.y1 + gate.height / 2 + 5
        );

        this.ctx.restore();
    }

    drawLines() {
        this.clearCanvas();
        this.ctx.lineWidth = 2;

        // Draw structures first
        this.structures.forEach(structure => structure.draw(this.ctx));

        this.segments.forEach((segment, segmentIndex) => {
            if (segment.length > 0) {
                this.ctx.beginPath();
                this.ctx.moveTo(segment[0].x, segment[0].y);
                segment.forEach((point, i) => {
                    if (i > 0) {
                        this.ctx.lineTo(point.x, point.y);
                    }
                });
                this.ctx.stroke();

                for (let i = 1; i < segment.length; i++) {
                    this.drawPostMarks(
                        segment[i - 1].x, segment[i - 1].y,
                        segment[i].x, segment[i].y,
                        document.getElementById("postSpacing").value
                    );

                    const lineDistance = this.getDistance(segment[i - 1].x, segment[i - 1].y, segment[i].x, segment[i].y);
                    this.ctx.save();
                    this.ctx.fillStyle = '#000';
                    this.ctx.font = '12px Arial';
                    this.ctx.fillText(
                        `${lineDistance.toFixed(1)} ft`,
                        (segment[i - 1].x + segment[i].x) / 2 + 10,
                        (segment[i - 1].y + segment[i].y) / 2 - 10
                    );
                    this.ctx.restore();
                }

                segment.forEach((point, i) => {
                    const isFirst = segmentIndex === 0 && i === 0;
                    if (i === 0 || i === segment.length - 1) {
                        if (isFirst || (!this.isPointConnected(point, isFirst))) {
                            this.drawCircle(point.x, point.y, false);
                        } else {
                            this.drawCircle(point.x, point.y, true);
                        }
                    }
                });
            }
        });

        this.gates.forEach((gate, index) => this.drawGate(gate, index));
        this.drawPreviewLine();
    }

    updateSummary() {
        let totalFeet = 0;
        let cornerPosts = 0;
        let endPosts = 0;
        let linePosts = 0;
        const totalGates = this.gates.length;

        const connectedPoints = new Map();

        this.segments.forEach(segment => {
            const startPoint = JSON.stringify([segment[0].x, segment[0].y]);
            const endPoint = JSON.stringify([segment[segment.length - 1].x, segment[segment.length - 1].y]);

            connectedPoints.set(startPoint, (connectedPoints.get(startPoint) || 0) + 1);
            connectedPoints.set(endPoint, (connectedPoints.get(endPoint) || 0) + 1);
        });

        this.segments.forEach(segment => {
            for (let i = 1; i < segment.length; i++) {
                totalFeet += this.getDistance(segment[i - 1].x, segment[i - 1].y, segment[i].x, segment[i].y);
            }

            const startPoint = JSON.stringify([segment[0].x, segment[0].y]);
            const endPoint = JSON.stringify([segment[segment.length - 1].x, segment[segment.length - 1].y]);

            if (connectedPoints.get(startPoint) === 1) {
                endPosts++;
            } else if (connectedPoints.get(startPoint) > 1) {
                cornerPosts++;
            }

            if (connectedPoints.get(endPoint) === 1) {
                endPosts++;
            } else if (connectedPoints.get(endPoint) > 1) {
                cornerPosts++;
            }

            for (let i = 1; i < segment.length; i++) {
                const distance = this.getDistance(segment[i - 1].x, segment[i - 1].y, segment[i].x, segment[i].y);
                const postsInSegment = Math.ceil(distance / document.getElementById("postSpacing").value) - 1;
                if (postsInSegment > 0) {
                    linePosts += postsInSegment;
                }
            }
        });

        cornerPosts = Math.floor(cornerPosts / 2);
        this.gates.forEach(gate => {
            endPosts += gate.postCount;
        });

        document.getElementById("totalFeet").innerText = totalFeet.toFixed(1);
        document.getElementById("cornerPosts").innerText = cornerPosts;
        document.getElementById("endPosts").innerText = endPosts;
        document.getElementById("linePosts").innerText = linePosts;
        document.getElementById("totalGates").innerText = totalGates;
    }

    getAdjustedCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        let x, y;

        if (event.touches) {
            x = event.touches[0].clientX - rect.left;
            y = event.touches[0].clientY - rect.top;
        } else {
            x = event.clientX - rect.left;
            y = event.clientY - rect.top;
        }

        if (this.lineSmoothing && this.currentMousePos && this.isDrawing) {
        // Use a weighted average for smoother movement
        const weight = 0.85; // Higher value = more responsive, lower = smoother
        x = x * weight + this.currentMousePos.x * (1 - weight);
        y = y * weight + this.currentMousePos.y * (1 - weight);
    }

    return { x, y };
}

    findSnapPoint(x, y) {
        let closestPoint = null;
        let closestDistance = this.SNAP_THRESHOLD;

        for (let segment of this.segments) {
            const startPoint = segment[0];
            const endPoint = segment[segment.length - 1];

            // Check endpoints
            const startDist = Math.hypot(startPoint.x - x, startPoint.y - y);
            const endDist = Math.hypot(endPoint.x - x, endPoint.y - y);

            if (startDist < closestDistance) {
                closestDistance = startDist;
                closestPoint = startPoint;
            }
            if (endDist < closestDistance) {
                closestDistance = endDist;
                closestPoint = endPoint;
            }

            // Check line segments for perpendicular snapping
            for (let i = 1; i < segment.length; i++) {
                const p1 = segment[i - 1];
                const p2 = segment[i];

                // Find nearest point on line segment
                const A = x - p1.x;
                const B = y - p1.y;
                const C = p2.x - p1.x;
                const D = p2.y - p1.y;

                const dot = A * C + B * D;
                const len_sq = C * C + D * D;
                const param = len_sq !== 0 ? dot / len_sq : -1;

                let xx, yy;

                if (param < 0) {
                    xx = p1.x;
                    yy = p1.y;
                } else if (param > 1) {
                    xx = p2.x;
                    yy = p2.y;
                } else {
                    xx = p1.x + param * C;
                    yy = p1.y + param * D;
                }

                const dist = Math.hypot(x - xx, y - yy);
                if (dist < closestDistance) {
                    closestDistance = dist;
                    closestPoint = { x: xx, y: yy };
                }
            }
        }

        return closestPoint;
    }

   startDrawing(event) {
    const coords = this.getAdjustedCoordinates(event);

    // First check for structure interaction
    if (this.structures.length > 0) {
        for (let i = this.structures.length - 1; i >= 0; i--) {
            const structure = this.structures[i];
            const corner = structure.getResizeCorner(coords.x, coords.y);

            if (corner) {
                this.isResizing = true;
                this.selectedStructure = structure;
                this.resizeCorner = corner;
                return;
            } else if (structure.containsPoint(coords.x, coords.y)) {
                this.isDragging = true;
                this.selectedStructure = structure;
                this.dragPoint = {
                    x: coords.x - structure.x,
                    y: coords.y - structure.y
                };
                return;
            }
        }
    }

    // Enhanced draggable point detection with intent recognition
    const draggable = this.findDraggablePoint(coords.x, coords.y);
    if (draggable) {
        // If it's an endpoint and there's no active drawing, check if user is hovering briefly
        if ((draggable.pointIndex === 0 || draggable.pointIndex === this.segments[draggable.segmentIndex].length - 1)) {
            if (!this.dragTimeout) {
                this.dragTimeout = setTimeout(() => {
                    // If still hovering after timeout, assume drag intent
                    this.isDragging = true;
                    this.dragSegmentIndex = draggable.segmentIndex;
                    this.dragPointIndex = draggable.pointIndex;
                    this.dragPoint = draggable.point;
                    this.canvas.classList.add('dragging');
                    this.dragTimeout = null;
                }, 150); // Short delay to detect intent

                // Store potential drag info
                this.pendingDrag = {
                    point: draggable.point,
                    segmentIndex: draggable.segmentIndex,
                    pointIndex: draggable.pointIndex
                };

                // Start new line immediately but be ready to cancel if it becomes a drag
                if (!this.isDrawing) {
                    this.currentSegment = [draggable.point];
                    this.isDrawing = true;
                    this.activeDrawing = true;
                    this.currentMousePos = coords;
                }
                return;
            }
        } else {
            // If it's not an endpoint, always treat as drag
            this.isDragging = true;
            this.dragSegmentIndex = draggable.segmentIndex;
            this.dragPointIndex = draggable.pointIndex;
            this.dragPoint = draggable.point;
            this.canvas.classList.add('dragging');
            return;
        }
    }

    // Clear any pending drag detection if we clicked elsewhere
    if (this.dragTimeout) {
        clearTimeout(this.dragTimeout);
        this.dragTimeout = null;
        this.pendingDrag = null;
    }

    const draggableGate = this.findDraggableGate(coords.x, coords.y);
    if (draggableGate !== -1) {
        this.isDraggingGate = true;
        this.dragGateIndex = draggableGate;
        this.canvas.classList.add('dragging');
        return;
    }

    // Start new line if not interacting with existing elements
    if (!this.isDrawing) {
        if (!this.activeDrawing || !this.lastEndPoint) {
            this.currentSegment = [coords];
            this.activeDrawing = true;
        } else {
            this.currentSegment = [this.lastEndPoint];
        }
        this.isDrawing = true;
        this.currentMousePos = coords;
    }
}

continueDrawing(event) {
    const coords = this.getAdjustedCoordinates(event);

    // If we moved significantly during the drag detection timeout, cancel it and commit to drawing
    if (this.dragTimeout && this.pendingDrag) {
        const dragPoint = this.pendingDrag.point;
        const moveDistance = Math.hypot(coords.x - dragPoint.x, coords.y - dragPoint.y);
        if (moveDistance > 5) { // Small threshold to detect intentional movement
            clearTimeout(this.dragTimeout);
            this.dragTimeout = null;
            this.pendingDrag = null;
        }
    }

    // Handle structure resizing
    if (this.isResizing && this.selectedStructure) {
        const gridSize = 10;
        coords.x = Math.round(coords.x / gridSize) * gridSize;
        coords.y = Math.round(coords.y / gridSize) * gridSize;
        const minSize = 20;

        switch (this.resizeCorner) {
            case 'br':
                this.selectedStructure.width = Math.max(minSize, coords.x - this.selectedStructure.x);
                this.selectedStructure.height = Math.max(minSize, coords.y - this.selectedStructure.y);
                break;
            case 'bl':
                const newWidth = this.selectedStructure.x + this.selectedStructure.width - coords.x;
                if (newWidth >= minSize) {
                    this.selectedStructure.x = coords.x;
                    this.selectedStructure.width = newWidth;
                }
                this.selectedStructure.height = Math.max(minSize, coords.y - this.selectedStructure.y);
                break;
            case 'tr':
                this.selectedStructure.width = Math.max(minSize, coords.x - this.selectedStructure.x);
                const newHeight = this.selectedStructure.y + this.selectedStructure.height - coords.y;
                if (newHeight >= minSize) {
                    this.selectedStructure.y = coords.y;
                    this.selectedStructure.height = newHeight;
                }
                break;
            case 'tl':
                const newWidthTL = this.selectedStructure.x + this.selectedStructure.width - coords.x;
                const newHeightTL = this.selectedStructure.y + this.selectedStructure.height - coords.y;
                if (newWidthTL >= minSize) {
                    this.selectedStructure.x = coords.x;
                    this.selectedStructure.width = newWidthTL;
                }
                if (newHeightTL >= minSize) {
                    this.selectedStructure.y = coords.y;
                    this.selectedStructure.height = newHeightTL;
                }
                break;
        }
        this.drawLines();
        return;
    }

    // Handle structure dragging
    if (this.isDragging && this.selectedStructure) {
        this.selectedStructure.x = coords.x - this.dragPoint.x;
        this.selectedStructure.y = coords.y - this.dragPoint.y;
        this.drawLines();
        return;
    }

    // Handle point dragging
    if (this.isDragging && this.dragPoint) {
        this.segments[this.dragSegmentIndex][this.dragPointIndex] = coords;
        this.drawLines();
        this.updateSummary();
        return;
    }

    // Handle gate dragging
    if (this.isDraggingGate && this.dragGateIndex !== -1) {
        this.gates[this.dragGateIndex].x1 = coords.x - this.gates[this.dragGateIndex].width / 2;
        this.gates[this.dragGateIndex].y1 = coords.y - this.gates[this.dragGateIndex].height / 2;
        this.gates[this.dragGateIndex].x2 = coords.x + this.gates[this.dragGateIndex].width / 2;
        this.gates[this.dragGateIndex].y2 = coords.y + this.gates[this.dragGateIndex].height / 2;
        this.drawLines();
        return;
    }

    // Handle normal drawing with angle snapping
    if (this.isDrawing && this.currentSegment.length > 0) {
        const lastPoint = this.currentSegment[this.currentSegment.length - 1];
        const dx = Math.abs(coords.x - lastPoint.x);
        const dy = Math.abs(coords.y - lastPoint.y);

        // If close to horizontal or vertical, snap to it
        const snapAngleThreshold = 5;
        if (dx > dy && dy < snapAngleThreshold) {
            coords.y = lastPoint.y;
        } else if (dy > dx && dx < snapAngleThreshold) {
            coords.x = lastPoint.x;
        }
    }

    this.currentMousePos = coords;
    this.drawLines();
}

endDrawing(event) {
    // Clear any pending drag detection
    if (this.dragTimeout) {
        clearTimeout(this.dragTimeout);
        this.dragTimeout = null;
        this.pendingDrag = null;
    }

    if (this.isResizing || (this.isDragging && this.selectedStructure)) {
        this.isResizing = false;
        this.isDragging = false;
        this.selectedStructure = null;
        this.resizeCorner = null;
        this.dragPoint = null;
        return;
    }

    if (this.isDragging || this.isDraggingGate) {
        this.isDragging = false;
        this.isDraggingGate = false;
        this.dragPoint = null;
        this.dragSegmentIndex = -1;
        this.dragPointIndex = -1;
        this.dragGateIndex = -1;
        this.canvas.classList.remove('dragging');
        this.updateSummary();
        return;
    }

    if (this.isDrawing) {
        const coords = this.getAdjustedCoordinates(event);

        const snapPoint = this.findSnapPoint(coords.x, coords.y);
        if (snapPoint) {
            this.currentSegment.push(snapPoint);
            this.lastEndPoint = snapPoint;
        } else {
            this.currentSegment.push(coords);
            this.lastEndPoint = coords;
        }

        this.segments.push([...this.currentSegment]);
        this.drawLines();
        this.isDrawing = false;
        this.currentMousePos = null;
        this.updateSummary();
    }
}

    handleDoubleClick() {
        this.activeDrawing = false;
        this.lastEndPoint = null;
        if (this.isDrawing) {
            this.isDrawing = false;
            if (this.currentSegment.length > 1) {
                this.segments.push([...this.currentSegment]);
            }
            this.currentSegment = [];
            this.currentMousePos = null;
            this.drawLines();
            this.updateSummary();
        }
    }

    addGate() {
        const gateWidthPixels = document.getElementById("gateWidth").value * document.getElementById("scale").value;
        const gateHeightPixels = 20;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const newGate = {
            x1: centerX - gateWidthPixels / 2,
            y1: centerY - gateHeightPixels / 2,
            x2: centerX + gateWidthPixels / 2,
            y2: centerY + gateHeightPixels / 2,
            width: gateWidthPixels,
            height: gateHeightPixels,
            swing: document.getElementById("gateSwing").value,
            hingeSide: document.getElementById("gateHingeSide").value,
            orientation: document.getElementById("gateOrientation").value,
            postCount: parseInt(document.getElementById("gatePostCount").value)
        };
        this.gates.push(newGate);
        this.drawLines();
        this.updateSummary();
    }

    undoLine() {
        if (this.segments.length > 0) {
            this.segments.pop();
            this.drawLines();
            this.updateSummary();
        }
    }

    undoGate() {
        if (this.gates.length > 0) {
            this.gates.pop();
            this.drawLines();
            this.updateSummary();
        }
    }

    addStructure() {
        const centerX = this.canvas.width / 2 - 50;
        const centerY = this.canvas.height / 2 - 50;
        this.structures.push(new Structure(centerX, centerY));
        this.drawLines();
    }

    undoStructure() {
        if (this.structures.length > 0) {
            this.structures.pop();
            this.drawLines();
        }
    }

    resetDrawing() {
        this.clearCanvas();
        this.segments = [];
        this.gates = [];
        this.structures = [];
        this.currentSegment = [];
        this.isDrawing = false;
        this.activeDrawing = false;
        this.lastEndPoint = null;
        this.currentMousePos = null;
        this.updateSummary();
    }
}

class Structure {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 100;
        this.height = 100;
        this.dragTimeout = null;
        this.pendingDrag = null;

}

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(245, 245, 100, 0.7)';
        ctx.strokeStyle = 'black';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        this.drawCorner(ctx, this.x, this.y);
        this.drawCorner(ctx, this.x + this.width, this.y);
        this.drawCorner(ctx, this.x, this.y + this.height);
        this.drawCorner(ctx, this.x + this.width, this.y + this.height);

        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        const scale = document.getElementById("scale").value;
        const widthFeet = (this.width / scale).toFixed(1);
        const heightFeet = (this.height / scale).toFixed(1);

        ctx.fillText(`${widthFeet}'`, this.x + this.width/2 - 15, this.y - 5);
        ctx.fillText(`${heightFeet}'`, this.x - 20, this.y + this.height/2);

        ctx.restore();
    }

    drawCorner(ctx, x, y) {
        const CORNER_SIZE = 8;
        ctx.fillRect(x - CORNER_SIZE/2, y - CORNER_SIZE/2, CORNER_SIZE, CORNER_SIZE);
        ctx.strokeRect(x - CORNER_SIZE/2, y - CORNER_SIZE/2, CORNER_SIZE, CORNER_SIZE);
    }

    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    getResizeCorner(x, y) {
        const CORNER_SIZE = 8;
        const corners = [
            { x: this.x, y: this.y, type: 'tl' },
            { x: this.x + this.width, y: this.y, type: 'tr' },
            { x: this.x, y: this.y + this.height, type: 'bl' },
            { x: this.x + this.width, y: this.y + this.height, type: 'br' }
        ];

        for (const corner of corners) {
            if (Math.abs(x - corner.x) <= CORNER_SIZE/2 &&
                Math.abs(y - corner.y) <= CORNER_SIZE/2) {
                return corner.type;
            }
        }
        return null;
    }
}

// Initialize the drawing canvas when the module loads
const drawingCanvas = new DrawingCanvas();
export { drawingCanvas };