// Food data with nutrition information
const foodData = {
    vegetable: [
        { name: 'broccoli', icon: '🥦', weight: '80g', color: '#228B22', calories: 24, protein: 3.2, carbs: 4.8, fat: 0.8, fiber: 4.0, customIcon: 'broccoli' },
        { name: 'onion', icon: '🧅', weight: '8g', color: '#FFC0CB', calories: 3.2, protein: 0.1, carbs: 0.7, fat: 0.1, fiber: 0.2, customIcon: 'onion' },
        { name: 'spinach', icon: '🥬', weight: '80g', color: '#006400', calories: 16, protein: 2.4, carbs: 2.4, fat: 0.8, fiber: 3.2, customIcon: 'spinach' },
        { name: 'mushroom', icon: '🍄', weight: '60g', color: '#F5F5DC', calories: 12, protein: 1.8, carbs: 1.8, fat: 0.6, fiber: 1.8, customIcon: 'mushroom' }
    ],
    protein: [
        { name: 'shrimp', icon: '🦐', weight: '80g', color: '#FFB6C1', calories: 80, protein: 16.0, carbs: 0, fat: 0.8, fiber: 0, customIcon: 'shrimp' },
        { name: 'salmon', icon: '🐟', weight: '150g', color: '#FFA07A', calories: 300, protein: 31.5, carbs: 0, fat: 18.0, fiber: 0, customIcon: 'salmon' },
        { name: 'steak', icon: '🥩', weight: '150g', color: '#8B4513', calories: 375, protein: 37.5, carbs: 0, fat: 22.5, fiber: 0, customIcon: 'steak' },
        { name: 'chicken', icon: '🍗', weight: '120g', color: '#FFB6C1', calories: 192, protein: 27.6, carbs: 0, fat: 8.4, fiber: 0, customIcon: 'chicken' },
        { name: 'eggs', icon: '🥚', weight: '50g', color: '#FFFACD', calories: 75, protein: 6.5, carbs: 0.5, fat: 5.5, fiber: 0, customIcon: 'eggs' }
    ],
    carb: [
        { name: 'potato', icon: '🍠', weight: '150g', color: '#FF8C00', calories: 120, protein: 3.0, carbs: 28.5, fat: 1.5, fiber: 4.5, customIcon: 'potato' },
        { name: 'rice', icon: '🍚', weight: '150g', color: '#8B4513', calories: 165, protein: 3.0, carbs: 34.5, fat: 1.5, fiber: 3.0, customIcon: 'rice' },
        { name: 'pasta', icon: '🍝', weight: '130g', color: '#F5F5DC', calories: 455, protein: 15.6, carbs: 92.3, fat: 2.6, fiber: 3.9, customIcon: 'pasta' }
    ]
};

// App state
let currentCategory = 'vegetable';
let plateItems = [];
let draggedElement = null;
let selectedItemId = null;
let hoveredItemId = null;
let interactionMode = 'idle'; // 'idle' | 'drag' | 'scale' | 'rotate'
let hideTimeout = null;

// DOM elements
const foodGrid = document.getElementById('foodGrid');
const mealPlate = document.getElementById('mealPlate');
const nutritionContent = document.getElementById('nutritionContent');
const categoryTabs = document.querySelectorAll('.category-tab');
const resetBtn = document.getElementById('resetBtn');
const saveBtn = document.getElementById('saveBtn');

// Initialize the app
function init() {
    renderFoodGrid();
    setupEventListeners();
    updateNutritionDisplay();
}

