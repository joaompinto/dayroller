// eventHandlers.js

$(document).ready(function() {
    $(document).on('click', '.plan-category-element', handlePlanElementClick);
});

function toggleSelectMode() {
    calendarCore.isSelectMode = !calendarCore.isSelectMode;
    calendarCore.selectionState = 'none';
    clearSelection();
    
    if (calendarCore.isSelectMode) {
        calendarCore.updatePlanHeaderControls(calendarCore.selectModeInstructionText);
        startSelectionMode();
        hideDisabledDays();
    } else {
        calendarCore.updatePlanHeaderControls(calendarCore.defaultInstructionText);
        endSelectionMode();
        showDisabledDays();
    }
    calendarCore.attachButtonListeners();
    logSelectState();
}

function startSelectionMode() {
    $('#calendarBody').off('click', 'tr').on('click', 'tr', handleRowClick);
    console.log("Selection mode started - Row click listeners attached");
}

function endSelectionMode() {
    $('#calendarBody').off('click', 'tr');
    console.log("Selection mode ended - Row click listeners removed");
}

function handleRowClick(e) {
    if (!calendarCore.isSelectMode || $(e.target).hasClass('plan-category-element')) return;
    
    console.log("handleRowClick called", new Date().getTime());
    
    const row = $(e.currentTarget);
    const rowIndex = row.index();

    console.log(`Row clicked: ${rowIndex}`);

    switch (calendarCore.selectionState) {
        case 'none':
            clearSelection();
            selectSingleRow(rowIndex);
            calendarCore.firstSelectedIndex = rowIndex;
            calendarCore.selectionState = 'first';
            calendarCore.updatePlanHeaderControls(calendarCore.lastDayInstructionText);
            break;
        case 'first':
            calendarCore.lastSelectedIndex = rowIndex;
            selectRowsBetween(calendarCore.firstSelectedIndex, calendarCore.lastSelectedIndex);
            calendarCore.selectionState = 'complete';
            calendarCore.updatePlanHeaderControls(formatSelectionInfo());
            calendarCore.attachButtonListeners();
            break;
        case 'complete':
            clearSelection();
            selectSingleRow(rowIndex);
            calendarCore.firstSelectedIndex = rowIndex;
            calendarCore.lastSelectedIndex = -1;
            calendarCore.selectionState = 'first';
            calendarCore.updatePlanHeaderControls(calendarCore.lastDayInstructionText);
            break;
    }
    logSelectState();
}

function formatSelectionInfo() {
    const count = calendarCore.selectedRows.size;
    if (count === 0) {
        return calendarCore.defaultInstructionText;
    }

    let weekendCount = 0;
    calendarCore.selectedRows.forEach(rowIndex => {
        const row = $('#calendarBody tr').eq(rowIndex);
        if (row.hasClass('weekend')) {
            weekendCount++;
        }
    });

    let infoText = `<strong>${count}</strong> day${count !== 1 ? 's' : ''}`;
    if (weekendCount > 0) {
        infoText += ` (<strong>${weekendCount}</strong> weekend day${weekendCount !== 1 ? 's' : ''})`;
    }

    return `<button id="createEventBtn">Create Event</button> for <span class="selection-info">${infoText}</span>`;
}

function selectSingleRow(index) {
    $('#calendarBody tr').removeClass('selected-row');
    calendarCore.selectedRows.clear();
    const row = $('#calendarBody tr').eq(index);
    row.addClass('selected-row');
    calendarCore.selectedRows.add(index);
    calendarCore.lastSelectedIndex = index;
}

function selectRowsBetween(start, end) {
    const minIndex = Math.min(start, end);
    const maxIndex = Math.max(start, end);
    
    $('#calendarBody tr').each(function(index) {
        if (index >= minIndex && index <= maxIndex) {
            $(this).addClass('selected-row');
            calendarCore.selectedRows.add(index);
        } else {
            $(this).removeClass('selected-row');
            calendarCore.selectedRows.delete(index);
        }
    });
    
    calendarCore.lastSelectedIndex = end;
}

function handleCreateEvent() {
    console.log("Create event clicked");
    calendarCore.isSelectMode = false;
    
    const colorSelectionHTML = generateColorSelectionHTML();
    calendarCore.updatePlanHeaderControls(colorSelectionHTML);
    attachColorSelectionListeners();
}

