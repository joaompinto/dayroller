// eventHandlers.js

$(document).ready(function() {
    $(document).on('click', '.plan-category-element', handlePlanElementClick);
});

function toggleSelectMode() {
    calendarCore.isSelectMode = !calendarCore.isSelectMode;
    calendarCore.selectionState = 'none';
    clearSelection();
    
    if (calendarCore.isSelectMode) {
        updatePlanHeaderControls(calendarCore.selectModeInstructionText);
        startSelectionMode();
    } else {
        updatePlanHeaderControls(calendarCore.defaultInstructionText);
        endSelectionMode();
    }
    attachButtonListeners();
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
            updatePlanHeaderControls(calendarCore.lastDayInstructionText);
            break;
        case 'first':
            calendarCore.lastSelectedIndex = rowIndex;
            selectRowsBetween(calendarCore.firstSelectedIndex, calendarCore.lastSelectedIndex);
            calendarCore.selectionState = 'complete';
            updatePlanHeaderControls(formatSelectionInfo());
            attachButtonListeners();
            break;
        case 'complete':
            clearSelection();
            selectSingleRow(rowIndex);
            calendarCore.firstSelectedIndex = rowIndex;
            calendarCore.lastSelectedIndex = -1;
            calendarCore.selectionState = 'first';
            updatePlanHeaderControls(calendarCore.lastDayInstructionText);
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
        infoText += ` (<strong>${weekendCount}</strong> on weekend)`;
    }

    return `
        <div class="selection-info-container">
            <div class="selection-info">${infoText}</div>
            <button id="createEventBtn">Create Event</button>
        </div>
    `;
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
    updatePlanHeaderControls(colorSelectionHTML);
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
    updatePlanHeaderControls(inputHTML);
    
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
    
    const selectedRows = $('#calendarBody tr.selected-row');
    if (selectedRows.length === 0) {
        console.error('No rows selected');
        return;
    }

    const firstRow = selectedRows.first();
    const lastRow = selectedRows.last();

    const startDate = new Date(
        parseInt(firstRow.attr('data-year')),
        getMonthNumber(firstRow.attr('data-month')),
        parseInt(firstRow.attr('data-day'))
    );

    const endDate = new Date(
        parseInt(lastRow.attr('data-year')),
        getMonthNumber(lastRow.attr('data-month')),
        parseInt(lastRow.attr('data-day'))
    );

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Invalid date created', { startDate, endDate });
        return;
    }

    const event = {
        name: name,
        color: color,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        details: ''
    };

    saveEventToStorage(event);
    addEventToCalendar(event);

    // Reset selection and state
    clearSelection();
    calendarCore.isSelectMode = false;
    calendarCore.selectionState = 'none';
    updatePlanHeaderControls(calendarCore.defaultInstructionText);
    attachButtonListeners();
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
    const event = button.data('event');
    
    showEventEditModal(button, event);
}

function showEventEditModal(button, event) {
    const modalHTML = `
        <div class="event-modal">
            <h3>Edit Event</h3>
            <input type="text" id="editEventName" value="${event.name}" placeholder="Event name">
            <textarea id="editEventDetails" placeholder="Event details">${event.details || ''}</textarea>
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
            const newEvent = {...event, name: newName, details: newDetails};
            updateEventInStorage(event, newEvent);
            button.text(newName);
            button.data('event', newEvent);
            button.attr('data-has-details', newDetails !== '' ? 'true' : 'false');
        }
        modal.remove();
    });

    $('#cancelEventChanges').on('click', function() {
        modal.remove();
    });

    $('#deleteEvent').on('click', function() {
        if (confirm('Are you sure you want to delete this event?')) {
            deleteEventFromStorage(event);
            removeEventFromCalendar(event);
            modal.remove();
        }
    });
}

function saveEventToStorage(event) {
    const events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
    events.push(event);
    localStorage.setItem('calendarEvents', JSON.stringify(events));
}

function updateEventInStorage(oldEvent, newEvent) {
    const events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
    const index = events.findIndex(e => 
        e.name === oldEvent.name && 
        e.color === oldEvent.color && 
        e.startDate === oldEvent.startDate && 
        e.endDate === oldEvent.endDate
    );
    if (index !== -1) {
        events[index] = newEvent;
        localStorage.setItem('calendarEvents', JSON.stringify(events));
    }
}

function deleteEventFromStorage(event) {
    const events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
    const filteredEvents = events.filter(e => 
        !(e.name === event.name && 
          e.color === event.color && 
          e.startDate === event.startDate && 
          e.endDate === event.endDate)
    );
    localStorage.setItem('calendarEvents', JSON.stringify(filteredEvents));
}

function removeEventFromCalendar(event) {
    $('.plan-category-element').each(function() {
        const buttonEvent = $(this).data('event');
        if (buttonEvent.name === event.name &&
            buttonEvent.color === event.color &&
            buttonEvent.startDate === event.startDate &&
            buttonEvent.endDate === event.endDate) {
            $(this).remove();
        }
    });
}

function getMonthNumber(monthName) {
    const months = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    return months[monthName] !== undefined ? months[monthName] : -1;
}

// Make sure to keep the functions that need to be in the global scope
window.toggleSelectMode = toggleSelectMode;
window.handleCreateEvent = handleCreateEvent;