// Render food grid based on current category
function renderFoodGrid() {
    foodGrid.innerHTML = '';
    
    foodData[currentCategory].forEach((food, index) => {
        const foodItem = document.createElement('div');
        foodItem.className = 'food-item';
        foodItem.draggable = true;
        foodItem.dataset.foodIndex = index;
        foodItem.dataset.category = currentCategory;
        
        foodItem.innerHTML = `
            <div class="food-icon ${food.customIcon ? 'custom-icon' : ''}" style="background-color: ${food.color}">
                ${food.customIcon ? `<div class="custom-icon-${food.customIcon}"></div>` : `<span style="font-size: 2rem;">${food.icon}</span>`}
            </div>
            <div class="food-name">${food.name}</div>
            <div class="food-weight">${food.weight}</div>
        `;
        
        foodGrid.appendChild(foodItem);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Category tab switching
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = tab.dataset.category;
            renderFoodGrid();
        });
    });
    
    // Drag and drop events for food items (using event delegation)
    foodGrid.addEventListener('dragstart', handleDragStart);
    foodGrid.addEventListener('dragend', handleDragEnd);
    
    // Plate drop zone
    mealPlate.addEventListener('dragover', handleDragOver, true); // useCapture = true
    mealPlate.addEventListener('drop', handleDrop, true);
    mealPlate.addEventListener('dragenter', handleDragEnter, true);
    mealPlate.addEventListener('dragleave', handleDragLeave, true);
    
    // Global click handler to clear selection
    document.addEventListener('mousedown', (e) => {
        // Don't clear selection if clicking on a handle or action button
        if (e.target.classList.contains('corner-handle') || 
            e.target.classList.contains('action-btn') ||
            e.target.closest('.plate-food-item')) {
            return;
        }
        clearSelection();
    });
    
    // Button events
    resetBtn.addEventListener('click', resetPlate);
    saveBtn.addEventListener('click', saveMeal);
}

// Drag and drop handlers
function handleDragStart(e) {
    if (e.target.classList.contains('food-item')) {
        draggedElement = e.target;
        e.target.classList.add('dragging');
        document.body.classList.add('is-dragging');   // NEW
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
    }
}