function generateColorSelectionHTML() {
    let html = '<div class="color-selection">';
    html += '<span class="color-selection-text">Select event color: </span>';
    html += '<div class="color-button-container">';
    calendarCore.neutralColors.forEach((color, index) => {
        html += `<button class="color-button" style="background-color: ${color};" data-color="${color}"></button>`;
    });
    html += '</div></div>';
    return html;
}

function attachColorSelectionListeners() {
    $('.color-button').on('click', function() {
        const selectedColor = $(this).data('color');
        console.log(`Selected color: ${selectedColor}`);
        showEventNameInput(selectedColor);
    });
}

function showEventNameInput(selectedColor) {
    const inputHTML = `
        <div class="event-name-input">
            <input type="text" id="eventNameInput" placeholder="Enter event name">
            <button id="createEventBtn" style="background-color: ${selectedColor};">Create</button>
        </div>
    `;
    calendarCore.updatePlanHeaderControls(inputHTML);
    
    $('#eventNameInput').focus();
    
    attachEventNameInputListeners(selectedColor);
}

function attachEventNameInputListeners(selectedColor) {
    $('#createEventBtn').on('click', function() {
        const eventName = $('#eventNameInput').val().trim();
        if (eventName) {
            createEventWithColorAndName(selectedColor, eventName);
        } else {
            alert('Please enter an event name');
        }
    });

    $('#eventNameInput').on('keypress', function(e) {
        if (e.which === 13) {
            $('#createEventBtn').click();
        }
    });
}

function createEventWithColorAndName(color, name) {
    console.log(`Creating event: ${name} with color: ${color}`);
    
    // Create the event element
    const eventElement = $('<button>')
        .addClass('plan-category-element')
        .text(name)
        .css('background-color', color)
        .data('category', name)
        .data('details', '')
        .attr('data-has-details', 'false');

    // Add the event to each selected row
    calendarCore.selectedRows.forEach(rowIndex => {
        const row = $('#calendarBody tr').eq(rowIndex);
        const planCell = row.find('.plan-cell');
        planCell.append(eventElement.clone());
    });

    // Reset selection and state
    clearSelection();
    calendarCore.isSelectMode = false;
    calendarCore.selectionState = 'none';
    calendarCore.updatePlanHeaderControls(calendarCore.defaultInstructionText);
    calendarCore.attachButtonListeners();
    logSelectState();
}

function clearSelection() {
    $('.calendar-row').removeClass('selected-row');
    calendarCore.selectedRows.clear();
    calendarCore.firstSelectedIndex = -1;
    calendarCore.lastSelectedIndex = -1;
    console.log("Selection cleared");
}

function logSelectState() {
    console.log(`Select Mode: ${calendarCore.isSelectMode}, Selection State: ${calendarCore.selectionState}, First Index: ${calendarCore.firstSelectedIndex}, Last Index: ${calendarCore.lastSelectedIndex}`);
}

function handlePlanElementClick(e) {
    e.stopPropagation();
    const button = $(e.currentTarget);
    const name = button.text();
    const color = button.css('background-color');
    const details = button.data('details') || '';
    
    showEventEditModal(button, name, color, details);
}

function showEventEditModal(button, name, color, details) {
    const modalHTML = `
        <div class="event-modal">
            <h3>Edit Event</h3>
            <input type="text" id="editEventName" value="${name}" placeholder="Event name">
            <textarea id="editEventDetails" placeholder="Event details">${details}</textarea>
            <div class="modal-buttons">
                <button id="saveEventChanges">Save</button>
                <button id="cancelEventChanges">Cancel</button>
                <button id="deleteEvent">Delete</button>
            </div>
        </div>
    `;

    $('body').append(modalHTML);
    
    const modal = $('.event-modal');
    modal.css('display', 'block');

    $('#saveEventChanges').on('click', function() {
        const newName = $('#editEventName').val().trim();
        const newDetails = $('#editEventDetails').val().trim();
        
        if (newName) {
            button.text(newName);
            button.data('details', newDetails);
            button.attr('data-has-details', newDetails !== '' ? 'true' : 'false');
        }
        modal.remove();
    });

    $('#cancelEventChanges').on('click', function() {
        modal.remove();
    });

    $('#deleteEvent').on('click', function() {
        if (confirm('Are you sure you want to delete this event?')) {
            button.remove();
            modal.remove();
        }
    });
}

function hideDisabledDays() {
    $('#calendarBody tr.disabled-day').hide();
}

function showDisabledDays() {
    $('#calendarBody tr.disabled-day').show();
}

// Make sure to keep the functions that need to be in the global scope
window.toggleSelectMode = toggleSelectMode;
window.handleCreateEvent = handleCreateEvent;