function handleDragEnd(e) {
    if (e.target.classList.contains('food-item')) {
        e.target.classList.remove('dragging');
        document.body.classList.remove('is-dragging'); // NEW
        // Don't reset draggedElement here, let handleDrop do it
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

function handleDragEnter(e) {
    e.preventDefault();
    mealPlate.classList.add('drag-over');
}

function handleDragLeave(e) {
    if (!mealPlate.contains(e.relatedTarget)) {
        mealPlate.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    mealPlate.classList.remove('drag-over');
    
    if (draggedElement) {
        const foodIndex = parseInt(draggedElement.dataset.foodIndex);
        const category = draggedElement.dataset.category;
        const food = { ...foodData[category][foodIndex], category }; // carry category
        
        // Always create a new item when dropping from the food grid
        addFoodToPlate(food, e.offsetX, e.offsetY);
        
        // Reset draggedElement after successful drop
        draggedElement = null;
        document.body.classList.remove('is-dragging');
    }
}

// Add food item to plate
function addFoodToPlate(food, x, y) {
    const plateRect = mealPlate.getBoundingClientRect();
    const plateCenterX = plateRect.width / 2;
    const plateCenterY = plateRect.height / 2;
    
    // Calculate position relative to plate center, accounting for item size
    const itemSize = 80; // Base size of plate items
    const relativeX = x - plateCenterX;
    const relativeY = y - plateCenterY;
    
    // Check if drop is within plate bounds (circle) - more generous for multiple items
    const distance = Math.sqrt(relativeX * relativeX + relativeY * relativeY);
    const plateRadius = plateRect.width / 2 - 30; // Generous margin for scaled items
    
    if (distance > plateRadius) {
        return; // Drop outside plate bounds
    }
    
    const plateItem = {
        id: Date.now() + Math.random(),
        food: food,
        x: relativeX,
        y: relativeY,
        scale: 2, // Start at 2x size for better visibility
        rotation: 0
    };
    
    plateItems.push(plateItem);
    renderPlateItems();
    updateNutritionDisplay();
}

// Render food items on plate
function renderPlateItems() {
    // Clear existing plate items
    const existingItems = mealPlate.querySelectorAll('.plate-food-item');
    existingItems.forEach(item => item.remove());
    
    // Hide placeholder if items exist
    const placeholder = mealPlate.querySelector('.plate-placeholder');
    if (placeholder) {
        placeholder.style.display = plateItems.length > 0 ? 'none' : 'block';
    }
    
    // Get live plate center
    const plateRect = mealPlate.getBoundingClientRect();
    const plateCenterX = plateRect.width / 2;
    const plateCenterY = plateRect.height / 2;
    
    // Render each plate item
    plateItems.forEach(item => {
        const plateItemElement = document.createElement('div');
        plateItemElement.className = 'plate-food-item';
        plateItemElement.style.left = `${item.x + plateCenterX}px`; // Use live plate center
        plateItemElement.style.top = `${item.y + plateCenterY}px`; // Use live plate center
        plateItemElement.style.transform = `scale(${item.scale}) rotate(${item.rotation}deg)`;
        plateItemElement.dataset.itemId = item.id;
        
        plateItemElement.innerHTML = `
            <div class="bounding-box">
                <div class="action-buttons">
                    <button class="action-btn rotate-btn" title="Rotate">⟲</button>
                    <button class="action-btn delete-btn" title="Delete">🗑</button>
                </div>
                <div class="bounding-box-border">
                    <div class="corner-handle top-left" title="Resize"></div>
                    <div class="corner-handle top-right" title="Resize"></div>
                    <div class="corner-handle bottom-left" title="Resize"></div>
                    <div class="corner-handle bottom-right" title="Resize"></div>
                </div>
                <div class="food-content">
                    ${item.food.customIcon ? 
                        `<div class="custom-icon-${item.food.customIcon} plate-icon" style="background-image: url('${item.food.customIcon === 'broccoli' ? 'Broccoli2' : item.food.customIcon}.png')"></div>` : 
                        `<div class="emoji-icon plate-icon"><span style="font-size: 3.5rem;">${item.food.icon}</span></div>`
                    }
                </div>
            </div>
        `;
        
        // Setup freeform interactions
        setupFreeformInteractions(plateItemElement, item);
        
        mealPlate.appendChild(plateItemElement);
    });
    
    // Update visibility after rendering
    updateBoundingBoxVisibility();
}

// Freeform interaction setup
function setupFreeformInteractions(element, item) {
    let startX, startY, startScale, startRotation;
    let dragOffsetX, dragOffsetY;
    let dragPointerId = null;
    
    // Action button events
    const deleteBtn = element.querySelector('.delete-btn');
    const rotateBtn = element.querySelector('.rotate-btn');
    
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removePlateItem(item.id);
    });
    
    // Rotate button pointer events
    rotateBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        interactionMode = 'rotate';
        setSelectedItem(item.id);
        
        // Store initial rotation and pointer position
        startRotation = item.rotation;
        startX = e.clientX;
        startY = e.clientY;
        
        // Capture pointer to continue rotation even if cursor leaves the button
        rotateBtn.setPointerCapture(e.pointerId);
        
        // Add visual feedback
        rotateBtn.style.transform = 'scale(1.1)';
    });
    
    // Hover events for bounding box visibility
    element.addEventListener('mouseenter', () => {
        setHoveredItem(item.id);
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }
    });
    
    element.addEventListener('mouseleave', () => {
        setHoveredItem(null);
        scheduleHideBoundingBox();
    });
    
    // Pointer events for dragging
    element.addEventListener('pointerdown', (e) => {
        if (e.target.classList.contains('action-btn') ||
            e.target.classList.contains('corner-handle')) {
            return;
        }

        interactionMode = 'drag';
        setSelectedItem(item.id);               // NEW: mark the active item
        element.classList.add('dragging');

        const plateRect = mealPlate.getBoundingClientRect();
        const currentLeft = parseFloat(element.style.left) || 0;
        const currentTop  = parseFloat(element.style.top)  || 0;

        // Offset model aligned to styled left/top (pre-transform)
        dragOffsetX = e.clientX - (plateRect.left + currentLeft);
        dragOffsetY = e.clientY - (plateRect.top  + currentTop);

        // Capture this pointer and remember its id
        dragPointerId = e.pointerId;            // NEW
        if (element.setPointerCapture) element.setPointerCapture(dragPointerId);

        e.preventDefault();
    });
    
    // Corner handle events for scaling
    const cornerHandles = element.querySelectorAll('.corner-handle');
    cornerHandles.forEach(handle => {
        handle.addEventListener('pointerdown', (e) => {
            interactionMode = 'scale';
            setSelectedItem(item.id);
            startX = e.clientX;
            startY = e.clientY;
            startScale = item.scale;
            
            // Store which corner is being dragged
            const corner = handle.className.includes('top-left') ? 'top-left' :
                          handle.className.includes('top-right') ? 'top-right' :
                          handle.className.includes('bottom-left') ? 'bottom-left' : 'bottom-right';
            handle.dataset.draggingCorner = corner;
            
            e.preventDefault();
            e.stopPropagation();
        });
    });
    
    // Global pointer move
    document.addEventListener('pointermove', (e) => {
        if (interactionMode === 'rotate') {
            // Only the active (selected) item should react
            if (selectedItemId !== item.id) return;

            const elementRect = element.getBoundingClientRect();
            const elementCenterX = elementRect.left + elementRect.width / 2;
            const elementCenterY = elementRect.top + elementRect.height / 2;

            const currentAngle = Math.atan2(e.clientY - elementCenterY, e.clientX - elementCenterX);
            const initialAngle = Math.atan2(startY - elementCenterY, startX - elementCenterX);
            let rotationDelta = (currentAngle - initialAngle) * (180 / Math.PI);

            item.rotation = startRotation + rotationDelta;
            element.style.transform = `scale(${item.scale}) rotate(${item.rotation}deg)`;
            element.style.transformOrigin = 'center center';
            return;
        }

        if (interactionMode === 'drag') {
            // Only the active (selected) item, and only the same pointer, should move
            if (selectedItemId !== item.id) return;                         // NEW
            if (dragPointerId != null && e.pointerId !== dragPointerId) return; // NEW

            const plateRect = mealPlate.getBoundingClientRect();
            const newLeft = e.clientX - plateRect.left - dragOffsetX;
            const newTop  = e.clientY - plateRect.top  - dragOffsetY;

            // Keep within plate bounds
            const centerX = plateRect.width / 2;
            const centerY = plateRect.height / 2;
            const distance = Math.sqrt((newLeft - centerX) ** 2 + (newTop - centerY) ** 2);
            const maxDistance = plateRect.width / 2 - 30;

            if (distance <= maxDistance) {
                item.x = newLeft - centerX;
                item.y = newTop  - centerY;
                element.style.left = `${item.x + centerX}px`;
                element.style.top  = `${item.y + centerY}px`;
            }
        } else if (interactionMode === 'scale') {
            // Only the active (selected) item should scale
            if (selectedItemId !== item.id) return;                         // NEW

            const activeHandle = element.querySelector('.corner-handle[data-dragging-corner]');
            if (!activeHandle) return;

            const corner = activeHandle.dataset.draggingCorner;
            const elementRect = element.getBoundingClientRect();

            const elementCenterX = elementRect.left + elementRect.width / 2;
            const elementCenterY = elementRect.top + elementRect.height / 2;

            const deltaX = e.clientX - elementCenterX;
            const deltaY = e.clientY - elementCenterY;

            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const baseSize = 60;

            let newScale;
            if (corner === 'top-left' || corner === 'bottom-right') {
                newScale = Math.max(0.3, Math.min(3, distance / (baseSize / 2)));
            } else {
                const absDeltaX = Math.abs(deltaX);
                const absDeltaY = Math.abs(deltaY);
                const maxDelta = Math.max(absDeltaX, absDeltaY);
                newScale = Math.max(0.3, Math.min(3, maxDelta / (baseSize / 2)));
            }

            item.scale = newScale;
            element.style.transform = `scale(${item.scale}) rotate(${item.rotation}deg)`;
            element.style.transformOrigin = 'center center';
        }
    });
    
    // Cleanup function for drag operations
    function cleanupDrag(e) {
        // Always clear visual state, regardless of interactionMode
        element.classList.remove('dragging');
      
        // Reset mode only if we were dragging
        if (interactionMode === 'drag') {
          interactionMode = 'idle';
        }
      
        // Release pointer capture safely with the stored id
        if (dragPointerId != null && element.releasePointerCapture) {
          try { element.releasePointerCapture(dragPointerId); } catch (_) {}
          dragPointerId = null;
        }
      
        // Re-evaluate hover state after interaction ends
        setTimeout(() => {
          if (hoveredItemId !== item.id && selectedItemId !== item.id) {
            clearSelection();
          }
        }, 50);
      }
    
    // Global pointer up
    document.addEventListener('pointerup', cleanupDrag);
    
    // Additional cleanup handlers for edge cases
    document.addEventListener('pointercancel', cleanupDrag);
    element.addEventListener('lostpointercapture', cleanupDrag);
    
    // Handle window focus loss
    window.addEventListener('blur', cleanupDrag);
    
    // Global pointer up (for non-drag interactions)
    document.addEventListener('pointerup', () => {
        if (interactionMode === 'scale') {
            interactionMode = 'idle';
            
            // Clear corner dragging state
            const activeHandle = element.querySelector('.corner-handle[data-dragging-corner]');
            if (activeHandle) {
                delete activeHandle.dataset.draggingCorner;
            }
            
            // Re-evaluate hover state after scale ends
            setTimeout(() => {
                if (hoveredItemId !== item.id && selectedItemId !== item.id) {
                    clearSelection();
                }
            }, 50);
        } else if (interactionMode === 'rotate') {
            interactionMode = 'idle';
            
            // Release pointer capture and reset button style
            if (rotateBtn.releasePointerCapture) {
                rotateBtn.releasePointerCapture();
            }
            rotateBtn.style.transform = '';
            
            // Re-evaluate hover state after rotation ends
            setTimeout(() => {
                if (hoveredItemId !== item.id && selectedItemId !== item.id) {
                    clearSelection();
                }
            }, 50);
        }
    });
}

// Bounding box visibility management
function updateBoundingBoxVisibility() {
    plateItems.forEach(item => {
        const element = document.querySelector(`[data-item-id="${item.id}"]`);
        if (!element) return;
        
        const shouldShow = shouldShowBoundingBox(item.id);
        const boundingBox = element.querySelector('.bounding-box');
        
        if (shouldShow) {
            boundingBox.classList.add('visible');
        } else {
            boundingBox.classList.remove('visible');
        }
    });
}

function shouldShowBoundingBox(itemId) {
    return hoveredItemId === itemId || 
           selectedItemId === itemId || 
           (interactionMode !== 'idle' && selectedItemId === itemId);
}

function setHoveredItem(itemId) {
    if (hoveredItemId !== itemId) {
        hoveredItemId = itemId;
        updateBoundingBoxVisibility();
    }
}

function setSelectedItem(itemId) {
    if (selectedItemId !== itemId) {
        selectedItemId = itemId;
        updateBoundingBoxVisibility();
    }
}

function clearSelection() {
    if (selectedItemId !== null) {
        selectedItemId = null;
        updateBoundingBoxVisibility();
    }
}

function scheduleHideBoundingBox() {
    if (hideTimeout) {
        clearTimeout(hideTimeout);
    }
    hideTimeout = setTimeout(() => {
        if (interactionMode === 'idle' && hoveredItemId === null && selectedItemId === null) {
            updateBoundingBoxVisibility();
        }
    }, 200); // 200ms delay to prevent flicker
}



// Remove food item from plate
function removePlateItem(itemId) {
    plateItems = plateItems.filter(item => item.id !== itemId);
    
    // Clear selection if this item was selected
    if (selectedItemId === itemId) {
        selectedItemId = null;
    }
    if (hoveredItemId === itemId) {
        hoveredItemId = null;
    }
    
    renderPlateItems();
    updateNutritionDisplay();
}

// Update nutrition display
function updateNutritionDisplay() {
    // Get or create placeholder and facts elements
    let placeholder = nutritionContent.querySelector('.nutrition-placeholder');
    let facts = nutritionContent.querySelector('.nutrition-facts');
    
    if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.className = 'nutrition-placeholder';
        placeholder.innerHTML = `
            <i class="fas fa-chart-pie"></i>
            <p>Drag food onto the plate to see nutrition facts.</p>
        `;
        nutritionContent.appendChild(placeholder);
    }
    
    if (!facts) {
        facts = document.createElement('div');
        facts.className = 'nutrition-facts';
        facts.innerHTML = `
            <div class="nutrition-item">
                <span class="nutrition-label">Calories</span>
                <span class="nutrition-value">0 kcal</span>
            </div>
            <div class="nutrition-item">
                <span class="nutrition-label">Protein</span>
                <span class="nutrition-value">0g</span>
            </div>
            <div class="nutrition-item">
                <span class="nutrition-label">Carbohydrates</span>
                <span class="nutrition-value">0g</span>
            </div>
            <div class="nutrition-item">
                <span class="nutrition-label">Fat</span>
                <span class="nutrition-value">0g</span>
            </div>
            <div class="nutrition-item">
                <span class="nutrition-label">Fiber</span>
                <span class="nutrition-value">0g</span>
            </div>
        `;
        nutritionContent.appendChild(facts);
    }
    
    if (plateItems.length === 0) {
        placeholder.style.display = 'flex';
        facts.style.display = 'none';
        return;
    }
    
    // Show facts and hide placeholder
    placeholder.style.display = 'none';
    facts.style.display = 'block';
    
    // Calculate total nutrition
    const totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
    };
    
    plateItems.forEach(item => {
        totals.calories += item.food.calories;
        totals.protein += item.food.protein;
        totals.carbs += item.food.carbs;
        totals.fat += item.food.fat;
        totals.fiber += item.food.fiber;
    });
    
    // Round to 1 decimal place
    Object.keys(totals).forEach(key => {
        totals[key] = Math.round(totals[key] * 10) / 10;
    });
    
    // Update nutrition values
    const valueElements = facts.querySelectorAll('.nutrition-value');
    valueElements[0].textContent = `${totals.calories} kcal`;
    valueElements[1].textContent = `${totals.protein}g`;
    valueElements[2].textContent = `${totals.carbs}g`;
    valueElements[3].textContent = `${totals.fat}g`;
    valueElements[4].textContent = `${totals.fiber}g`;
}

// Reset plate
function resetPlate() {
    plateItems = [];
    renderPlateItems();
    updateNutritionDisplay();
}

// Save meal
function saveMeal() {
    if (plateItems.length === 0) {
        alert('Please add some food to your plate before saving!');
        return;
    }
    
    const mealData = {
        items: plateItems.map(item => ({
            name: item.food.name,
            category: item.food.category,   // FIXED
            weight: item.food.weight
        })),
        timestamp: new Date().toISOString(),
        nutrition: calculateNutritionTotals()
    };
    
    // In a real app, you would save this to a database
    // For now, we'll just show an alert
    alert('Meal saved successfully! This feature would save to your meal history in a full application.');
    console.log('Saved meal:', mealData);
}

// Calculate nutrition totals
function calculateNutritionTotals() {
    const totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
    };
    
    plateItems.forEach(item => {
        totals.calories += item.food.calories;
        totals.protein += item.food.protein;
        totals.carbs += item.food.carbs;
        totals.fat += item.food.fat;
        totals.fiber += item.food.fiber;
    });
    
    return totals;
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
